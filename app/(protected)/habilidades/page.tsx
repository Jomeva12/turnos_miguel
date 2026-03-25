import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";
import { HabilidadesTable } from "@/components/habilidades/HabilidadesTable";

/**
 * Habilidades page — Server Component.
 * Fetches all employees (with area assignments) and all areas from the database,
 * then renders the interactive checkbox table.
 */
export default async function HabilidadesPage() {
  const [employees, areas] = await Promise.all([
    prisma.employee.findMany({
      include: {
        areas: {
          include: {
            area: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.area.findMany({
      orderBy: { id: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Habilidades</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
          Asigna las áreas en las que puede trabajar cada asesor.
        </p>
      </div>

      <HabilidadesTable employees={employees} areas={areas} />
    </div>
  );
}
