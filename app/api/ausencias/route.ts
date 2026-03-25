import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const TIPOS_VALIDOS = ["VAC", "INC", "PER", "CAL", "DESCANSO"] as const;

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return session;
}

/**
 * GET /api/ausencias?mes=3&anio=2026
 * Returns all absences whose startDate falls in the given month/year.
 * Includes employee.name.
 */
export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mes = parseInt(searchParams.get("mes") ?? "0", 10);
  const anio = parseInt(searchParams.get("anio") ?? "0", 10);

  if (!mes || !anio || mes < 1 || mes > 12) {
    return NextResponse.json(
      { error: "Parametros mes y anio requeridos (mes: 1-12)" },
      { status: 400 }
    );
  }

  const startOfMonth = new Date(Date.UTC(anio, mes - 1, 1));
  const startOfNextMonth = new Date(Date.UTC(anio, mes, 1));

  const absences = await prisma.absence.findMany({
    where: {
      startDate: {
        gte: startOfMonth,
        lt: startOfNextMonth,
      },
    },
    include: {
      employee: {
        select: { name: true },
      },
    },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(absences);
}

/**
 * POST /api/ausencias
 * Body: { employeeId: number, type: string, startDate: string, endDate: string }
 * Creates a new Absence record. Returns 201 with the created record.
 * Returns 400 if type is invalid.
 */
export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { employeeId, type, startDate, endDate } = body;

  if (!TIPOS_VALIDOS.includes(type)) {
    return NextResponse.json({ error: "Tipo invalido" }, { status: 400 });
  }

  const absence = await prisma.absence.create({
    data: {
      employeeId: Number(employeeId),
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
    include: {
      employee: {
        select: { name: true },
      },
    },
  });

  return NextResponse.json(absence, { status: 201 });
}
