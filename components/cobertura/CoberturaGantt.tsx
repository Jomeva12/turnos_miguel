"use client";

// ============================================================
// CoberturaGantt — Gantt horizontal 6:00-22:00 por area
// ============================================================

interface ShiftBlock {
  employeeName: string;
  timeSlot: string | null;
}

interface AreaRow {
  areaId: number;
  areaName: string;
  areaColor: string;
  shifts: ShiftBlock[];
}

export interface CoberturaData {
  areas: AreaRow[];
}

interface Props {
  data: CoberturaData;
}

// ---- Gantt math ----
const GANTT_START = 360;   // 6:00 in minutes from midnight
const GANTT_END = 1320;    // 22:00 in minutes from midnight
const GANTT_RANGE = GANTT_END - GANTT_START; // 960 minutes

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

function calcLeft(startMin: number): string {
  const pct = Math.max(0, (startMin - GANTT_START) / GANTT_RANGE) * 100;
  return `${pct}%`;
}

function calcWidth(startMin: number, endMin: number): string {
  const clamped = Math.min(endMin, GANTT_END);
  const pct = Math.max(0, (clamped - startMin) / GANTT_RANGE) * 100;
  return `${pct}%`;
}

// Parse a timeSlot string into an array of [start, end] minute pairs
function parseTimeSlot(timeSlot: string): Array<[number, number]> {
  return timeSlot.split("|").map((segment) => {
    const [start, end] = segment.trim().split("-");
    return [timeToMinutes(start), timeToMinutes(end)];
  });
}

// ---- Hour labels (6:00 to 22:00) ----
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6..22

// ---- Row height ----
const ROW_H = "h-8";

export default function CoberturaGantt({ data }: Props) {
  const hasShifts = data.areas.some((a) => a.shifts.length > 0);

  return (
    <div className="w-full overflow-x-auto">
      {/* Min width to keep Gantt readable on small screens */}
      <div style={{ minWidth: "900px" }}>
        {/* ---- Hour header ---- */}
        <div className="flex mb-1" style={{ paddingLeft: "140px" }}>
          <div className="relative flex-1 h-6">
            {HOURS.map((h) => {
              const pct = ((h * 60 - GANTT_START) / GANTT_RANGE) * 100;
              return (
                <span
                  key={h}
                  className="absolute text-xs select-none"
                  style={{
                    left: `${pct}%`,
                    color: "var(--muted-foreground)",
                    transform: "translateX(-50%)",
                  }}
                >
                  {`${h}:00`}
                </span>
              );
            })}
          </div>
        </div>

        {/* ---- Grid background lines + area rows ---- */}
        {data.areas.length === 0 ? (
          <p className="text-center py-8" style={{ color: "var(--muted-foreground)" }}>
            No hay turnos registrados para esta fecha.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {data.areas.map((area) => {
              const isGeneral = area.areaName === "General";

              // For General: one sub-row per shift; for others: all shifts in one row
              const rows: ShiftBlock[][] = isGeneral
                ? area.shifts.map((s) => [s])
                : area.shifts.length === 0
                ? [[]] // show empty row
                : [area.shifts];

              // If no shifts and not General: still show one empty row
              if (!isGeneral && area.shifts.length === 0) {
                // rows already has [[]]
              }

              return (
                <div key={area.areaId}>
                  {rows.map((rowShifts, rowIdx) => {
                    const label =
                      isGeneral && rowShifts.length > 0
                        ? rowShifts[0].employeeName
                        : rowIdx === 0
                        ? area.areaName
                        : ""; // hide area label on sub-rows past first for non-General

                    return (
                      <div key={rowIdx} className="flex items-center gap-2 mb-0.5">
                        {/* Label */}
                        <div
                          className="text-xs text-right shrink-0 truncate"
                          style={{
                            width: "132px",
                            minWidth: "132px",
                            color:
                              label
                                ? "var(--foreground)"
                                : "transparent",
                          }}
                          title={label}
                        >
                          {label || "."}
                        </div>

                        {/* Timeline bar */}
                        <div
                          className={`relative flex-1 ${ROW_H} rounded`}
                          style={{ background: "rgba(255,255,255,0.04)" }}
                        >
                          {/* 15-min grid lines */}
                          {Array.from({ length: 64 }, (_, i) => (
                            <div
                              key={i}
                              className="absolute top-0 bottom-0 w-px"
                              style={{
                                left: `${(i / 64) * 100}%`,
                                background:
                                  i % 4 === 0
                                    ? "rgba(255,255,255,0.12)"
                                    : "rgba(255,255,255,0.04)",
                              }}
                            />
                          ))}

                          {/* Shift blocks */}
                          {rowShifts.map((shift, sIdx) => {
                            if (
                              !shift.timeSlot ||
                              shift.timeSlot === "DESCANSO"
                            )
                              return null;

                            const segments = parseTimeSlot(shift.timeSlot);

                            return segments.map(([startMin, endMin], segIdx) => (
                              <div
                                key={`${sIdx}-${segIdx}`}
                                className="absolute top-0 bottom-0 rounded"
                                style={{
                                  left: calcLeft(startMin),
                                  width: calcWidth(startMin, endMin),
                                  backgroundColor: area.areaColor,
                                  opacity: 0.75,
                                }}
                                title={`${shift.employeeName} — ${shift.timeSlot}`}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLElement).style.opacity = "0.95";
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLElement).style.opacity = "0.75";
                                }}
                              />
                            ));
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {!hasShifts && data.areas.length > 0 && (
          <p
            className="text-center text-sm mt-4"
            style={{ color: "var(--muted-foreground)" }}
          >
            No hay turnos registrados para esta fecha.
          </p>
        )}
      </div>
    </div>
  );
}
