"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { eachDayOfInterval, startOfMonth, endOfMonth, isSunday, isToday, getDate, format } from "date-fns"
import { es } from "date-fns/locale"
import type { PlanillaData, DayHeader, ShiftData, AbsenceData, EmployeeRow } from "@/types/planilla"
import { MonthNavigator } from "@/components/planilla/MonthNavigator"
import { PlanillaToolbar } from "@/components/planilla/PlanillaToolbar"
import { ShiftCell } from "@/components/planilla/ShiftCell"
import { CoberturaSidebar } from "@/components/planilla/CoberturaSidebar"
import { EmpleadoPerfil } from "@/components/planilla/EmpleadoPerfil"

export function PlanillaGrid({
  employees,
  shifts,
  absences,
  templates,
  mes,
  anio,
}: PlanillaData) {
  const router = useRouter()

  const [areaFilter, setAreaFilter] = useState<string[]>([])
  const [novedadFilter, setNovedadFilter] = useState<string[]>([])
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRow | null>(null)

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
  // key: `${employeeId}-${dateISO}`
  // -------------------------------------------------------------------------
  const shiftMap = useMemo(() => {
    const map = new Map<string, ShiftData>()
    for (const s of shifts) {
      map.set(`${s.employeeId}-${s.date}`, s)
    }
    return map
  }, [shifts])

  const absenceMap = useMemo(() => {
    const map = new Map<string, AbsenceData>()
    // Expand each absence range into individual days within this month
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
  // Filter employees
  // -------------------------------------------------------------------------
  const filteredEmployees = useMemo(() => {
    let result = employees

    if (areaFilter.length > 0) {
      result = result.filter((emp) =>
        emp.areaNames.some((name) => areaFilter.includes(name))
      )
    }

    if (novedadFilter.length > 0) {
      result = result.filter((emp) =>
        absences.some(
          (a) => a.employeeId === emp.id && novedadFilter.includes(a.type)
        )
      )
    }

    return result
  }, [employees, areaFilter, novedadFilter, absences])

  // -------------------------------------------------------------------------
  // Filter toggle handlers
  // -------------------------------------------------------------------------
  function handleAreaFilter(area: string) {
    setAreaFilter((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    )
  }

  function handleNovedadFilter(novedad: string) {
    setNovedadFilter((prev) =>
      prev.includes(novedad) ? prev.filter((n) => n !== novedad) : [...prev, novedad]
    )
  }

  // -------------------------------------------------------------------------
  // Panel handlers — mutual exclusion
  // -------------------------------------------------------------------------
  function handleDayClick(date: Date) {
    setSelectedDay(date)
    setSelectedEmployee(null)
  }

  function handleEmployeeClick(emp: EmployeeRow) {
    setSelectedEmployee(emp)
    setSelectedDay(null)
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div>
      {/* Month navigator */}
      <div className="flex items-center justify-between mb-4">
        <MonthNavigator mes={mes} anio={anio} />
      </div>

      {/* Toolbar: action buttons + filters */}
      <PlanillaToolbar
        mes={mes}
        anio={anio}
        areaFilter={areaFilter}
        novedadFilter={novedadFilter}
        onAreaFilter={handleAreaFilter}
        onNovedadFilter={handleNovedadFilter}
        templates={templates}
      />

      {/* Schedule grid with lateral panels */}
      <div className="flex gap-4 items-start">
        {/* Left panel — cobertura del día */}
        <CoberturaSidebar
          day={selectedDay}
          shifts={shifts}
          absences={absences}
          employees={employees}
          onClose={() => setSelectedDay(null)}
        />

        {/* Main table — flex-1 so it fills remaining space */}
        <div className="flex-1 min-w-0">
          <div className="glass-card overflow-hidden">
            <div className="overflow-auto max-h-[calc(100vh-220px)]">
          <table className="border-collapse text-xs w-full">
            <thead
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                backgroundColor: "var(--card)",
              }}
            >
              <tr>
                <th
                  className="font-semibold text-left px-3 py-2 min-w-[140px] border-b border-r"
                  style={{
                    position: "sticky",
                    left: 0,
                    zIndex: 20,
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    color: "var(--muted-foreground)",
                  }}
                >
                  ASESOR
                </th>
                {days.map((day) => (
                  <th
                    key={day.dateISO}
                    className="px-1 py-1 min-w-[60px] border-b border-r text-center cursor-pointer hover:bg-white/5"
                    style={{
                      borderColor: "var(--border)",
                      color: day.isSunday ? "#ef4444" : "var(--muted-foreground)",
                      backgroundColor: "var(--card)",
                    }}
                    onClick={() => handleDayClick(day.date)}
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
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan={days.length + 1}
                    className="text-center py-8 text-sm"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    No hay empleados con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="border-b hover:bg-white/5 transition-colors" style={{ borderColor: "var(--border)" }}>
                    <td
                      className="px-3 py-1 font-medium min-w-[140px] border-r cursor-pointer text-white"
                      style={{
                        position: "sticky",
                        left: 0,
                        zIndex: 5,
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                      }}
                      onClick={() => handleEmployeeClick(emp)}
                    >
                      {emp.name}
                    </td>
                    {days.map((day) => (
                      <td
                        key={day.dateISO}
                        className="border-r p-0.5"
                        style={{
                          borderColor: "var(--border)",
                          backgroundColor: day.isSunday ? "rgba(239,68,68,0.08)" : undefined,
                        }}
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
        </div>

        {/* Right panel — perfil del empleado */}
        <EmpleadoPerfil
          employee={selectedEmployee}
          shifts={shifts}
          absences={absences}
          mes={mes}
          anio={anio}
          onClose={() => setSelectedEmployee(null)}
          onEditarTurnos={(id) => {
            router.push(`/editor/${id}?mes=${mes}&anio=${anio}`)
          }}
        />
      </div>
    </div>
  )
}
