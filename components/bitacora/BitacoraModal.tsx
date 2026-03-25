"use client";

import type { LogEntry } from "@/types/generation";

interface BitacoraModalProps {
  entries: LogEntry[];
}

const TYPE_ORDER: Array<LogEntry["type"]> = ["error", "warning", "info"];

const TYPE_STYLES: Record<LogEntry["type"], string> = {
  error:
    "px-2 py-0.5 rounded text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30",
  warning:
    "px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30",
  info: "px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30",
};

const TYPE_LABELS: Record<LogEntry["type"], string> = {
  error: "error",
  warning: "aviso",
  info: "info",
};

export function BitacoraModal({ entries }: BitacoraModalProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        No hay entradas en esta bitácora.
      </p>
    );
  }

  // Group entries: errors → warnings → info
  const grouped = TYPE_ORDER.flatMap((type) =>
    entries.filter((e) => e.type === type)
  );

  return (
    <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
      {grouped.map((entry, idx) => (
        <div
          key={idx}
          className="flex items-start gap-3 px-3 py-2 rounded-md"
          style={{ background: "var(--glass-bg)" }}
        >
          <span className={`mt-0.5 shrink-0 ${TYPE_STYLES[entry.type]}`}>
            {TYPE_LABELS[entry.type]}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white leading-snug">{entry.message}</p>
            {(entry.date || entry.employeeId != null) && (
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--muted-foreground)" }}
              >
                {entry.date && <span>{entry.date}</span>}
                {entry.date && entry.employeeId != null && (
                  <span className="mx-1">·</span>
                )}
                {entry.employeeId != null && (
                  <span>Empleado #{entry.employeeId}</span>
                )}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
