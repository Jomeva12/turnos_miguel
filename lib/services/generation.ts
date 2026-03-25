/**
 * lib/services/generation.ts
 *
 * Pure TypeScript algorithm for monthly shift generation.
 * Zero dependencies on Next.js, Prisma, or server-only modules.
 * Uses date-fns for ISO week calculation and date formatting.
 */

import {
  getISOWeek,
  getDaysInMonth,
  format,
  addDays,
  parseISO,
} from "date-fns"
import type {
  GenerationInput,
  GenerationResult,
  GeneratedShift,
  LogEntry,
  EmployeeWithAreas,
  ShiftTemplateFlat,
} from "@/types/generation"

// ---------------------------------------------------------------------------
// Constants for special area names
// ---------------------------------------------------------------------------
const MARKING_AREA = "Marking"
const VALERY_AREA = "Valery Camacho"
const BUFFET_AREA = "Buffet"

// ---------------------------------------------------------------------------
// Helper: convert JS Date to "YYYY-MM-DD" string using local date components
// (avoids UTC offset shift for pure date arithmetic)
// ---------------------------------------------------------------------------
function toDateStr(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

// ---------------------------------------------------------------------------
// Helper: get ISO day of week (1=Mon … 7=Sun) from a Date
// ---------------------------------------------------------------------------
function isoDay(date: Date): number {
  const js = date.getDay() // 0=Sun, 1=Mon, …, 6=Sat
  return js === 0 ? 7 : js
}

// ---------------------------------------------------------------------------
// Helper: zona crítica — day >= 28 in the current month means it could be too
// close to month-end for a rest assignment.
// ---------------------------------------------------------------------------
function isCritica(date: Date): boolean {
  return date.getDate() >= 28
}

// ---------------------------------------------------------------------------
// Helper: check if an area is allowed to work on a given ISO day of week
// ---------------------------------------------------------------------------
function isAreaAllowedToday(areaName: string, dow: number): boolean {
  if (areaName === MARKING_AREA) return dow === 2 || dow === 4
  if (areaName === VALERY_AREA) return dow === 3
  if (areaName === BUFFET_AREA) return dow !== 7
  return true
}

// ---------------------------------------------------------------------------
// Helper: check if timeSlot is a morning slot (starts with 7:, 6:, or 8:)
// ---------------------------------------------------------------------------
function isMorningSlot(timeSlot: string): boolean {
  return (
    timeSlot.startsWith("7:") ||
    timeSlot.startsWith("6:") ||
    timeSlot.startsWith("8:") ||
    timeSlot.startsWith("07:")
  )
}

// ---------------------------------------------------------------------------
// Helper: check if timeSlot is a split shift
// ---------------------------------------------------------------------------
function isSplitShift(timeSlot: string): boolean {
  return timeSlot.includes("|")
}

// ---------------------------------------------------------------------------
// Phase 1 helper: expand absence records into a flat Set of "empId-YYYY-MM-DD"
// ---------------------------------------------------------------------------
function buildAbsenceSet(input: GenerationInput): Set<string> {
  const absent = new Set<string>()
  for (const absence of input.absences) {
    const start = parseISO(absence.startDate)
    const end = parseISO(absence.endDate)
    let cur = start
    while (cur <= end) {
      absent.add(`${absence.employeeId}-${toDateStr(cur)}`)
      cur = addDays(cur, 1)
    }
  }
  return absent
}

// ---------------------------------------------------------------------------
// Phase 2: select rest days for a single employee
//
// Rules:
//  - Exactly 4 rest days
//  - Exactly 1 must be a Sunday
//  - None on Saturday (dow=6)
//  - None on zona crítica (day >= 28)
//  - Distributed across different weeks to avoid clustering
//  - Deterministic: use employee index for stride-based distribution
// ---------------------------------------------------------------------------
function selectRestDays(
  employee: EmployeeWithAreas,
  monthDates: Date[],
  employeeIndex: number,
  log: LogEntry[],
): Set<string> {
  // Build pools
  const validDates = monthDates.filter((d) => !isCritica(d) && isoDay(d) !== 6)
  const sundays = validDates.filter((d) => isoDay(d) === 7)
  const nonSundays = validDates.filter((d) => isoDay(d) !== 7)

  // Pick 1 Sunday deterministically (offset by employee index)
  let restSunday: Date | null = null
  if (sundays.length > 0) {
    restSunday = sundays[employeeIndex % sundays.length]
  }

  // Pick 3 ordinary rest days using a stride distribution.
  // Divide the non-Sunday valid days into 3 equal segments and pick one
  // from each segment at an offset based on employee index.
  // This ensures employees don't all pick the same day.
  const pool = nonSundays.slice()
  const picked: Date[] = []
  const pickedStrs = new Set<string>()
  if (restSunday) pickedStrs.add(toDateStr(restSunday))

  if (pool.length >= 3) {
    const segmentSize = Math.floor(pool.length / 3)
    for (let seg = 0; seg < 3; seg++) {
      const segStart = seg * segmentSize
      const segEnd = seg === 2 ? pool.length : segStart + segmentSize
      const segDays = pool.slice(segStart, segEnd)
      // Pick within segment using employee index offset to stagger picks
      const idx = employeeIndex % segDays.length
      const chosen = segDays[idx]
      const ds = toDateStr(chosen)
      if (!pickedStrs.has(ds)) {
        picked.push(chosen)
        pickedStrs.add(ds)
      } else {
        // Conflict — find next available in segment
        for (const d of segDays) {
          const s = toDateStr(d)
          if (!pickedStrs.has(s)) {
            picked.push(d)
            pickedStrs.add(s)
            break
          }
        }
      }
    }
  } else {
    // Small pool — just take all available
    for (const d of pool) {
      const ds = toDateStr(d)
      if (!pickedStrs.has(ds)) {
        picked.push(d)
        pickedStrs.add(ds)
      }
    }
  }

  // GEN-13: if still not enough valid days, force from any valid day
  if (picked.length < 3) {
    for (const d of validDates) {
      if (picked.length >= 3) break
      const ds = toDateStr(d)
      if (!pickedStrs.has(ds)) {
        picked.push(d)
        pickedStrs.add(ds)
        log.push({
          type: "warning",
          message: `Employee ${employee.id} forced rest on ${ds} — insufficient valid days`,
          employeeId: employee.id,
          date: ds,
        })
      }
    }
  }

  // GEN-13: if still not 3 ordinary (extreme edge case), use any remaining month date
  if (picked.length < 3) {
    for (const d of monthDates) {
      if (picked.length >= 3) break
      const ds = toDateStr(d)
      if (!pickedStrs.has(ds)) {
        picked.push(d)
        pickedStrs.add(ds)
        log.push({
          type: "warning",
          message: `Employee ${employee.id} forced rest on ${ds} — critical zone override`,
          employeeId: employee.id,
          date: ds,
        })
      }
    }
  }

  const restSet = new Set<string>()
  if (restSunday) restSet.add(toDateStr(restSunday))
  for (const d of picked) restSet.add(toDateStr(d))

  return restSet
}

// ---------------------------------------------------------------------------
// Main exported function
// ---------------------------------------------------------------------------
export function generateMonthShifts(input: GenerationInput): GenerationResult {
  const { month, year, employees, templates, absences } = input

  // -------------------------------------------------------------------
  // Phase 1 — Build helper data structures
  // -------------------------------------------------------------------

  // Build array of all dates in the month
  const daysInMonth = getDaysInMonth(new Date(year, month - 1, 1))
  const monthDates: Date[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    monthDates.push(new Date(year, month - 1, d))
  }

  // Absence lookup
  const absentOnDay = buildAbsenceSet({ ...input, absences: absences ?? [] })

  // Employee area lookup
  const employeeAreas = new Map<number, Set<number>>()
  for (const emp of employees) {
    employeeAreas.set(emp.id, new Set(emp.areas.map((a) => a.areaId)))
  }

  // -------------------------------------------------------------------
  // Phase 2 — Determine rest days per employee
  // -------------------------------------------------------------------
  const log: LogEntry[] = []
  const employeeRestDays = new Map<number, Set<string>>()

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i]
    const restSet = selectRestDays(emp, monthDates, i, log)
    employeeRestDays.set(emp.id, restSet)
  }

  // -------------------------------------------------------------------
  // Phase 3 — Assign work shifts day by day
  // -------------------------------------------------------------------
  const shifts: GeneratedShift[] = []

  // Track per-employee assignment count for equitable distribution
  const assignmentCount = new Map<number, number>()
  for (const emp of employees) assignmentCount.set(emp.id, 0)

  // Track split shifts per employee per ISO week
  // Key: `${employeeId}-w${isoWeek}`
  const splitShiftCount = new Map<string, number>()

  const splitKey = (empId: number, week: number) => `${empId}-w${week}`

  for (const date of monthDates) {
    const dow = isoDay(date)
    const dateStr = toDateStr(date)
    const isoWeek = getISOWeek(date)
    const preferMorning = isoWeek % 2 !== 0 // odd week = prefer morning

    // --- Non-wildcard templates active today ---
    // GEN-07: sort templates so that the week-preferred type comes first.
    // This ensures employees assigned to the preferred template are excluded
    // from subsequent non-preferred templates on the same day (one shift per
    // employee per day).
    const todayTemplates = templates
      .filter(
        (t) =>
          t.dayOfWeek === dow &&
          !t.isWildcard &&
          isAreaAllowedToday(t.areaName, dow),
      )
      .sort((a, b) => {
        // Preferred templates come first
        const aPreferred = isMorningSlot(a.timeSlot) === preferMorning
        const bPreferred = isMorningSlot(b.timeSlot) === preferMorning
        if (aPreferred && !bPreferred) return -1
        if (!aPreferred && bPreferred) return 1
        return 0
      })

    // Track employees assigned today (for wildcard de-dup and one-shift-per-day rule)
    const assignedTodaySet = new Set<number>()

    // Employees on rest today are also "used" today
    for (const emp of employees) {
      if (employeeRestDays.get(emp.id)?.has(dateStr)) {
        assignedTodaySet.add(emp.id)
      }
    }

    for (const template of todayTemplates) {
      const isSplit = isSplitShift(template.timeSlot)

      // Eligible employees: in area, not absent, not on rest, not already assigned today
      // (one non-wildcard shift per employee per day — GEN-07 rotation enforcement)
      let eligible = employees.filter(
        (emp) =>
          !assignedTodaySet.has(emp.id) &&
          !absentOnDay.has(`${emp.id}-${dateStr}`) &&
          employeeAreas.get(emp.id)?.has(template.areaId) &&
          !employeeRestDays.get(emp.id)?.has(dateStr),
      )

      // Sort by fewest total assignments for equitable distribution (GEN-07 ordering
      // is handled by template sort above — preferred templates already first)
      eligible = eligible
        .slice()
        .sort(
          (a, b) =>
            (assignmentCount.get(a.id) ?? 0) -
            (assignmentCount.get(b.id) ?? 0),
        )

      // GEN-08: apply split shift limit
      if (isSplit) {
        eligible = eligible.filter((emp) => {
          const key = splitKey(emp.id, isoWeek)
          return (splitShiftCount.get(key) ?? 0) < 2
        })
      }

      // Assign up to requiredCount
      let assigned = 0
      for (const emp of eligible) {
        if (assigned >= template.requiredCount) break
        shifts.push({
          employeeId: emp.id,
          date: dateStr,
          timeSlot: template.timeSlot,
          areaId: template.areaId,
          isRest: false,
        })
        assignedTodaySet.add(emp.id)
        assignmentCount.set(emp.id, (assignmentCount.get(emp.id) ?? 0) + 1)
        if (isSplit) {
          const key = splitKey(emp.id, isoWeek)
          splitShiftCount.set(key, (splitShiftCount.get(key) ?? 0) + 1)
        }
        assigned++
      }

      // GEN-12: log warning if coverage is short
      if (assigned < template.requiredCount) {
        log.push({
          type: "warning",
          message: `Insufficient coverage: Area ${template.areaName} on ${dateStr} — needed ${template.requiredCount}, assigned ${assigned}`,
          date: dateStr,
        })
      }
    }

    // --- Add rest day records for employees resting today ---
    for (const emp of employees) {
      const restDays = employeeRestDays.get(emp.id)
      if (restDays?.has(dateStr)) {
        // Only add rest record if not absent (absence takes precedence)
        if (!absentOnDay.has(`${emp.id}-${dateStr}`)) {
          shifts.push({
            employeeId: emp.id,
            date: dateStr,
            timeSlot: null,
            areaId: null,
            isRest: true,
          })
        }
      }
    }

    // --- GEN-14: Wildcard templates ---
    const wildcardTemplates = templates.filter(
      (t) => t.isWildcard && t.dayOfWeek === dow,
    )

    for (const wt of wildcardTemplates) {
      const eligible = employees.filter(
        (emp) =>
          !assignedTodaySet.has(emp.id) &&
          !absentOnDay.has(`${emp.id}-${dateStr}`) &&
          employeeAreas.get(emp.id)?.has(wt.areaId),
      )
      if (eligible.length > 0) {
        // Pick employee with fewest assignments for fair distribution
        const emp = eligible.reduce((best, cur) =>
          (assignmentCount.get(cur.id) ?? 0) <
          (assignmentCount.get(best.id) ?? 0)
            ? cur
            : best,
        )
        shifts.push({
          employeeId: emp.id,
          date: dateStr,
          timeSlot: wt.timeSlot,
          areaId: wt.areaId,
          isRest: false,
        })
        assignedTodaySet.add(emp.id)
        assignmentCount.set(emp.id, (assignmentCount.get(emp.id) ?? 0) + 1)
      }
    }
  }

  return { shifts, log }
}
