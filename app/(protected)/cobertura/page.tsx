import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";
import CoberturaGantt, { CoberturaData } from "@/components/cobertura/CoberturaGantt";
import DateSelector from "@/components/cobertura/DateSelector";

const AREA_ORDER = [
  "General",
  "Buffet",
  "Cosmetico",
  "Domicilio",
  "Electrodomestico",
  "Marking",
  "Valery Camacho",
];

interface PageProps {
  searchParams: Promise<{ fecha?: string }>;
}

export default async function CoberturaPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Default to today in America/Bogota timezone
  const fechaHoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Bogota",
  }); // "YYYY-MM-DD"

  const fecha = params.fecha ?? fechaHoy;

  // Parse date for Prisma query (UTC)
  const [year, month, day] = fecha.split("-").map(Number);
  const targetDate = new Date(Date.UTC(year, month - 1, day));

  // Fetch all areas
  const allAreas = await prisma.area.findMany({
    select: { id: true, name: true, color: true },
  });

  // Fetch shifts for the day (exclude DESCANSO / null)
  const shifts = await prisma.shift.findMany({
    where: {
      date: targetDate,
      NOT: { timeSlot: null },
    },
    include: {
      employee: { select: { id: true, name: true } },
      area: { select: { id: true, name: true, color: true } },
    },
  });

  // Group shifts by areaId
  const groupedByArea = new Map<number, Array<{ employeeName: string; timeSlot: string | null }>>();

  for (const shift of shifts) {
    if (!shift.area) continue;
    if (shift.timeSlot === "DESCANSO") continue;

    const areaId = shift.area.id;
    if (!groupedByArea.has(areaId)) {
      groupedByArea.set(areaId, []);
    }
    groupedByArea.get(areaId)!.push({
      employeeName: shift.employee.name,
      timeSlot: shift.timeSlot,
    });
  }

  // Build CoberturaData — all areas always present, even if empty
  const areaRows = allAreas.map((area) => ({
    areaId: area.id,
    areaName: area.name,
    areaColor: area.color,
    shifts: groupedByArea.get(area.id) ?? [],
  }));

  // Sort in fixed order
  areaRows.sort((a, b) => {
    const idxA = AREA_ORDER.indexOf(a.areaName);
    const idxB = AREA_ORDER.indexOf(b.areaName);
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });

  const coberturaData: CoberturaData = { areas: areaRows };

  // Format title in Spanish
  const tituloFecha = (() => {
    // Use fecha + T12:00:00 in Bogota to avoid off-by-one from midnight UTC
    const dt = new Date(`${fecha}T12:00:00`);
    const formatted = dt.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "America/Bogota",
    });
    // Capitalise first letter
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  })();

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
            Cobertura Horaria
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {tituloFecha}
          </p>
        </div>
        <DateSelector fechaActual={fecha} />
      </div>

      {/* Gantt */}
      <div className="glass-card p-4">
        <CoberturaGantt data={coberturaData} />
      </div>
    </main>
  );
}
