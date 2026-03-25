import { PlanillaGrid } from "@/components/planilla/PlanillaGrid"
export const dynamic = "force-dynamic";
import { getEmployeesWithAreas } from "@/lib/db/employees"
import { getShiftsForMonth, getAbsencesForMonth } from "@/lib/db/shifts"
import { getShiftTemplates } from "@/lib/db/templates"

export default async function PlanillaPage({
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
    <PlanillaGrid
      employees={employees}
      shifts={shifts}
      absences={absences}
      templates={templates}
      mes={mes}
      anio={anio}
    />
  )
}
