"use client";

import { useTransition } from "react";
import { deleteAbsence, clearMonthAbsences } from "@/lib/actions/ausencias";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AbsenceRow {
  id: number;
  type: string;
  startDate: Date;
  endDate: Date;
  employee: { name: string };
}

interface AusenciasListProps {
  absences: AbsenceRow[];
  mes: number;
  anio: number;
}

// ---------------------------------------------------------------------------
// Badge config
// ---------------------------------------------------------------------------

const TIPO_CONFIG: Record<
  string,
  { bg: string; text: string; border: string; label: string }
> = {
  VAC: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    border: "border-green-500/40",
    label: "VACACIONES",
  },
  INC: {
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    border: "border-yellow-500/40",
    label: "INCAPACIDAD",
  },
  PER: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/40",
    label: "PERMISO",
  },
  CAL: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    border: "border-orange-500/40",
    label: "CALAMIDAD",
  },
  DESCANSO: {
    bg: "bg-gray-500/20",
    text: "text-gray-400",
    border: "border-gray-500/40",
    label: "DESCANSO",
  },
};

const MONTH_NAMES_ES: Record<number, string> = {
  1: "enero",
  2: "febrero",
  3: "marzo",
  4: "abril",
  5: "mayo",
  6: "junio",
  7: "julio",
  8: "agosto",
  9: "septiembre",
  10: "octubre",
  11: "noviembre",
  12: "diciembre",
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// ---------------------------------------------------------------------------
// Row component — isolates useTransition per row
// ---------------------------------------------------------------------------

function AbsenceRowItem({ absence }: { absence: AbsenceRow }) {
  const [isPending, startTransition] = useTransition();
  const config = TIPO_CONFIG[absence.type] ?? TIPO_CONFIG["DESCANSO"];

  function handleDelete() {
    startTransition(async () => {
      await deleteAbsence(absence.id);
    });
  }

  return (
    <tr
      className="border-b border-white/10 hover:bg-white/5 transition-colors"
      style={{ opacity: isPending ? 0.5 : 1 }}
    >
      <td className="px-4 py-3 text-white whitespace-nowrap">
        {absence.employee.name}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
        >
          {config.label}
        </span>
      </td>
      <td className="px-4 py-3 text-white/80 text-sm whitespace-nowrap">
        {formatDate(absence.startDate)}
      </td>
      <td className="px-4 py-3 text-white/80 text-sm whitespace-nowrap">
        {formatDate(absence.endDate)}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="px-2 py-1 rounded text-xs font-medium transition-colors bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 disabled:opacity-40"
          aria-label={`Eliminar novedad de ${absence.employee.name}`}
        >
          {isPending ? "Eliminando…" : "Eliminar"}
        </button>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AusenciasList({ absences, mes, anio }: AusenciasListProps) {
  const [isClearPending, startClearTransition] = useTransition();
  const mesLabel = `${MONTH_NAMES_ES[mes] ?? mes} ${anio}`;

  function handleClear() {
    const confirmed = window.confirm(
      `¿Eliminar todas las novedades de ${mesLabel}? Esta accion no se puede deshacer.`
    );
    if (!confirmed) return;

    startClearTransition(async () => {
      await clearMonthAbsences(mes, anio);
    });
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--glass-border)",
      }}
    >
      {/* Table header */}
      <div className="px-6 py-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white capitalize">
          Novedades del mes
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Empleado
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Inicio
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Fin
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {absences.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-white/50 text-sm"
                >
                  No hay novedades registradas para este mes.
                </td>
              </tr>
            ) : (
              absences.map((absence) => (
                <AbsenceRowItem key={absence.id} absence={absence} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with clear button */}
      {absences.length > 0 && (
        <div className="px-6 py-4 border-t border-white/10 flex justify-end">
          <button
            onClick={handleClear}
            disabled={isClearPending}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-40"
          >
            {isClearPending
              ? "Limpiando…"
              : `Limpiar Novedades del Mes`}
          </button>
        </div>
      )}
    </div>
  );
}
