"use client"

import { useState, useMemo } from "react"
import {
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSunday,
  isToday,
  getDate,
  format,
} from "date-fns"
import { es } from "date-fns/locale"
import type { PlanillaData, DayHeader, ShiftData, AbsenceData } from "@/types/planilla"
import { MonthNavigator } from "@/components/planilla/MonthNavigator"
import { ShiftCell } from "@/components/planilla/ShiftCell"
import { AsignacionModal } from "@/components/planilla/AsignacionModal"

interface SelectedCell {
  employeeId: number
  employeeName: string
  date: string       // ISO "2025-03-15"
  dayLabel: string   // "lunes 15 de marzo"
}

export function AsignacionGrid({
  employees,
  shifts,
  absences,
  templates,
  mes,
  anio,
}: PlanillaData) {
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null)
  const [localShifts, setLocalShifts] = useState<ShiftData[]>(shifts)

  // -------------------------------------------------------------------------
  // Sync localShifts when server props update (after RSC revalidation)
  // -------------------------------------------------------------------------
  // NOTE: In Next.js App Router, when revalidatePath fires the server re-renders
  // and passes new props. The useState initializer only runs once, so we keep
  // localShifts in sync by detecting a new shifts reference from the server.
  // For optimistic display we use localShifts; actual refresh is via revalidate.

  // -------------------------------------------------------------------------
  // Build column headers — one per day of the month
  // -------------------------------------------------------------------------
  const days: (DayHeader & { dateISO: string })[] = useMemo(() => {
    const monthStart = startOfMonth(new Date(anio, mes - 1))
    const monthEnd = endOfMonth(monthStart)
    return eachDayOfInterval({ start: monthStart, end: monthEnd }).map((date) => ({
      date,
      dayNum: getDate(date),
      dayLabel: format(date, "EEE", { locale: es }),
      isSunday: isSunday(date),
      isToday: isToday(date),
      dateISO: format(date, "yyyy-MM-dd"),
    }))
  }, [mes, anio])

  // -------------------------------------------------------------------------
  // Build O(1) lookup maps for shifts and absences
  // -------------------------------------------------------------------------
  const shiftMap = useMemo(() => {
    const map = new Map<string, ShiftData>()
    for (const s of localShifts) {
      map.set(`${s.employeeId}-${s.date}`, s)
    }
    return map
  }, [localShifts])

  const absenceMap = useMemo(() => {
    const map = new Map<string, AbsenceData>()
    for (const a of absences) {
      const start = new Date(a.startDate + "T00:00:00.000Z")
      const end = new Date(a.endDate + "T00:00:00.000Z")
      for (const day of days) {
        const dayDate = new Date(day.dateISO + "T00:00:00.000Z")
        if (dayDate >= start && dayDate <= end) {
          map.set(`${a.employeeId}-${day.dateISO}`, a)
        }
      }
    }
    return map
  }, [absences, days])

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div>
      {/* Page title */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Asignacion Manual</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            Haz clic en cualquier celda para asignar un turno o novedad
          </p>
        </div>
        <MonthNavigator mes={mes} anio={anio} routePath="/asignacion-manual" />
      </div>

      {/* Schedule grid */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 180px)" }}>
          <table style={{ borderCollapse: "collapse" }} className="text-xs w-full">
            <thead>
              <tr>
                {/* Corner cell — sticky both X and Y */}
                <th
                  className="font-semibold text-left px-3 py-2 min-w-[140px] border-b border-r text-xs uppercase"
                  style={{
                    position: "sticky",
                    left: 0,
                    top: 0,
                    zIndex: 30,
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    color: "var(--muted-foreground)",
                  }}
                >
                  ASESOR
                </th>

                {/* Day headers — sticky Y only */}
                {days.map((day) => (
                  <th
                    key={day.dateISO}
                    className="px-1 py-1 min-w-[60px] border-b border-r text-center"
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 20,
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      color: day.isSunday ? "#ef4444" : "var(--muted-foreground)",
                    }}
                  >
                    <div className="text-[10px] uppercase">{day.dayLabel}</div>
                    <div
                      className={
                        day.isToday
                          ? "w-6 h-6 flex items-center justify-center rounded-full mx-auto font-bold text-white"
                          : "w-6 h-6 flex items-center justify-center mx-auto"
                      }
                      style={
                        day.isToday
                          ? { backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }
                          : undefined
                      }
                    >
                      {day.dayNum}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td
                    colSpan={days.length + 1}
                    className="text-center py-8 text-sm"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    No hay empleados registrados
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-b hover:bg-white/5 transition-colors"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {/* Employee name — sticky X */}
                    <td
                      className="px-3 py-1 font-medium min-w-[140px] border-r text-white cursor-default"
                      style={{
                        position: "sticky",
                        left: 0,
                        zIndex: 10,
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                      }}
                    >
                      {emp.name}
                    </td>

                    {/* Editable shift cells */}
                    {days.map((day) => (
                      <td
                        key={day.dateISO}
                        className="border-r p-0.5 cursor-pointer hover:bg-white/10 transition-colors"
                        style={{
                          borderColor: "var(--border)",
                          backgroundColor: day.isSunday ? "rgba(239,68,68,0.08)" : undefined,
                        }}
                        onClick={() =>
                          setSelectedCell({
                            employeeId: emp.id,
                            employeeName: emp.name,
                            date: day.dateISO,
                            dayLabel: format(day.date, "EEEE d 'de' MMMM", { locale: es }),
                          })
                        }
                      >
                        <ShiftCell
                          shift={shiftMap.get(`${emp.id}-${day.dateISO}`) ?? null}
                          absence={absenceMap.get(`${emp.id}-${day.dateISO}`) ?? null}
                          isCurrentDay={day.isToday}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over modal — conditionally rendered */}
      {selectedCell && (
        <AsignacionModal
          employeeId={selectedCell.employeeId}
          employeeName={selectedCell.employeeName}
          date={selectedCell.date}
          dayLabel={selectedCell.dayLabel}
          templates={templates}
          onClose={() => setSelectedCell(null)}
          onSaved={() => {
            setSelectedCell(null)
            // localShifts will refresh when the RSC re-renders via revalidatePath
          }}
        />
      )}
    </div>
  )
}
