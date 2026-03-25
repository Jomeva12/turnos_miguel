import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";
import AusenciasForm from "@/components/ausencias/AusenciasForm";
import AusenciasList from "@/components/ausencias/AusenciasList";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBogotaMonthBounds(): { mes: number; anio: number; startOfMonth: Date; endOfMonth: Date } {
  // Use TZ=America/Bogota to get local month (UTC-5)
  const now = new Date();
  const bogotaStr = now.toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  // bogotaStr is like "25/3/2026" (DD/MM/YYYY for es-CO locale)
  const parts = bogotaStr.split("/");
  const anio = parseInt(parts[2], 10);
  const mes = parseInt(parts[1], 10);
  const startOfMonth = new Date(Date.UTC(anio, mes - 1, 1));
  const endOfMonth = new Date(Date.UTC(anio, mes, 1));
  return { mes, anio, startOfMonth, endOfMonth };
}

const MONTH_NAMES_ES: Record<number, string> = {
  1: "Enero",
  2: "Febrero",
  3: "Marzo",
  4: "Abril",
  5: "Mayo",
  6: "Junio",
  7: "Julio",
  8: "Agosto",
  9: "Septiembre",
  10: "Octubre",
  11: "Noviembre",
  12: "Diciembre",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AusenciasPage() {
  const { mes, anio, startOfMonth, endOfMonth } = getBogotaMonthBounds();

  const [employees, absences] = await Promise.all([
    prisma.employee.findMany({ orderBy: { name: "asc" } }),
    prisma.absence.findMany({
      where: {
        startDate: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
      },
      include: { employee: true },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const mesLabel = `${MONTH_NAMES_ES[mes]} ${anio}`;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-white">
        Novedades &mdash; {mesLabel}
      </h1>

      <AusenciasForm employees={employees} />
      <AusenciasList absences={absences} mes={mes} anio={anio} />
    </main>
  );
}
