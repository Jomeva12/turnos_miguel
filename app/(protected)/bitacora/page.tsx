import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getGenerationLog } from "@/lib/db/generationLog";
import { BitacoraModal } from "@/components/bitacora/BitacoraModal";
import type { LogEntry } from "@/types/generation";

interface BitacoraPageProps {
  searchParams: Promise<{ mes?: string; anio?: string }>;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default async function BitacoraPage({ searchParams }: BitacoraPageProps) {
  // Auth guard
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  // Resolve searchParams (Next.js 15 — async)
  const params = await searchParams;

  const now = new Date();
  const month = parseInt(params.mes ?? String(now.getMonth() + 1), 10);
  const year = parseInt(params.anio ?? String(now.getFullYear()), 10);

  // Prev / next month navigation targets
  const prevDate = new Date(year, month - 2, 1); // month-2 because months are 0-indexed
  const nextDate = new Date(year, month, 1);
  const prevHref = `/bitacora?mes=${prevDate.getMonth() + 1}&anio=${prevDate.getFullYear()}`;
  const nextHref = `/bitacora?mes=${nextDate.getMonth() + 1}&anio=${nextDate.getFullYear()}`;

  const log = await getGenerationLog(month, year);

  const entries: LogEntry[] = log
    ? (log.notes as unknown as LogEntry[])
    : [];

  const infoCount = entries.filter((e) => e.type === "info").length;
  const warnCount = entries.filter((e) => e.type === "warning").length;
  const errorCount = entries.filter((e) => e.type === "error").length;

  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Bitácora de Generación
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Registro de advertencias y errores del algoritmo de generación.
          </p>
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-3">
          <Link
            href={prevHref}
            className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{ color: "var(--muted-foreground)", background: "var(--glass-bg)" }}
          >
            ← Anterior
          </Link>
          <span className="text-sm font-semibold text-white min-w-[140px] text-center">
            {monthLabel}
          </span>
          <Link
            href={nextHref}
            className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{ color: "var(--muted-foreground)", background: "var(--glass-bg)" }}
          >
            Siguiente →
          </Link>
        </div>
      </div>

      {/* Content */}
      {!log ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
        >
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            No hay bitácora para {monthLabel}. Genera los turnos primero.
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl p-6 space-y-4"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
        >
          {/* Badge summary row */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-white">
              {entries.length} entradas:
            </span>
            <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {infoCount} info
            </span>
            <span className="px-2 py-1 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {warnCount} avisos
            </span>
            <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
              {errorCount} errores
            </span>
          </div>

          {/* Log entries list */}
          <BitacoraModal entries={entries} />
        </div>
      )}
    </div>
  );
}
