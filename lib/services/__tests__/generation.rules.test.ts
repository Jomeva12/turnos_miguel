/**
 * TDD RED phase: business rules tests for the generation algorithm.
 * These tests define exactly what generateMonthShifts must do.
 * All tests are expected to FAIL until lib/services/generation.ts is implemented (Plan 02-03).
 *
 * NO Prisma imports — all input is synthetic in-memory data.
 */

import { describe, it, expect } from "vitest"
import { generateMonthShifts } from "../generation"
import type {
  EmployeeWithAreas,
  ShiftTemplateFlat,
  GenerationInput,
  GeneratedShift,
} from "@/types/generation"

// ---------------------------------------------------------------------------
// Test data factories (no DB)
// ---------------------------------------------------------------------------

function makeEmployee(id: number, areaIds: number[]): EmployeeWithAreas {
  return {
    id,
    name: `Employee ${id}`,
    areas: areaIds.map((areaId) => ({ areaId, areaName: `Area ${areaId}` })),
  }
}

function makeTemplate(
  areaId: number,
  dayOfWeek: number,
  timeSlot: string,
  requiredCount = 1,
  isWildcard = false,
): ShiftTemplateFlat {
  return {
    id: areaId * 10 + dayOfWeek,
    areaId,
    areaName: `Area ${areaId}`,
    dayOfWeek,
    timeSlot,
    requiredCount,
    isWildcard,
  }
}

/**
 * Build all-days templates for a given area (Mon-Sun).
 */
function makeAllDaysTemplates(areaId: number, timeSlot: string): ShiftTemplateFlat[] {
  return [1, 2, 3, 4, 5, 6, 7].map((dow) =>
    makeTemplate(areaId, dow, timeSlot),
  )
}

/**
 * Get rest-day dates for a given employee from a result.
 */
function getRestDates(shifts: GeneratedShift[], employeeId: number): string[] {
  return shifts
    .filter((s) => s.employeeId === employeeId && s.isRest)
    .map((s) => s.date)
}

/**
 * Return the ISO day-of-week (1=Mon … 7=Sun) for an ISO date string "YYYY-MM-DD".
 */
function getDayOfWeek(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number)
  const d = new Date(year, month - 1, day)
  const js = d.getDay() // 0=Sun, 1=Mon, …, 6=Sat
  return js === 0 ? 7 : js
}

/**
 * ISO week number (Mon-based) for a date string.
 */
