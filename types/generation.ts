/**
 * Type contracts for the shift generation algorithm.
 * Pure TypeScript interfaces only — no runtime code, no Prisma imports.
 * Date fields are plain ISO "YYYY-MM-DD" strings throughout.
 */

/** A single absence record for an employee. */
export interface AbsenceRecord {
  employeeId: number
  /** ISO date string "YYYY-MM-DD" */
  startDate: string
  /** ISO date string "YYYY-MM-DD" */
  endDate: string
  /** "VAC" | "INC" | "PER" | "CAL" | "DESCANSO" */
  type: string
}

/** An employee with the list of areas they are enabled for. */
export interface EmployeeWithAreas {
  id: number
  name: string
  areas: {
    areaId: number
    areaName: string
  }[]
}

/** A shift template flattened — area name is a string, not a nested object. */
export interface ShiftTemplateFlat {
  id: number
  areaId: number
  areaName: string
  /** 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun */
  dayOfWeek: number
  /** e.g. "7:00-14:00" or "7:00-11:00|11:30-14:30" */
  timeSlot: string
  isWildcard: boolean
  requiredCount: number
}

/** All data the algorithm needs to generate shifts for a given month. */
export interface GenerationInput {
  month: number
  year: number
  employees: EmployeeWithAreas[]
  templates: ShiftTemplateFlat[]
  absences: AbsenceRecord[]
}

/** One output shift produced by the algorithm. */
export interface GeneratedShift {
  employeeId: number
  /** ISO date string "YYYY-MM-DD" */
  date: string
  /** null when isRest is true (descanso) */
  timeSlot: string | null
  /** null when isRest is true (descanso) */
  areaId: number | null
  isRest: boolean
}

/** A single log entry produced during generation. */
export interface LogEntry {
  type: "info" | "warning" | "error"
  message: string
  employeeId?: number
  /** ISO date string "YYYY-MM-DD" */
  date?: string
}

/** The complete result returned by the generation algorithm. */
export interface GenerationResult {
  shifts: GeneratedShift[]
  log: LogEntry[]
}
