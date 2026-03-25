"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Toggle an employee-area assignment.
 * Creates an EmployeeArea record when enabled=true, deletes it when enabled=false.
 * Requires a valid session — throws if unauthenticated.
 */
export async function toggleEmployeeArea(
  employeeId: number,
  areaId: number,
  enabled: boolean
): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("No autorizado");
  }

  if (enabled) {
    // Upsert: create if not exists, no-op update if already exists
    await prisma.employeeArea.upsert({
      where: {
        employeeId_areaId: { employeeId, areaId },
      },
      create: { employeeId, areaId },
      update: {},
    });
  } else {
    // deleteMany is safe even if the record doesn't exist
    await prisma.employeeArea.deleteMany({
      where: { employeeId, areaId },
    });
  }

  revalidatePath("/habilidades");
}
