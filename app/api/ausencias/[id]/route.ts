import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return session;
}

/**
 * DELETE /api/ausencias/[id]
 * Deletes the absence with the given id.
 * Returns 204 if successful, 404 if not found.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const absenceId = parseInt(id, 10);

  if (isNaN(absenceId)) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  try {
    await prisma.absence.delete({ where: { id: absenceId } });
    return new Response(null, { status: 204 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json({ error: "Ausencia no encontrada" }, { status: 404 });
    }
    throw err;
  }
}
