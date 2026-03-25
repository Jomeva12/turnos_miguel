import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return session;
}

const AREA_ORDER = [
  "General",
  "Buffet",
  "Cosmetico",
  "Domicilio",
  "Electrodomestico",
  "Marking",
  "Valery Camacho",
];

export interface ShiftRow {
  id: number;
  employeeId: number;
  employeeName: string;
  timeSlot: string | null;
  areaName: string;
  areaColor: string;
}

export interface AreaGroup {
  areaId: number;
  areaName: string;
  areaColor: string;
  shifts: ShiftRow[];
}

export interface CoberturaResponse {
  fecha: string;
  areas: AreaGroup[];
}

/**
 * GET /api/cobertura?fecha=YYYY-MM-DD
 * Returns shifts grouped by area for the given date.
 */
export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get("fecha");

  if (!fecha) {
    return NextResponse.json(
      { error: "Parametro fecha requerido" },
      { status: 400 }
    );
  }

  // Parse date safely using UTC to avoid timezone shift
  const [year, month, day] = fecha.split("-").map(Number);
  const targetDate = new Date(Date.UTC(year, month - 1, day));

  const shifts = await prisma.shift.findMany({
    where: {
      date: targetDate,
      timeSlot: { not: null },
    },
    include: {
      employee: { select: { id: true, name: true } },
      area: { select: { id: true, name: true, color: true } },
    },
  });

  // Also fetch all areas to ensure all 7 appear even without shifts
  const allAreas = await prisma.area.findMany({
    select: { id: true, name: true, color: true },
  });

  // Build a map from areaId to area info
  const areaMap = new Map(allAreas.map((a) => [a.id, a]));

  // Group shifts by areaId
  const groupedByArea = new Map<number, ShiftRow[]>();

  for (const shift of shifts) {
    if (!shift.area) continue;
    // Skip DESCANSO entries
    if (shift.timeSlot === "DESCANSO") continue;

    const areaId = shift.area.id;
    if (!groupedByArea.has(areaId)) {
      groupedByArea.set(areaId, []);
    }

    groupedByArea.get(areaId)!.push({
      id: shift.id,
      employeeId: shift.employeeId,
      employeeName: shift.employee.name,
      timeSlot: shift.timeSlot,
      areaName: shift.area.name,
      areaColor: shift.area.color,
    });
  }

  // Build the final areas array, including all areas (even empty ones)
  const areaGroups: AreaGroup[] = allAreas.map((area) => ({
    areaId: area.id,
    areaName: area.name,
    areaColor: area.color,
    shifts: groupedByArea.get(area.id) ?? [],
  }));

  // Sort areas in fixed order
  areaGroups.sort((a, b) => {
    const idxA = AREA_ORDER.indexOf(a.areaName);
    const idxB = AREA_ORDER.indexOf(b.areaName);
    const rankA = idxA === -1 ? 999 : idxA;
    const rankB = idxB === -1 ? 999 : idxB;
    return rankA - rankB;
  });

  const response: CoberturaResponse = {
    fecha,
    areas: areaGroups,
  };

  return NextResponse.json(response);
}
