"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

function getMonthRange(year: number, month: number) {
  if (year < 2000 || year > 2100 || month < 1 || month > 12) {
    throw new Error("Parámetros inválidos");
  }
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month - 1, new Date(year, month, 0).getDate());
  return { firstDay, lastDay };
}

export async function deleteShiftsByMonth(
  year: number,
  month: number
): Promise<{ deleted: number }> {
  const { firstDay, lastDay } = getMonthRange(year, month);
  const result = await prisma.shift.deleteMany({
    where: { date: { gte: firstDay, lte: lastDay } },
  });
  revalidatePath("/planilla");
  return { deleted: result.count };
}

export async function deleteAbsencesByMonth(
  year: number,
  month: number
): Promise<{ deleted: number }> {
  const { firstDay, lastDay } = getMonthRange(year, month);
  const result = await prisma.absence.deleteMany({
    where: { startDate: { gte: firstDay, lte: lastDay } },
  });
  revalidatePath("/planilla");
  return { deleted: result.count };
}
