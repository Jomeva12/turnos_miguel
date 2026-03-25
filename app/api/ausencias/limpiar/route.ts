import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return session;
}

/**
 * POST /api/ausencias/limpiar
 * Body: { mes: number, anio: number }
 * Deletes all absences whose startDate falls within the given month/year.
 * Returns { deleted: number }.
 */
export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const mes = Number(body.mes);
  const anio = Number(body.anio);

  if (!mes || !anio || mes < 1 || mes > 12) {
    return NextResponse.json(
      { error: "Parametros mes y anio requeridos (mes: 1-12)" },
      { status: 400 }
    );
  }

  const startOfMonth = new Date(anio, mes - 1, 1);
  const endOfMonth = new Date(anio, mes, 1);

  const result = await prisma.absence.deleteMany({
    where: {
      startDate: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
    },
  });

  return NextResponse.json({ deleted: result.count });
}
