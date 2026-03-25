import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { EditorIndividual } from "@/components/planilla/EditorIndividual"
import { getShiftsForMonth, getAbsencesForMonth } from "@/lib/db/shifts"
import { getShiftTemplates } from "@/lib/db/templates"
import type { EmployeeRow } from "@/types/planilla"

export default async function EditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ empleadoId: string }>
  searchParams: Promise<{ mes?: string; anio?: string }>
}) {
  const { empleadoId } = await params
  const sp = await searchParams
  const id = parseInt(empleadoId)

  const now = new Date()
  const mes = sp.mes ? parseInt(sp.mes) : now.getMonth() + 1
  const anio = sp.anio ? parseInt(sp.anio) : now.getFullYear()

  const [employeeRaw, shifts, absences, templates] = await Promise.all([
    prisma.employee.findUnique({
      where: { id },
      include: { areas: { include: { area: true } } },
    }),
    getShiftsForMonth(mes, anio),
    getAbsencesForMonth(mes, anio),
    getShiftTemplates(),
  ])

  if (!employeeRaw) notFound()

  const employee: EmployeeRow = {
    id: employeeRaw.id,
    name: employeeRaw.name,
    areaIds: employeeRaw.areas.map((ea) => ea.area.id),
    areaNames: employeeRaw.areas.map((ea) => ea.area.name),
  }

  // Filtrar shifts/absences solo del empleado
  const empShifts = shifts.filter((s) => s.employeeId === id)
  const empAbsences = absences.filter((a) => a.employeeId === id)

  return (
    <EditorIndividual
      employee={employee}
      shifts={empShifts}
      absences={empAbsences}
      templates={templates}
      mes={mes}
      anio={anio}
    />
  )
}
