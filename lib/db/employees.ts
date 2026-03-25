import { prisma } from "@/lib/db"
import type { EmployeeRow } from "@/types/planilla"

/**
 * Returns all employees with their assigned areas, sorted by name ascending.
 * Area data is flattened into areaIds and areaNames arrays for use in the
 * planilla UI layer.
 *
 * Only employees that have at least one area assignment are included.
 */
export async function getEmployeesWithAreas(): Promise<EmployeeRow[]> {
  const employees = await prisma.employee.findMany({
    include: { areas: { include: { area: true } } },
    orderBy: { name: "asc" },
  })

  return employees
    .filter((e) => e.areas.length > 0)
    .map((e) => ({
      id: e.id,
      name: e.name,
      areaIds: e.areas.map((ea) => ea.area.id),
      areaNames: e.areas.map((ea) => ea.area.name),
    }))
}
