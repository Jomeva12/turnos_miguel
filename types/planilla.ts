/**
 * Type contracts for the planilla (schedule grid) UI layer.
 * Pure TypeScript interfaces only — no runtime code, no Prisma imports.
 * Date fields are plain ISO "YYYY-MM-DD" strings to avoid server→client
 * serialization issues with Date objects.
 */

// Opciones del selector de mes
export interface MonthYear {
  mes: number   // 1-12
  anio: number  // e.g. 2025
}

// Encabezado de columna del cronograma (un día del mes)
export interface DayHeader {
  date: Date
  dayNum: number      // 1-31
  dayLabel: string    // "lun", "mar" ... (date-fns es locale)
  isSunday: boolean
  isToday: boolean
}

// Turno de un empleado en un día
export interface ShiftData {
  id: number
  employeeId: number
  date: string          // ISO date "2025-03-15"
  timeSlot: string | null  // null = descanso
  areaId: number | null
  areaName: string | null
  areaColor: string | null // hex color from AREA_COLORS
  isManual: boolean
}

// Novedad (ausencia) de un empleado
export interface AbsenceData {
  id: number
  employeeId: number
  startDate: string   // ISO date
  endDate: string     // ISO date
  type: 'VAC' | 'INC' | 'PER' | 'CAL' | 'DESCANSO'
}

// Empleado con sus áreas habilitadas
export interface EmployeeRow {
  id: number
  name: string
  areaIds: number[]
  areaNames: string[]
}

// Plantilla de turno para el modal de asignación
export interface TemplateOption {
  id: number
  areaId: number
  areaName: string
  dayOfWeek: number
  timeSlot: string
  isWildcard: boolean
  requiredCount: number
}

// Prop raíz del PlanillaGrid Client Component
export interface PlanillaData {
  employees: EmployeeRow[]
  shifts: ShiftData[]
  absences: AbsenceData[]
  templates: TemplateOption[]
  mes: number
  anio: number
}
