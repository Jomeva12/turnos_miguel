import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ExcelJS from "exceljs";

// UPPERCASE Spanish day abbreviations indexed by getDay() (0=Sun, 1=Mon..6=Sat)
const DAY_ABBR = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"] as const;

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return session;
}

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const rawYear = searchParams.get("year");
  const rawMonth = searchParams.get("month");

  // Validate presence
  if (!rawYear || !rawMonth) {
    return Response.json(
      { error: "year and month are required" },
      { status: 400 }
    );
  }

  // Validate integer
  const year = parseInt(rawYear, 10);
  const month = parseInt(rawMonth, 10);
  if (isNaN(year) || isNaN(month) || String(year) !== rawYear || String(month) !== rawMonth) {
    return Response.json(
      { error: "year and month must be integers" },
      { status: 400 }
    );
  }

  // Compute date range (month is 1-indexed from caller)
  const daysInMonth = new Date(year, month, 0).getDate();
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month - 1, daysInMonth);

  // Query all employees and shifts for the month
  const [employees, shifts] = await Promise.all([
    prisma.employee.findMany({ orderBy: { name: "asc" } }),
    prisma.shift.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { employee: true },
      orderBy: [{ employee: { name: "asc" } }, { date: "asc" }],
    }),
  ]);

  // Build lookup: employeeId -> (dateKey yyyy-MM-dd -> Shift)
  const shiftMap = new Map<number, Map<string, (typeof shifts)[0]>>();
  for (const shift of shifts) {
    if (!shiftMap.has(shift.employeeId)) {
      shiftMap.set(shift.employeeId, new Map());
    }
    const dateKey = format(shift.date, "yyyy-MM-dd");
    shiftMap.get(shift.employeeId)!.set(dateKey, shift);
  }

  // Build array of day metadata for header row
  const days: { date: Date; label: string; key: string }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dayOfWeek = date.getDay(); // 0=Sun..6=Sat
    const label = `${DAY_ABBR[dayOfWeek]} ${String(d).padStart(2, "0")}`;
    const key = format(date, "yyyy-MM-dd");
    days.push({ date, label, key });
  }

  // Build ExcelJS workbook
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Planilla");

  // Header row
  const headerRow = sheet.addRow(["ASESOR", ...days.map((d) => d.label)]);
  headerRow.font = { bold: true };
  headerRow.height = 20;

  // Employee rows
  for (const emp of employees) {
    const empShifts = shiftMap.get(emp.id) ?? new Map();
    const rowData: (string | null)[] = [emp.name];

    for (const day of days) {
      const shift = empShifts.get(day.key);
      if (!shift) {
        // No shift record for this day — leave blank
        rowData.push(null);
      } else if (shift.timeSlot === null) {
        // null timeSlot means descanso
        rowData.push("DESCANSO");
      } else if (shift.timeSlot.includes("|")) {
        // Split shift: "7:00-11:00|11:30-14:30" -> two lines
        rowData.push(shift.timeSlot.replace("|", "\n"));
      } else {
        rowData.push(shift.timeSlot);
      }
    }

    const row = sheet.addRow(rowData);

    // Apply wrapText to split-shift cells
    row.eachCell((cell, colNumber) => {
      if (colNumber > 1 && typeof cell.value === "string" && cell.value.includes("\n")) {
        cell.alignment = { wrapText: true, vertical: "top" };
      }
    });
  }

  // Column widths: col A = 22 (names), rest = 12 (day columns)
  sheet.getColumn(1).width = 22;
  for (let i = 2; i <= days.length + 1; i++) {
    sheet.getColumn(i).width = 12;
  }

  // Freeze first row and first column (sticky headers)
  sheet.views = [{ state: "frozen", xSplit: 1, ySplit: 1 }];

  // Write buffer and return response
  const buffer = await workbook.xlsx.writeBuffer();
  const monthName = format(new Date(year, month - 1, 1), "MMMM-yyyy", { locale: es });

  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="planilla-${monthName}.xlsx"`,
    },
  });
}
