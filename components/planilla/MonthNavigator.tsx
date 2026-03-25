"use client"

import { useRouter } from "next/navigation"
import { addMonths, subMonths } from "date-fns"
import { formatMonthYear } from "@/lib/utils/format"

interface MonthNavigatorProps {
  mes: number
  anio: number
  routePath?: string  // default: "/planilla"
}

export function MonthNavigator({ mes, anio, routePath = "/planilla" }: MonthNavigatorProps) {
  const router = useRouter()
  const current = new Date(anio, mes - 1, 1)

  function navigate(direction: "prev" | "next") {
    const target = direction === "prev" ? subMonths(current, 1) : addMonths(current, 1)
    const newMes = target.getMonth() + 1
    const newAnio = target.getFullYear()
    router.push(`${routePath}?mes=${newMes}&anio=${newAnio}`)
  }

  return (
    <div className="flex items-center gap-3 text-white font-semibold">
      <button
        onClick={() => navigate("prev")}
        className="px-2 py-1 rounded hover:bg-white/10 transition-colors"
        aria-label="Mes anterior"
      >
        {"<"}
      </button>
      <span className="min-w-[160px] text-center text-lg">
        {formatMonthYear(current)}
      </span>
      <button
        onClick={() => navigate("next")}
        className="px-2 py-1 rounded hover:bg-white/10 transition-colors"
        aria-label="Mes siguiente"
      >
        {">"}
      </button>
    </div>
  )
}
