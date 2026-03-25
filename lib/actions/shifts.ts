"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// ---------------------------------------------------------------------------
// Auth guard
// ---------------------------------------------------------------------------

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("No autorizado")
  return session
}

// ---------------------------------------------------------------------------
// generateMonth
//
// Triggers full month generation via the generation service.
// Falls back to a stub if the service is not available (Phase 2).
// ---------------------------------------------------------------------------
export async function generateMonth(mes: number, anio: number): Promise<void> {
  await requireSession()

  try {
    // Dynamically import so the stub path doesn't break if generation service
    // doesn't exist — this will happen if Phase 2 is not deployed yet.
    const { triggerGeneration } = await import("@/lib/actions/generation")
    await triggerGeneration(mes, anio)
  } catch (err) {
    // If generation module not found, throw stub error
    throw new Error("Servicio de generación no implementado (Phase 2)")
  }

  revalidatePath("/planilla")
}

// ---------------------------------------------------------------------------
// clearShifts
//
// Deletes ALL shifts for the given month (both manual and generated).
// ---------------------------------------------------------------------------
export async function clearShifts(mes: number, anio: number): Promise<void> {
  await requireSession()

  const firstDay = new Date(Date.UTC(anio, mes - 1, 1))
  const lastDay = new Date(Date.UTC(anio, mes, 0))

  await prisma.shift.deleteMany({
    where: {
      date: { gte: firstDay, lte: lastDay },
    },
  })

  revalidatePath("/planilla")
}

// ---------------------------------------------------------------------------
// clearAbsences
//
// Deletes all absences that overlap with the given month.
// Overlap: startDate <= lastDay AND endDate >= firstDay
// ---------------------------------------------------------------------------
export async function clearAbsences(mes: number, anio: number): Promise<void> {
  await requireSession()

  const firstDay = new Date(Date.UTC(anio, mes - 1, 1))
  const lastDay = new Date(Date.UTC(anio, mes, 0))

  await prisma.absence.deleteMany({
    where: {
      startDate: { lte: lastDay },
      endDate: { gte: firstDay },
    },
  })

  revalidatePath("/planilla")
}

// ---------------------------------------------------------------------------
// assignShift
//
// Manually assigns a shift, novedad (absence), or rest day to an employee
// on a specific date. Covers 3 cases:
//   1. absenceType set → create single-day absence, delete any existing shift
//   2. templateId null, absenceType null → descanso: upsert shift with null timeSlot
//   3. templateId set → upsert shift from template data
// ---------------------------------------------------------------------------
export async function assignShift(
  employeeId: number,
  date: string,           // ISO "2025-03-15"
  templateId: number | null,
  absenceType: string | null
): Promise<void> {
  await requireSession()

  const dateObj = new Date(date + "T00:00:00Z")

  if (absenceType) {
    // Es una novedad: crear absence de un día
    await prisma.absence.create({
      data: {
        employeeId,
        startDate: dateObj,
        endDate: dateObj,
        type: absenceType,
      },
    })
    // Si había un shift ese día, eliminarlo
    await prisma.shift.deleteMany({ where: { employeeId, date: dateObj } })
  } else if (templateId === null) {
    // Descanso: shift con timeSlot null
    await prisma.shift.upsert({
      where: { employeeId_date: { employeeId, date: dateObj } },
      create: { employeeId, date: dateObj, timeSlot: null, isManual: true },
      update: { timeSlot: null, areaId: null, isManual: true },
    })
    // Si había una ausencia ese día, eliminarla
    await prisma.absence.deleteMany({
      where: { employeeId, startDate: dateObj, endDate: dateObj },
    })
  } else {
    // Turno con plantilla: buscar la plantilla, upsert el shift
    const template = await prisma.shiftTemplate.findUnique({
      where: { id: templateId },
      include: { area: true },
    })
    if (!template) throw new Error("Plantilla no encontrada")
    await prisma.shift.upsert({
      where: { employeeId_date: { employeeId, date: dateObj } },
      create: {
        employeeId,
        date: dateObj,
        timeSlot: template.timeSlot,
        areaId: template.areaId,
        isManual: true,
      },
      update: {
        timeSlot: template.timeSlot,
        areaId: template.areaId,
        isManual: true,
      },
    })
    await prisma.absence.deleteMany({
      where: { employeeId, startDate: dateObj, endDate: dateObj },
    })
  }

  revalidatePath("/planilla")
  revalidatePath("/asignacion-manual")
}
