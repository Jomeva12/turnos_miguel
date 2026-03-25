"use client"

import { useMemo } from "react"
import type { ShiftData, AbsenceData, EmployeeRow } from "@/types/planilla"

interface EmpleadoPerfilProps {
  employee: EmployeeRow | null
  shifts: ShiftData[]
  absences: AbsenceData[]
  mes: number
  anio: number
  onClose: () => void
  onEditarTurnos: (employeeId: number) => void
}

export function EmpleadoPerfil({
  employee,
  shifts,
  absences,
  mes,
  anio,
  onClose,
  onEditarTurnos,
}: EmpleadoPerfilProps) {
  if (!employee) return null

  const { totalTrabajando, totalDescansos, totalNovedades, areasEsteMes } = useMemo(() => {
    const monthStart = new Date(Date.UTC(anio, mes - 1, 1))
    const monthEnd = new Date(Date.UTC(anio, mes, 0))

    const empShifts = shifts.filter((s) => {
      if (s.employeeId !== employee.id) return false
      const d = new Date(s.date + "T00:00:00.000Z")
      return d >= monthStart && d <= monthEnd
    })

    const empAbsences = absences.filter((a) => {
      if (a.employeeId !== employee.id) return false
      const start = new Date(a.startDate + "T00:00:00.000Z")
      const end = new Date(a.endDate + "T00:00:00.000Z")
      return start <= monthEnd && end >= monthStart
    })

    const totalTrabajando = empShifts.filter((s) => s.timeSlot !== null).length
    const totalDescansos = empShifts.filter((s) => s.timeSlot === null).length
    const totalNovedades = empAbsences.length

    const areasEsteMes = Array.from(
      new Set(
        empShifts
          .filter((s) => s.areaName !== null)
          .map((s) => ({ name: s.areaName as string, color: s.areaColor }))
          .map((a) => JSON.stringify(a))
      )
    ).map((s) => JSON.parse(s) as { name: string; color: string | null })

    return { totalTrabajando, totalDescansos, totalNovedades, areasEsteMes }
  }, [employee, shifts, absences, mes, anio])

  return (
    <div
      className="glass-card w-64 shrink-0 flex flex-col gap-3 p-4 self-start"
      style={{ border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p
            className="text-[10px] uppercase tracking-wider"
            style={{ color: "var(--muted-foreground)" }}
          >
            Perfil
          </p>
          <p
            className="text-sm font-semibold leading-tight"
            style={{ color: "var(--foreground)" }}
          >
            {employee.name}
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

      {/* Enabled areas */}
      <div>
        <p
          className="text-[10px] uppercase tracking-wider mb-2"
          style={{ color: "var(--muted-foreground)" }}
        >
          Áreas habilitadas
        </p>
        {employee.areaNames.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {employee.areaNames.map((name) => (
              <span
                key={name}
                className="text-[11px] px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "var(--secondary)",
                  color: "var(--foreground)",
                }}
              >
                {name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Sin áreas asignadas
          </p>
        )}
      </div>

      <hr style={{ borderColor: "var(--border)" }} />

      {/* Month stats */}
      <div>
        <p
          className="text-[10px] uppercase tracking-wider mb-2"
          style={{ color: "var(--muted-foreground)" }}
        >
          Este mes
        </p>
        <div className="flex flex-col gap-1.5">
          <StatRow icon="💼" label="Trabajando" value={totalTrabajando} color="var(--primary)" />
          <StatRow icon="🛌" label="Descansos" value={totalDescansos} color="var(--muted-foreground)" />
          <StatRow icon="📋" label="Novedades" value={totalNovedades} color="#f59e0b" />
        </div>
      </div>

      {areasEsteMes.length > 0 && (
        <>
          <hr style={{ borderColor: "var(--border)" }} />
          <div>
            <p
              className="text-[10px] uppercase tracking-wider mb-2"
              style={{ color: "var(--muted-foreground)" }}
            >
              Áreas este mes
            </p>
            <div className="flex flex-wrap gap-1">
              {areasEsteMes.map((a) => (
                <span
                  key={a.name}
                  className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: "var(--secondary)",
                    color: "var(--foreground)",
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: a.color ?? "#6b7280" }}
                  />
                  {a.name}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      <hr style={{ borderColor: "var(--border)" }} />

      {/* Edit button */}
      <button
        onClick={() => onEditarTurnos(employee.id)}
        className="w-full py-2 px-3 rounded text-sm font-medium transition-colors"
        style={{
          backgroundColor: "var(--primary)",
          color: "var(--primary-foreground)",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.opacity = "0.85")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.opacity = "1")
        }
      >
        Editar Turnos
      </button>
    </div>
  )
}

function StatRow({
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
