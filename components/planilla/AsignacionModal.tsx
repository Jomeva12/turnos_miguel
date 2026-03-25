"use client"

import { useTransition } from "react"
import { getDay } from "date-fns"
import { assignShift } from "@/lib/actions/shifts"
import { AREA_COLORS } from "@/lib/constants/areas"
import type { TemplateOption } from "@/types/planilla"

interface AsignacionModalProps {
  employeeId: number
  employeeName: string
  date: string       // ISO "2025-03-15"
  dayLabel: string   // "lunes 15 de marzo"
  templates: TemplateOption[]
  onClose: () => void
  onSaved: () => void
}

// Novedades with semantic colors
const NOVEDADES = [
  { type: "VAC",      label: "VACACIONES",   color: "#3b82f6" },
  { type: "INC",      label: "INCAPACIDAD",  color: "#f97316" },
  { type: "PER",      label: "PERMISO",      color: "#22c55e" },
  { type: "CAL",      label: "CALAMIDAD",    color: "#a855f7" },
  { type: "DESCANSO", label: "DESCANSO",     color: "#6b7280" },
] as const

// Convert JS Date.getDay() (0=Sun,1=Mon,...) to DB dayOfWeek (1=Mon,...7=Sun)
function jsGetDayToDbDayOfWeek(jsDay: number): number {
  // js: 0=Sun → 7, 1=Mon → 1, ..., 6=Sat → 6
  return jsDay === 0 ? 7 : jsDay
}

export function AsignacionModal({
  employeeId,
  employeeName,
  date,
  dayLabel,
  templates,
  onClose,
  onSaved,
}: AsignacionModalProps) {
  const [pending, startTransition] = useTransition()

  // Determine which day of week this date is (DB encoding: 1=Mon...7=Sun)
  const dateObj = new Date(date + "T00:00:00")
  const dbDayOfWeek = jsGetDayToDbDayOfWeek(getDay(dateObj))

  // Filter templates to those matching this day of week, then group by area
  const dayTemplates = templates.filter(
    (t) => t.dayOfWeek === dbDayOfWeek
  )

  // Group by areaName
  const byArea = dayTemplates.reduce<Record<string, TemplateOption[]>>(
    (acc, t) => {
      if (!acc[t.areaName]) acc[t.areaName] = []
      acc[t.areaName].push(t)
      return acc
    },
    {}
  )

  function handleSelect(
    templateId: number | null,
    absenceType: string | null
  ) {
    startTransition(async () => {
      await assignShift(employeeId, date, templateId, absenceType)
      onSaved()
      onClose()
    })
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div
        className="fixed top-0 right-0 h-full w-80 z-50 flex flex-col shadow-2xl"
        style={{ backgroundColor: "var(--card)", borderLeft: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between p-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <p className="font-semibold text-white text-sm">{employeeName}</p>
            <p className="text-xs capitalize" style={{ color: "var(--muted-foreground)" }}>
              {dayLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors text-xl leading-none ml-2 mt-0.5"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* Novedades section */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted-foreground)" }}>
              Novedades
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {NOVEDADES.map((nov) => (
                <button
                  key={nov.type}
                  disabled={pending}
                  onClick={() => handleSelect(null, nov.type)}
                  className="py-2 px-3 rounded text-white text-xs font-medium disabled:opacity-50 hover:brightness-110 transition-all"
                  style={{ backgroundColor: nov.color }}
                >
                  {nov.type}
                  <span className="block text-[10px] font-normal opacity-80">{nov.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Turnos section — grouped by area */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted-foreground)" }}>
              Turnos
            </h3>
            {Object.keys(byArea).length === 0 ? (
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                No hay plantillas para este día
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(byArea).map(([areaName, areaTemplates]) => {
                  const areaColor = AREA_COLORS[areaName] ?? "#6b7280"
                  return (
                    <div key={areaName}>
                      {/* Area badge */}
                      <span
                        className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full text-white mb-1.5"
                        style={{ backgroundColor: areaColor }}
                      >
                        {areaName}
                      </span>
                      {/* Template buttons */}
                      <div className="space-y-1">
                        {areaTemplates.map((t) => (
                          <button
                            key={t.id}
                            disabled={pending}
                            onClick={() => handleSelect(t.id, null)}
                            className="w-full text-left text-xs px-3 py-2 rounded border disabled:opacity-50 hover:bg-white/10 transition-colors"
                            style={{
                              borderColor: "var(--border)",
                              color: "var(--foreground)",
                            }}
                          >
                            <span className="font-medium">{t.timeSlot}</span>
                            {t.isWildcard && (
                              <span
                                className="ml-2 text-[10px] px-1 rounded"
                                style={{ backgroundColor: "#f59e0b", color: "white" }}
                              >
                                comodín
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        {/* Footer: Quitar turno */}
        <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            disabled={pending}
            onClick={() => handleSelect(null, null)}
            className="w-full py-2 text-xs rounded border disabled:opacity-50 hover:bg-white/10 transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
          >
            Quitar turno (DESCANSO)
          </button>
        </div>
      </div>
    </>
  )
}
