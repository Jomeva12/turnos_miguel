"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getEmployeesWithAreas } from "@/lib/db/employees";
import { getShiftTemplates } from "@/lib/db/templates";
import { getAbsencesForMonth } from "@/lib/db/absences";
import { saveGeneratedShifts } from "@/lib/db/shifts";
import { saveGenerationLog } from "@/lib/db/generationLog";
import { generateMonthShifts } from "@/lib/services/generation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("No autorizado");
  return session;
}

// ---------------------------------------------------------------------------
// triggerGeneration
//
// Generates all shifts for a full month, saves them to the DB, persists the
// generation log, and revalidates the relevant pages.
// ---------------------------------------------------------------------------
export async function triggerGeneration(
  month: number,
  year: number
): Promise<{ success: boolean; logCount: number; errors: number }> {
  await requireSession();

  try {
    const [employeeRows, templates, absences] = await Promise.all([
      getEmployeesWithAreas(),
      getShiftTemplates(),
      getAbsencesForMonth(month, year),
    ]);

    // Map EmployeeRow (planilla UI type) to EmployeeWithAreas (algorithm type)
    const employees = employeeRows.map((e) => ({
      id: e.id,
      name: e.name,
      areas: e.areaIds.map((areaId, i) => ({ areaId, areaName: e.areaNames[i] })),
    }));

    const result = generateMonthShifts({ month, year, employees, templates, absences });

    await saveGeneratedShifts(result.shifts);
    await saveGenerationLog(month, year, result.log);

    revalidatePath("/planilla");
    revalidatePath("/bitacora");

    return {
      success: true,
      logCount: result.log.length,
      errors: result.log.filter((l) => l.type === "error").length,
    };
  } catch (err) {
    console.error("[triggerGeneration] error:", err);
    return { success: false, logCount: 0, errors: 1 };
  }
}

// ---------------------------------------------------------------------------
// triggerGenerationDay
//
// Generates shifts for a single day. Uses the full-month algorithm and then
// filters the output to the target date before saving — simplest correct approach.
// ---------------------------------------------------------------------------
export async function triggerGenerationDay(
  date: string
): Promise<{ success: boolean }> {
  await requireSession();

  try {
    const parsed = new Date(date + "T00:00:00.000Z");
    const month = parsed.getUTCMonth() + 1;
    const year = parsed.getUTCFullYear();

    const [employeeRows, templates, absences] = await Promise.all([
      getEmployeesWithAreas(),
      getShiftTemplates(),
      getAbsencesForMonth(month, year),
    ]);

    const employees = employeeRows.map((e) => ({
      id: e.id,
      name: e.name,
      areas: e.areaIds.map((areaId, i) => ({ areaId, areaName: e.areaNames[i] })),
    }));

    const result = generateMonthShifts({ month, year, employees, templates, absences });

    // Keep only shifts for the target date
    const dayShifts = result.shifts.filter((s) => s.date === date);
    const dayLog = result.log.filter((l) => l.date === date || !l.date);

    await saveGeneratedShifts(dayShifts);
    await saveGenerationLog(month, year, dayLog);

    revalidatePath("/planilla");
    revalidatePath("/bitacora");

    return { success: true };
  } catch (err) {
    console.error("[triggerGenerationDay] error:", err);
    return { success: false };
  }
}

// ---------------------------------------------------------------------------
// triggerGenerationRange
//
// Generates shifts for a date range, handling multiple months.
// For each unique month in the range, calls triggerGeneration; for partial
// months the filtered approach is applied.
// ---------------------------------------------------------------------------
export async function triggerGenerationRange(
  startDate: string,
  endDate: string
): Promise<{ success: boolean; daysGenerated: number }> {
  await requireSession();

  try {
    const start = new Date(startDate + "T00:00:00.000Z");
    const end = new Date(endDate + "T00:00:00.000Z");

    if (start > end) {
      return { success: false, daysGenerated: 0 };
    }

    // Collect all distinct year/month pairs that the range overlaps
    const months: Array<{ year: number; month: number }> = [];
    const seen = new Set<string>();

    let cur = new Date(start);
    while (cur <= end) {
      const y = cur.getUTCFullYear();
      const m = cur.getUTCMonth() + 1;
      const key = `${y}-${m}`;
      if (!seen.has(key)) {
        seen.add(key);
        months.push({ year: y, month: m });
      }
      // Advance by ~28 days (safe minimum month length) to move to the next month
      cur = new Date(Date.UTC(y, m, 1)); // first day of next month
    }

    let daysGenerated = 0;

    for (const { year, month } of months) {
      const [employeeRows, templates, absences] = await Promise.all([
        getEmployeesWithAreas(),
        getShiftTemplates(),
        getAbsencesForMonth(month, year),
      ]);

      const employees = employeeRows.map((e) => ({
        id: e.id,
        name: e.name,
        areas: e.areaIds.map((areaId, i) => ({ areaId, areaName: e.areaNames[i] })),
      }));

      const result = generateMonthShifts({ month, year, employees, templates, absences });

      // Filter shifts and log to the requested date range
      const filteredShifts = result.shifts.filter((s) => {
        const d = new Date(s.date + "T00:00:00.000Z");
        return d >= start && d <= end;
      });

      const filteredLog = result.log.filter((l) => {
        if (!l.date) return true;
        const d = new Date(l.date + "T00:00:00.000Z");
        return d >= start && d <= end;
      });

      if (filteredShifts.length > 0) {
        await saveGeneratedShifts(filteredShifts);

        // Count unique dates generated
        const uniqueDates = new Set(filteredShifts.map((s) => s.date));
        daysGenerated += uniqueDates.size;
      }

      await saveGenerationLog(month, year, filteredLog);
    }

    revalidatePath("/planilla");
    revalidatePath("/bitacora");

    return { success: true, daysGenerated };
  } catch (err) {
    console.error("[triggerGenerationRange] error:", err);
    return { success: false, daysGenerated: 0 };
  }
}
