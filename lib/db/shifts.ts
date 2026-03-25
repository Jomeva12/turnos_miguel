import { prisma } from "@/lib/db"
import { startOfMonth, endOfMonth } from "date-fns"
import type { GeneratedShift } from "@/types/generation"
import type { ShiftData, AbsenceData } from "@/types/planilla"
import { AREA_COLORS } from "@/lib/constants/areas"

// ---------------------------------------------------------------------------
// Planilla UI queries
// Returns typed ShiftData / AbsenceData for the schedule grid.
// ---------------------------------------------------------------------------

/**
 * Returns all shifts in the given month, with area color data resolved,
 * formatted as ShiftData for the planilla UI.
 * Uses date-fns startOfMonth / endOfMonth for boundary calculation.
 */
export async function getShiftsForMonth(mes: number, anio: number): Promise<ShiftData[]> {
  const start = startOfMonth(new Date(anio, mes - 1))
  const end = endOfMonth(new Date(anio, mes - 1))

  const shifts = await prisma.shift.findMany({
    where: { date: { gte: start, lte: end } },
    include: { area: true },
    orderBy: [{ employeeId: "asc" }, { date: "asc" }],
  })

  return shifts.map((s) => ({
    id: s.id,
    employeeId: s.employeeId,
    date: s.date.toISOString().split("T")[0],
    timeSlot: s.timeSlot,
    areaId: s.areaId,
    areaName: s.area?.name ?? null,
    areaColor: s.area ? (AREA_COLORS[s.area.name] ?? null) : null,
    isManual: s.isManual,
  }))
}

/**
 * Returns all absences that overlap the given month.
 * Overlap condition: startDate <= lastDay AND endDate >= firstDay.
 */
export async function getAbsencesForMonth(mes: number, anio: number): Promise<AbsenceData[]> {
  const start = startOfMonth(new Date(anio, mes - 1))
  const end = endOfMonth(new Date(anio, mes - 1))

  const absences = await prisma.absence.findMany({
    where: {
      OR: [
        { startDate: { lte: end }, endDate: { gte: start } },
      ],
    },
    orderBy: [{ employeeId: "asc" }, { startDate: "asc" }],
  })

  return absences.map((a) => ({
    id: a.id,
    employeeId: a.employeeId,
    startDate: a.startDate.toISOString().split("T")[0],
    endDate: a.endDate.toISOString().split("T")[0],
    type: a.type as AbsenceData["type"],
  }))
}

// ---------------------------------------------------------------------------
// Generation pipeline mutations
// Used by lib/actions/generation.ts to persist algorithm output.
// ---------------------------------------------------------------------------

/**
 * Upserts generated shifts in a single transaction.
 * - If an existing shift for (employeeId, date) has isManual=true → skip it.
 * - Otherwise create-or-overwrite.
 */
export async function saveGeneratedShifts(
  shifts: GeneratedShift[]
): Promise<void> {
  if (shifts.length === 0) return

  // Gather date range from the shifts to know which existing manual shifts to protect
  const dates = shifts.map((s) => new Date(s.date + "T00:00:00.000Z"))
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())))
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())))

  // Fetch all manual shifts in the range so we can skip them
  const manualShifts = await prisma.shift.findMany({
    where: {
      isManual: true,
      date: { gte: minDate, lte: maxDate },
    },
    select: { employeeId: true, date: true },
  })

  // Build a Set of "employeeId|YYYY-MM-DD" for fast lookup
  const manualKeys = new Set(
    manualShifts.map(
      (s) =>
        `${s.employeeId}|${s.date.toISOString().slice(0, 10)}`
    )
  )

  // Filter out shifts that should not be overwritten
  const toUpsert = shifts.filter(
    (s) => !manualKeys.has(`${s.employeeId}|${s.date}`)
  )

  if (toUpsert.length === 0) return

  await prisma.$transaction(
    toUpsert.map((s) =>
      prisma.shift.upsert({
        where: { employeeId_date: { employeeId: s.employeeId, date: new Date(s.date + "T00:00:00.000Z") } },
        update: {
          timeSlot: s.timeSlot,
          areaId: s.areaId,
          isManual: false,
        },
        create: {
          employeeId: s.employeeId,
          date: new Date(s.date + "T00:00:00.000Z"),
          timeSlot: s.timeSlot,
          areaId: s.areaId,
          isManual: false,
        },
      })
    )
  )
}

/**
 * Deletes all non-manual shifts for the given month.
 * Manual shifts are preserved.
 */
export async function clearShiftsForMonth(
  month: number,
  year: number
): Promise<void> {
  const firstDay = new Date(Date.UTC(year, month - 1, 1))
  const lastDay = new Date(Date.UTC(year, month, 0))

  await prisma.shift.deleteMany({
    where: {
      date: { gte: firstDay, lte: lastDay },
      isManual: false,
    },
  })
}
