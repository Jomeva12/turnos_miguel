"use client"

import { useMemo } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { ShiftData, AbsenceData, EmployeeRow } from "@/types/planilla"

interface CoberturaSidebarProps {
  day: Date | null
  shifts: ShiftData[]
  absences: AbsenceData[]
  employees: EmployeeRow[]
  onClose: () => void
}

export function CoberturaSidebar({
  day,
  shifts,
  absences,
  employees,
  onClose,
}: CoberturaSidebarProps) {
  if (!day) return null

  const dateISO = format(day, "yyyy-MM-dd")
  const dateLabel = format(day, "EEEE d 'de' MMMM", { locale: es })
  // Capitalize first letter
  const dateFormatted = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)

  const { trabajando, descanso, vacaciones, porArea } = useMemo(() => {
    const dayAbsences = absences.filter((a) => {
      const start = new Date(a.startDate + "T00:00:00.000Z")
      const end = new Date(a.endDate + "T00:00:00.000Z")
      const d = new Date(dateISO + "T00:00:00.000Z")
      return d >= start && d <= end
    })

    const vacacionesSet = new Set<number>(
      dayAbsences.filter((a) => a.type === "VAC").map((a) => a.employeeId)
    )

    const dayShifts = shifts.filter((s) => s.date === dateISO)

    let trabajando = 0
    let descanso = 0
    const areaMap = new Map<string, { count: number; color: string | null }>()

    for (const s of dayShifts) {
      if (s.timeSlot !== null) {
        trabajando++
        const areaKey = s.areaName ?? "Sin área"
        const existing = areaMap.get(areaKey)
        if (existing) {
          existing.count++
        } else {
          areaMap.set(areaKey, { count: 1, color: s.areaColor })
        }
      } else {
        descanso++
      }
    }

    const porArea = Array.from(areaMap.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      color: data.color,
    }))

    return { trabajando, descanso, vacaciones: vacacionesSet.size, porArea }
  }, [dateISO, shifts, absences])

  const total = employees.length

  return (
    <div
      className="glass-card w-64 shrink-0 flex flex-col gap-3 p-4 self-start"
      style={{ border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
            Cobertura
          </p>
          <p className="text-sm font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
            {dateFormatted}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-xs leading-none w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition-colors shrink-0"
          style={{ color: "var(--muted-foreground)" }}
          aria-label="Cerrar panel"
        >
          ✕
        </button>
      </div>

      <hr style={{ borderColor: "var(--border)" }} />

      {/* Summary rows */}
      <div>
        <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>
          Resumen del día
        </p>
        <div className="flex flex-col gap-1.5">
          <SummaryRow icon="💼" label="Trabajando" value={trabajando} color="var(--primary)" />
          <SummaryRow icon="🛌" label="Descanso" value={descanso} color="var(--muted-foreground)" />
          <SummaryRow icon="🏖️" label="Vacaciones" value={vacaciones} color="#f59e0b" />
          <SummaryRow icon="👥" label="Total asesores" value={total} color="var(--foreground)" />
        </div>
      </div>

      {porArea.length > 0 && (
        <>
          <hr style={{ borderColor: "var(--border)" }} />

          {/* By area */}
          <div>
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>
              Por área
            </p>
            <div className="flex flex-col gap-1.5">
              {porArea.map((a) => (
                <div key={a.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: a.color ?? "#6b7280" }}
                    />
                    <span
                      className="text-xs truncate"
                      style={{ color: "var(--foreground)" }}
                    >
                      {a.name}
                    </span>
                  </div>
                  <span
                    className="text-xs font-semibold tabular-nums shrink-0"
                    style={{ color: "var(--primary)" }}
                  >
                    {a.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function SummaryRow({
  icon,
  label,
  value,
  color,
}: {
  icon: string
  label: string
  value: number
  color: string
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{icon}</span>
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {label}
        </span>
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  )
}
