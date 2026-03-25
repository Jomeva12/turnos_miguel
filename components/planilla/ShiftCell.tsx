"use client"

import type { ShiftData, AbsenceData } from "@/types/planilla"

interface ShiftCellProps {
  shift: ShiftData | null
  absence: AbsenceData | null
  isCurrentDay?: boolean
}

const ABSENCE_COLORS: Record<string, string> = {
  VAC: "#3b82f6",
  INC: "#f97316",
  PER: "#22c55e",
  CAL: "#a855f7",
  DESCANSO: "#6b7280",
}

export function ShiftCell({ shift, absence, isCurrentDay }: ShiftCellProps) {
  // Absence takes precedence over shift
  if (absence) {
    const bg = ABSENCE_COLORS[absence.type] ?? "#6b7280"
    return (
      <div
        className="min-h-[52px] p-1 text-xs rounded flex flex-col items-center justify-center gap-0.5 relative font-medium"
        style={{ backgroundColor: bg, color: "white" }}
      >
        {absence.type}
      </div>
    )
  }

  // Descanso (rest day) — shift with no timeSlot
  if (shift && shift.timeSlot === null) {
    return (
      <div
        className="min-h-[52px] p-1 text-xs rounded flex flex-col items-center justify-center gap-0.5 relative"
        style={{ backgroundColor: "#6b7280", color: "white" }}
      >
        DESC
      </div>
    )
  }

  // Shift with a timeSlot
  if (shift && shift.timeSlot !== null) {
    const slots = shift.timeSlot.includes("|")
      ? shift.timeSlot.split("|")
      : [shift.timeSlot]

    return (
      <div className="min-h-[52px] p-1 text-xs rounded flex flex-col gap-0.5 relative">
        {shift.isManual && (
          <span className="absolute top-0.5 right-0.5 text-[10px]" title="Asignación manual">
            ✏️
          </span>
        )}
        <div className="flex flex-col gap-0.5">
          {slots.map((slot, i) => (
            <span key={i} className="text-white leading-tight">
              {slot}
            </span>
          ))}
        </div>
        {shift.areaName && (
          <span
            className="inline-block text-[10px] rounded-full px-1 text-white leading-tight mt-auto"
            style={{ backgroundColor: shift.areaColor ?? "#6b7280" }}
          >
            {shift.areaName}
          </span>
        )}
      </div>
    )
  }

  // Empty cell
  return (
    <div className="min-h-[52px] p-1 text-xs rounded flex items-center justify-center text-white/30">
      —
    </div>
  )
}
