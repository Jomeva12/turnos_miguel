"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { generateMonth } from "@/lib/actions/shifts"
import { deleteShiftsByMonth, deleteAbsencesByMonth } from "@/app/actions/cleanup"
import { AREA_NAMES, AREA_COLORS } from "@/lib/constants/areas"
import type { TemplateOption } from "@/types/planilla"

interface PlanillaToolbarProps {
  mes: number
  anio: number
  areaFilter: string[]
  novedadFilter: string[]
  onAreaFilter: (area: string) => void
  onNovedadFilter: (novedad: string) => void
  templates: TemplateOption[]
}

const NOVEDAD_TYPES = [
  { tipo: "VAC", label: "VAC", color: "#3b82f6" },
  { tipo: "INC", label: "INC", color: "#f97316" },
  { tipo: "PER", label: "PER", color: "#22c55e" },
  { tipo: "CAL", label: "CAL", color: "#a855f7" },
]

export function PlanillaToolbar({
  mes,
  anio,
  areaFilter,
  novedadFilter,
  onAreaFilter,
  onNovedadFilter,
}: PlanillaToolbarProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleGenerateMonth() {
    startTransition(async () => {
      try {
        await generateMonth(mes, anio)
      } catch (err) {
        alert(`Error al generar: ${err instanceof Error ? err.message : String(err)}`)
      }
    })
  }

  function handleClearShifts() {
    if (!confirm("¿Limpiar todos los turnos del mes? Esta acción no se puede deshacer.")) return
    startTransition(async () => {
      try {
        await deleteShiftsByMonth(anio, mes)
      } catch (err) {
        alert(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    })
  }

  function handleClearAbsences() {
    if (!confirm("¿Limpiar todas las novedades del mes? Esta acción no se puede deshacer.")) return
    startTransition(async () => {
      try {
        await deleteAbsencesByMonth(anio, mes)
      } catch (err) {
        alert(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    })
  }

  return (
    <div className="glass-card p-3 mb-4 flex flex-col gap-3">
      {/* Row 1: Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleGenerateMonth}
          disabled={isPending}
          className="px-3 py-1.5 text-sm rounded font-medium transition-opacity disabled:opacity-50"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          {isPending ? "Generando..." : "Generar Mes"}
        </button>

        <button
          onClick={() => router.push(`/asignacion-manual?mes=${mes}&anio=${anio}`)}
          className="px-3 py-1.5 text-sm rounded font-medium transition-colors"
          style={{
            backgroundColor: "var(--secondary)",
            color: "var(--secondary-foreground)",
          }}
        >
          Asignación Manual
        </button>

        <button
          onClick={() => alert("Próximamente — Phase 5")}
          className="px-3 py-1.5 text-sm rounded font-medium transition-colors"
          style={{
            backgroundColor: "var(--secondary)",
            color: "var(--secondary-foreground)",
          }}
        >
          Excel
        </button>

        <button
          onClick={handleClearShifts}
          disabled={isPending}
          className="px-3 py-1.5 text-sm rounded font-medium transition-opacity disabled:opacity-50 ml-auto"
          style={{
            backgroundColor: "var(--destructive)",
            color: "var(--destructive-foreground)",
          }}
        >
          {isPending ? "Limpiando..." : "Limpiar Turnos"}
        </button>

        <button
          onClick={handleClearAbsences}
          disabled={isPending}
          className="px-3 py-1.5 text-sm rounded font-medium transition-opacity disabled:opacity-50"
          style={{
            backgroundColor: "var(--destructive)",
            color: "var(--destructive-foreground)",
          }}
        >
          {isPending ? "Limpiando..." : "Limpiar Novedades"}
        </button>
      </div>

      {/* Row 2: Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
            Área:
          </span>
          {AREA_NAMES.map((area) => {
            const isActive = areaFilter.includes(area)
            const color = AREA_COLORS[area]
            return (
              <button
                key={area}
                onClick={() => onAreaFilter(area)}
                className="px-2 py-0.5 text-xs rounded-full transition-all border"
                style={{
                  backgroundColor: isActive ? color : "transparent",
                  color: isActive ? "white" : "var(--muted-foreground)",
                  borderColor: isActive ? color : "var(--border)",
                }}
              >
                {area}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
            Novedades:
          </span>
          {NOVEDAD_TYPES.map(({ tipo, label, color }) => {
            const isActive = novedadFilter.includes(tipo)
            return (
              <button
                key={tipo}
                onClick={() => onNovedadFilter(tipo)}
                className="px-2 py-0.5 text-xs rounded-full transition-all border"
                style={{
                  backgroundColor: isActive ? color : "transparent",
                  color: isActive ? "white" : "var(--muted-foreground)",
                  borderColor: isActive ? color : "var(--border)",
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
