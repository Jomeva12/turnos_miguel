import { prisma } from "@/lib/db"
import type { TemplateOption } from "@/types/planilla"

/**
 * Returns all shift templates for all areas and all days of the week.
 * Ordered by area name then day of week ascending.
 * Area name is flattened into the result for direct use in the planilla UI.
 */
export async function getShiftTemplates(): Promise<TemplateOption[]> {
  const templates = await prisma.shiftTemplate.findMany({
    include: { area: true },
    orderBy: [{ area: { name: "asc" } }, { dayOfWeek: "asc" }],
  })

  return templates.map((t) => ({
    id: t.id,
    areaId: t.areaId,
    areaName: t.area.name,
    dayOfWeek: t.dayOfWeek,
    timeSlot: t.timeSlot,
    isWildcard: t.isWildcard,
    requiredCount: t.requiredCount,
  }))
}
