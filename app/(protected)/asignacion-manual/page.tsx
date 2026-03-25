import { AsignacionGrid } from "@/components/planilla/AsignacionGrid"
export const dynamic = "force-dynamic";
import { getEmployeesWithAreas } from "@/lib/db/employees"
import { getShiftsForMonth, getAbsencesForMonth } from "@/lib/db/shifts"
import { getShiftTemplates } from "@/lib/db/templates"

export default async function AsignacionManualPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; anio?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const mes = params.mes ? parseInt(params.mes) : now.getMonth() + 1
  const anio = params.anio ? parseInt(params.anio) : now.getFullYear()

  const [employees, shifts, absences, templates] = await Promise.all([
    getEmployeesWithAreas(),
    getShiftsForMonth(mes, anio),
    getAbsencesForMonth(mes, anio),
    getShiftTemplates(),
  ])

  return (
    <AsignacionGrid
      employees={employees}
      shifts={shifts}
      absences={absences}
      templates={templates}
      mes={mes}
      anio={anio}
    />
  )
}
