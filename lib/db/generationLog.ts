import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import type { LogEntry } from "@/types/generation"
import type { GenerationLog } from "@prisma/client"

/**
 * Upserts a GenerationLog entry for (month, year).
 * If a record already exists for that month+year it is replaced
 * (delete + create) since there is no composite unique constraint.
 */
export async function saveGenerationLog(
  month: number,
  year: number,
  log: LogEntry[]
): Promise<void> {
  const existing = await prisma.generationLog.findFirst({
    where: { month, year },
    orderBy: { createdAt: "desc" },
  })

  if (existing) {
    await prisma.generationLog.delete({ where: { id: existing.id } })
  }

  await prisma.generationLog.create({
    data: {
      month,
      year,
      notes: log as unknown as Prisma.InputJsonValue,
    },
  })
}

/**
 * Returns the most recent GenerationLog for (month, year), or null.
 */
export async function getGenerationLog(
  month: number,
  year: number
): Promise<GenerationLog | null> {
  return prisma.generationLog.findFirst({
    where: { month, year },
    orderBy: { createdAt: "desc" },
  })
}
