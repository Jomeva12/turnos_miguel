"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { eachDayOfInterval, startOfMonth, endOfMonth, isSunday, isToday, format } from "date-fns"
import { es } from "date-fns/locale"
import type { ShiftData, AbsenceData, EmployeeRow, TemplateOption } from "@/types/planilla"
import { MonthNavigator } from "@/components/planilla/MonthNavigator"
import { ShiftCell } from "@/components/planilla/ShiftCell"
import { AsignacionModal } from "@/components/planilla/AsignacionModal"

interface EditorIndividualProps {
  employee: EmployeeRow
  shifts: ShiftData[]
  absences: AbsenceData[]
  templates: TemplateOption[]
  mes: number
  anio: number
}

export function EditorIndividual({
  employee,
  shifts,
  absences,
  templates,
  mes,
  anio,
}: EditorIndividualProps) {
  const [selectedDay, setSelectedDay] = useState<{ date: string; dayLabel: string } | null>(null)

  // Generate all days of the month
  const days = useMemo(() => {
    const monthStart = startOfMonth(new Date(anio, mes - 1))
    const monthEnd = endOfMonth(monthStart)
    return eachDayOfInterval({ start: monthStart, end: monthEnd }).map((day) => ({
      day,
      dateISO: format(day, "yyyy-MM-dd"),
      isSunday: isSunday(day),
      isToday: isToday(day),
    }))
  }, [mes, anio])

  // Build O(1) lookup map for shifts
  const shiftMap = useMemo(() => {
    const map = new Map<string, ShiftData>()
    for (const s of shifts) {
      map.set(s.date, s)
    }
    return map
  }, [shifts])

  // Build O(1) lookup map for absences (expand ranges into individual days)
  const absenceMap = useMemo(() => {
    const map = new Map<string, AbsenceData>()
    for (const a of absences) {
      const start = new Date(a.startDate + "T00:00:00.000Z")
      const end = new Date(a.endDate + "T00:00:00.000Z")
      for (const { dateISO } of days) {
        const dayDate = new Date(dateISO + "T00:00:00.000Z")
        if (dayDate >= start && dayDate <= end) {
          map.set(dateISO, a)
        }
      }
    }
    return map
  }, [absences, days])

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/planilla?mes=${mes}&anio=${anio}`}
            className="text-sm hover:text-white/80 transition-colors flex items-center gap-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            ← Volver a planilla
          </Link>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold text-white">{employee.name}</h1>
          <MonthNavigator
            mes={mes}
            anio={anio}
            routePath={`/editor/${employee.id}`}
          />
        </div>
      </div>

      {/* Days grid — 7 columns (one per day of week) */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Day-of-week header row */}
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
          <div
            key={d}
            className="text-center text-[10px] uppercase font-semibold py-1"
            style={{ color: d === "Dom" ? "#ef4444" : "var(--muted-foreground)" }}
          >
            {d}
          </div>
        ))}

        {/* Leading empty cells to align first day of month */}
        {Array.from({ length: getWeekOffset(days[0]?.day) }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cards */}
        {days.map(({ day, dateISO, isSunday: sun, isToday: today }) => (
          <div
            key={dateISO}
            onClick={() =>
              setSelectedDay({
                date: dateISO,
                dayLabel: format(day, "EEEE d 'de' MMMM", { locale: es }),
              })
            }
            className="glass p-2 rounded cursor-pointer hover:bg-white/10 min-h-[70px] flex flex-col gap-1 transition-colors"
            style={{
              border: `1px solid ${sun ? "#ef4444" : "var(--glass-border, var(--border))"}`,
            }}
          >
            {/* Day number */}
            <span
              className={`text-xs font-bold ${sun ? "text-red-400" : "text-white/60"}`}
            >
              {today ? (
                <span
                  className="inline-flex items-center justify-center rounded-full w-5 h-5 text-xs font-bold"
                  style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
                >
                  {format(day, "d")}
                </span>
              ) : (
                format(day, "d")
              )}
            </span>

            {/* Shift / absence status */}
            <ShiftCell
              shift={shiftMap.get(dateISO) ?? null}
              absence={absenceMap.get(dateISO) ?? null}
            />
          </div>
        ))}
      </div>

      {/* Assignment modal */}
      {selectedDay && (
        <AsignacionModal
          employeeId={employee.id}
          employeeName={employee.name}
          date={selectedDay.date}
          dayLabel={selectedDay.dayLabel}
          templates={templates}
          onClose={() => setSelectedDay(null)}
          onSaved={() => setSelectedDay(null)}
        />
      )}
    </div>
  )
}

/**
 * Returns the number of leading empty cells needed to align the first day
 * of the month to the correct column in a Mon-first 7-column grid.
 * JS getDay(): 0=Sun,1=Mon,...,6=Sat → ISO: Mon=0...Sat=5,Sun=6
 */
function getWeekOffset(date: Date | undefined): number {
  if (!date) return 0
  const jsDay = date.getDay() // 0=Sun
  // Convert to Mon-first index (Mon=0, ..., Sat=5, Sun=6)
  return jsDay === 0 ? 6 : jsDay - 1
}