function getISOWeek(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

// ---------------------------------------------------------------------------
// Base input helpers
// ---------------------------------------------------------------------------

function buildBaseInput(overrides?: Partial<GenerationInput>): GenerationInput {
  // January 2026 — 31 days, starts on Thursday
  return {
    month: 1,
    year: 2026,
    employees: [makeEmployee(1, [10])],
    templates: makeAllDaysTemplates(10, "7:00-14:00"),
    absences: [],
    ...overrides,
  }
}

// ===========================================================================
// DESCANSO RULES (GEN-04, GEN-05, GEN-06, GEN-13)
// ===========================================================================

describe("Descanso rules", () => {
  it("GEN-04: employee receives exactly 4 rest days per month", () => {
    const input = buildBaseInput()
    const result = generateMonthShifts(input)
    const restDates = getRestDates(result.shifts, 1)
    expect(restDates).toHaveLength(4)
  })

  it("GEN-04: exactly 1 of the 4 rest days falls on a Sunday", () => {
    const input = buildBaseInput()
    const result = generateMonthShifts(input)
    const restDates = getRestDates(result.shifts, 1)
    const sundayRests = restDates.filter((d) => getDayOfWeek(d) === 7)
    expect(sundayRests).toHaveLength(1)
  })

  it("GEN-05: no rest day assigned on a Saturday (dayOfWeek=6)", () => {
    const input = buildBaseInput()
    const result = generateMonthShifts(input)
    const restDates = getRestDates(result.shifts, 1)
    const saturdayRests = restDates.filter((d) => getDayOfWeek(d) === 6)
    expect(saturdayRests).toHaveLength(0)
  })

  it("GEN-06: no rest day assigned on days 28, 29, 30, 31 of the month", () => {
    const input = buildBaseInput()
    const result = generateMonthShifts(input)
    const restDates = getRestDates(result.shifts, 1)
    const criticalEndDays = restDates.filter((d) => {
      const day = parseInt(d.split("-")[2], 10)
      return day >= 28
    })
    expect(criticalEndDays).toHaveLength(0)
  })

  it("GEN-06: no rest day assigned on days 1 or 2 of the NEXT month", () => {
    // Use December 2025 — days 1-2 of January 2026 must be excluded from rest
    const input: GenerationInput = {
      month: 12,
      year: 2025,
      employees: [makeEmployee(1, [10])],
      templates: makeAllDaysTemplates(10, "7:00-14:00"),
      absences: [],
    }
    const result = generateMonthShifts(input)
    const restDates = getRestDates(result.shifts, 1)
    // Zona crítica: days 28-31 of Dec 2025 AND days 1-2 of Jan 2026
    const criticalRests = restDates.filter((d) => {
      if (d.startsWith("2026-01-")) {
        const day = parseInt(d.split("-")[2], 10)
        return day <= 2
      }
      if (d.startsWith("2025-12-")) {
        const day = parseInt(d.split("-")[2], 10)
        return day >= 28
      }
      return false
    })
    expect(criticalRests).toHaveLength(0)
  })

  it("GEN-13: does not crash when few valid days remain — forces rest on next available valid day", () => {
    // February 2026 — only 28 days; 4 valid non-Sat, non-critical Sundays + ordinary slots
    const input: GenerationInput = {
      month: 2,
      year: 2026,
      employees: [makeEmployee(1, [10])],
      templates: makeAllDaysTemplates(10, "7:00-14:00"),
      absences: [],
    }
    // Should not throw
    expect(() => generateMonthShifts(input)).not.toThrow()
    const result = generateMonthShifts(input)
    const restDates = getRestDates(result.shifts, 1)
    // Still expect 4 rest days assigned (forced if necessary)
    expect(restDates).toHaveLength(4)
  })
})

// ===========================================================================
// ROTACIÓN RULES (GEN-07)
// ===========================================================================

describe("Rotación rules (GEN-07)", () => {
  it("employees on odd ISO weeks receive morning-type templates (7:00 start)", () => {
    // Build templates: morning (7:00) and afternoon (14:00) for same area
    const morningTemplates: ShiftTemplateFlat[] = [1, 2, 3, 4, 5, 6, 7].map((dow) =>
      makeTemplate(10, dow, "7:00-14:00"),
    )
    const afternoonTemplates: ShiftTemplateFlat[] = [1, 2, 3, 4, 5, 6, 7].map((dow) =>
      makeTemplate(11, dow, "14:00-21:00"),
    )
    const input: GenerationInput = {
      month: 1,
      year: 2026,
      employees: [makeEmployee(1, [10, 11])],
      templates: [...morningTemplates, ...afternoonTemplates],
      absences: [],
    }
    const result = generateMonthShifts(input)
    const nonRestShifts = result.shifts.filter(
      (s) => s.employeeId === 1 && !s.isRest,
    )
    // For all work days in odd ISO weeks, the timeSlot should start with "7:00"
    const oddWeekShifts = nonRestShifts.filter((s) => getISOWeek(s.date) % 2 !== 0)
    expect(oddWeekShifts.length).toBeGreaterThan(0)
    for (const shift of oddWeekShifts) {
      expect(shift.timeSlot).toMatch(/^7:00/)
    }
  })

  it("employees on even ISO weeks receive afternoon-type templates (14:00+ start)", () => {
    const morningTemplates: ShiftTemplateFlat[] = [1, 2, 3, 4, 5, 6, 7].map((dow) =>
      makeTemplate(10, dow, "7:00-14:00"),
    )
    const afternoonTemplates: ShiftTemplateFlat[] = [1, 2, 3, 4, 5, 6, 7].map((dow) =>
      makeTemplate(11, dow, "14:00-21:00"),
    )
    const input: GenerationInput = {
      month: 1,
      year: 2026,
      employees: [makeEmployee(1, [10, 11])],
      templates: [...morningTemplates, ...afternoonTemplates],
      absences: [],
    }
    const result = generateMonthShifts(input)
    const nonRestShifts = result.shifts.filter(
      (s) => s.employeeId === 1 && !s.isRest,
    )
    const evenWeekShifts = nonRestShifts.filter((s) => getISOWeek(s.date) % 2 === 0)
    expect(evenWeekShifts.length).toBeGreaterThan(0)
    for (const shift of evenWeekShifts) {
      expect(shift.timeSlot).toMatch(/^14:00/)
    }
  })

  it("rotation alternates between weeks within the same month (not static for whole month)", () => {
    const morningTemplates: ShiftTemplateFlat[] = [1, 2, 3, 4, 5, 6, 7].map((dow) =>
      makeTemplate(10, dow, "7:00-14:00"),
    )
    const afternoonTemplates: ShiftTemplateFlat[] = [1, 2, 3, 4, 5, 6, 7].map((dow) =>
      makeTemplate(11, dow, "14:00-21:00"),
    )
    const input: GenerationInput = {
      month: 1,
      year: 2026,
      employees: [makeEmployee(1, [10, 11])],
      templates: [...morningTemplates, ...afternoonTemplates],
      absences: [],
    }
    const result = generateMonthShifts(input)
    const nonRestShifts = result.shifts.filter(
      (s) => s.employeeId === 1 && !s.isRest,
    )
    // Collect unique timeSlot starts per ISO week
    const weekPatterns = new Map<number, Set<string>>()
    for (const shift of nonRestShifts) {
      const week = getISOWeek(shift.date)
      const start = (shift.timeSlot ?? "").split("-")[0]
      if (!weekPatterns.has(week)) weekPatterns.set(week, new Set())
      weekPatterns.get(week)!.add(start)
    }
    // January 2026 spans at least 2 ISO weeks — should have different shift types
    const weekNumbers = Array.from(weekPatterns.keys())
    expect(weekNumbers.length).toBeGreaterThanOrEqual(2)
    const allSamePattern = weekNumbers.every(
      (w) =>
        JSON.stringify(Array.from(weekPatterns.get(w)!).sort()) ===
        JSON.stringify(Array.from(weekPatterns.get(weekNumbers[0])!).sort()),
    )
    expect(allSamePattern).toBe(false)
  })
})

// ===========================================================================
// TURNOS PARTIDOS (GEN-08)
// ===========================================================================

describe("Turnos partidos (GEN-08)", () => {
  it("no employee receives more than 2 split shifts per calendar week", () => {
    // All templates are split shifts
    const splitTemplates: ShiftTemplateFlat[] = [1, 2, 3, 4, 5, 6, 7].map((dow) =>
      makeTemplate(10, dow, "7:00-11:00|11:30-14:30"),
    )
    const input: GenerationInput = {
      month: 1,
      year: 2026,
      employees: [makeEmployee(1, [10])],
      templates: splitTemplates,
      absences: [],
    }
    const result = generateMonthShifts(input)
    const nonRestShifts = result.shifts.filter(
      (s) => s.employeeId === 1 && !s.isRest,
    )
    // Group by ISO week
    const weekSplits = new Map<number, number>()
    for (const shift of nonRestShifts) {
      if (shift.timeSlot?.includes("|")) {
        const week = getISOWeek(shift.date)
        weekSplits.set(week, (weekSplits.get(week) ?? 0) + 1)
      }
    }
    for (const [, count] of weekSplits) {
      expect(count).toBeLessThanOrEqual(2)
    }
  })

  it("split shifts are assigned when available and weekly limit not reached", () => {
    const splitTemplates: ShiftTemplateFlat[] = [1, 2, 3, 4, 5, 6, 7].map((dow) =>
      makeTemplate(10, dow, "7:00-11:00|11:30-14:30"),
    )
    const input: GenerationInput = {
      month: 1,
      year: 2026,
      employees: [makeEmployee(1, [10])],
      templates: splitTemplates,
      absences: [],
    }
    const result = generateMonthShifts(input)
    const splitShifts = result.shifts.filter(
      (s) => s.employeeId === 1 && !s.isRest && s.timeSlot?.includes("|"),
    )
    expect(splitShifts.length).toBeGreaterThan(0)
  })
})

// ===========================================================================
// ÁREAS ESPECIALES (GEN-11)
// ===========================================================================

describe("Áreas especiales (GEN-11)", () => {
  it("Marking area only appears on Tuesdays (2) and Thursdays (4)", () => {
    // Employee enabled for Marking area (named "Marking" — areaName matters here)
    const markingTemplates: ShiftTemplateFlat[] = [1, 2, 3, 4, 5, 6, 7].map((dow) => ({
      id: 200 + dow,
      areaId: 20,
      areaName: "Marking",
      dayOfWeek: dow,
      timeSlot: "7:00-14:00",
      requiredCount: 1,
      isWildcard: false,
    }))
    const input: GenerationInput = {
      month: 1,
      year: 2026,
      employees: [makeEmployee(1, [20])],
      templates: markingTemplates,
      absences: [],
    }
    const result = generateMonthShifts(input)
    const markingShifts = result.shifts.filter(
      (s) => s.areaId === 20 && !s.isRest,
    )
    for (const shift of markingShifts) {
      const dow = getDayOfWeek(shift.date)
      expect([2, 4]).toContain(dow)
    }
  })

  it("Valery Camacho area only appears on Wednesdays (3)", () => {
    const valeryTemplates: ShiftTemplateFlat[] = [1, 2, 3, 4, 5, 6, 7].map((dow) => ({
      id: 300 + dow,
      areaId: 30,
      areaName: "Valery Camacho",
      dayOfWeek: dow,
      timeSlot: "7:00-14:00",
      requiredCount: 1,
      isWildcard: false,
    }))
    const input: GenerationInput = {
      month: 1,
      year: 2026,
      employees: [makeEmployee(1, [30])],
      templates: valeryTemplates,
      absences: [],
    }
    const result = generateMonthShifts(input)
    const valeryShifts = result.shifts.filter(
      (s) => s.areaId === 30 && !s.isRest,
    )
    for (const shift of valeryShifts) {
      const dow = getDayOfWeek(shift.date)
      expect(dow).toBe(3)
    }
  })

  it("Buffet area has no shifts on Sundays (dayOfWeek=7)", () => {
    const buffetTemplates: ShiftTemplateFlat[] = [1, 2, 3, 4, 5, 6, 7].map((dow) => ({
      id: 400 + dow,
      areaId: 40,
      areaName: "Buffet",
      dayOfWeek: dow,
      timeSlot: "7:00-14:00",
      requiredCount: 1,
      isWildcard: false,
    }))
    const input: GenerationInput = {
      month: 1,
      year: 2026,
      employees: [makeEmployee(1, [40])],
      templates: buffetTemplates,
      absences: [],
    }
    const result = generateMonthShifts(input)
    const buffetSundayShifts = result.shifts.filter(
      (s) => s.areaId === 40 && !s.isRest && getDayOfWeek(s.date) === 7,
    )
    expect(buffetSundayShifts).toHaveLength(0)
  })
})
