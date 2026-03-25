import { prisma } from "@/lib/db"
import type { AbsenceRecord } from "@/types/generation"

/**
 * Returns all absences that OVERLAP the given month.
 * Overlap condition: startDate <= lastDay AND endDate >= firstDay.
 * Dates are returned as ISO "YYYY-MM-DD" strings.
 */
export async function getAbsencesForMonth(
  month: number,
  year: number
): Promise<AbsenceRecord[]> {
  const firstDay = new Date(Date.UTC(year, month - 1, 1))
  const lastDay = new Date(Date.UTC(year, month, 0))

  const absences = await prisma.absence.findMany({
    where: {
      startDate: { lte: lastDay },
      endDate: { gte: firstDay },
    },
    orderBy: [{ employeeId: "asc" }, { startDate: "asc" }],
  })

  return absences.map((a) => ({
    employeeId: a.employeeId,
    startDate: a.startDate.toISOString().slice(0, 10),
    endDate: a.endDate.toISOString().slice(0, 10),
    type: a.type,
  }))
}
