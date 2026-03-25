/**
 * TDD RED phase: coverage and wildcard tests for the generation algorithm.
 * These tests define exactly what generateMonthShifts must do for GEN-12 and GEN-14.
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

// ===========================================================================
// COBERTURA (GEN-12)
// ===========================================================================

describe("Cobertura por requiredCount (GEN-12)", () => {
  it("when requiredCount=2, algorithm assigns 2 different employees to same template slot on a given day", () => {
    // Template for Monday (dayOfWeek=1) in area 10, needs 2 employees
    // Use January 2026 — first Monday is Jan 5
    const templates: ShiftTemplateFlat[] = [
      makeTemplate(10, 1, "7:00-14:00", 2), // requiredCount = 2
    ]
    const employees = [makeEmployee(1, [10]), makeEmployee(2, [10])]
    const input: GenerationInput = {
      month: 1,
      year: 2026,
      employees,
      templates,
      absences: [],
    }
    const result = generateMonthShifts(input)
    // Find Monday Jan 5 shifts in area 10
    const mondayShifts = result.shifts.filter(
      (s) => s.date === "2026-01-05" && s.areaId === 10 && !s.isRest,
    )
    const assignedEmployees = new Set(mondayShifts.map((s) => s.employeeId))
    expect(assignedEmployees.size).toBe(2)
  })

  it("when only 1 qualified employee is available for requiredCount=2 slot, logs a warning", () => {
    // Only 1 employee enabled for area 10, but requiredCount=2
    const templates: ShiftTemplateFlat[] = [
      makeTemplate(10, 1, "7:00-14:00", 2), // requiredCount = 2
    ]
    const employees = [makeEmployee(1, [10])] // only 1 employee
    const input: GenerationInput = {
      month: 1,
      year: 2026,
      employees,
      templates,
      absences: [],
    }
    const result = generateMonthShifts(input)
    const warnings = result.log.filter((entry) => entry.type === "warning")
    expect(warnings.length).toBeGreaterThan(0)
    // The warning should mention coverage shortage
    const coverageWarning = warnings.some(
      (w) =>
        w.message.toLowerCase().includes("cobertura") ||
        w.message.toLowerCase().includes("coverage") ||
        w.message.toLowerCase().includes("insuficiente") ||
        w.message.toLowerCase().includes("insufficient"),
    )
    expect(coverageWarning).toBe(true)
  })

  it("employees not in the area's enabled list are never assigned to that area", () => {
    // Employee 1 is enabled for area 10 only; Employee 2 for area 20 only
    const templates: ShiftTemplateFlat[] = [
      ...([1, 2, 3, 4, 5, 6, 7].map((dow) => makeTemplate(10, dow, "7:00-14:00"))),
      ...([1, 2, 3, 4, 5, 6, 7].map((dow) => makeTemplate(20, dow, "14:00-21:00"))),
    ]
    const employees = [
      makeEmployee(1, [10]), // only area 10
      makeEmployee(2, [20]), // only area 20
    ]
    const input: GenerationInput = {
      month: 1,
      year: 2026,
      employees,
      templates,
      absences: [],
    }
    const result = generateMonthShifts(input)
    // Employee 1 must never appear in area 20
    const emp1InArea20 = result.shifts.filter(
      (s) => s.employeeId === 1 && s.areaId === 20,
    )
    expect(emp1InArea20).toHaveLength(0)
    // Employee 2 must never appear in area 10
    const emp2InArea10 = result.shifts.filter(
      (s) => s.employeeId === 2 && s.areaId === 10,
    )
    expect(emp2InArea10).toHaveLength(0)
  })
})

// ===========================================================================
// COMODINES (GEN-14)
// ===========================================================================

describe("Turnos comodín (GEN-14)", () => {
  it("wildcard templates (isWildcard=true) are included in output when assigned", () => {
    // Mix: one regular template and one wildcard template for same day
    const templates: ShiftTemplateFlat[] = [
      makeTemplate(10, 1, "7:00-14:00", 1, false),  // regular
      makeTemplate(10, 1, "15:00-22:00", 1, true),   // wildcard
    ]
    // Two employees so the wildcard can be used when regular is taken
    const employees = [makeEmployee(1, [10]), makeEmployee(2, [10])]
    const input: GenerationInput = {
      month: 1,
      year: 2026,
      employees,
      templates,
      absences: [],
    }
    const result = generateMonthShifts(input)
    // At least one shift should use the wildcard timeSlot "15:00-22:00"
    const wildcardShifts = result.shifts.filter(
      (s) => s.timeSlot === "15:00-22:00" && !s.isRest,
    )
    expect(wildcardShifts.length).toBeGreaterThan(0)
  })
})
