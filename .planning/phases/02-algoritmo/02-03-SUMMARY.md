---
phase: 02-algoritmo
plan: "03"
subsystem: algorithm
tags: [generation, algorithm, typescript, pure-function, tdd-green]
dependency_graph:
  requires: [02-01, 02-02]
  provides: [02-04, 02-05]
  affects: [lib/actions/generation.ts]
tech_stack:
  added: [date-fns (getISOWeek, getDaysInMonth, format, addDays, parseISO)]
  patterns: [pure-function, stride-distribution, template-preference-sort, one-shift-per-day]
key_files:
  created:
    - lib/services/generation.ts
  modified: []
decisions:
  - "Stride-based rest day distribution: divides non-Sunday valid days into 3 segments, picks index=(employeeIndex % segSize) from each — prevents employees from clustering rest on same days"
  - "Template ordering for GEN-07: sort preferred template type first within todayTemplates so employees assigned to preferred template are excluded from non-preferred via assignedTodaySet"
  - "One non-wildcard shift per employee per day: assignedTodaySet shared across template loop — prevents double-booking on same day across multiple areas"
  - "isCritica uses date.getDate() >= 28 (local date, not UTC) since dates are constructed with new Date(year, month-1, day) using local arithmetic"
metrics:
  duration_minutes: 6
  completed_date: "2026-03-24"
  tasks_completed: 1
  files_created: 1
---

# Phase 02 Plan 03: Generation Algorithm Implementation Summary

**One-liner:** Pure TypeScript monthly shift generation algorithm with stride-based rest day distribution and week-parity template rotation, passing all 18 TDD tests.

## What Was Built

`lib/services/generation.ts` — a single exported function `generateMonthShifts(input: GenerationInput): GenerationResult` implementing all 11 GEN business rules (GEN-04 through GEN-14).

### Algorithm Structure

**Phase 1 — Data structures:**
- `absentOnDay: Set<"empId-YYYY-MM-DD">` — O(1) absence lookup expanded from date ranges
- `employeeAreas: Map<empId, Set<areaId>>` — O(1) area eligibility lookup
- `monthDates: Date[]` — all days in the target month

**Phase 2 — Rest day selection per employee:**
- Exactly 1 Sunday (from valid non-critical Sundays, offset by employee index)
- 3 ordinary days using stride distribution: pool divided into 3 segments, `employeeIndex % segmentSize` picks within each segment
- GEN-13 fallback: if segments too small, falls back to any remaining valid day with warning log
- Critical zone: `date.getDate() >= 28` excludes end-of-month days; Saturday excluded by `isoDay(d) !== 6`

**Phase 3 — Day-by-day shift assignment:**
- Templates sorted so week-preferred type (morning on odd ISO weeks, afternoon on even) comes first
- `assignedTodaySet` shared across all templates on a day — enforces one shift per employee per day
- Employees sorted by ascending assignment count for equitable distribution
- GEN-08: `splitShiftCount` map caps split shifts at 2 per employee per ISO week
- GEN-11: `isAreaAllowedToday()` guards Marking (Tue/Thu), Valery Camacho (Wed), Buffet (no Sun)
- GEN-12: warning logged when `assigned < template.requiredCount`
- GEN-14: wildcard templates processed last, assign to unassigned eligible employees only

## Test Results

All 18 tests pass (2 test files):
- `lib/services/__tests__/generation.rules.test.ts` — 14 tests (GEN-04, 05, 06, 07, 08, 11, 13)
- `lib/services/__tests__/generation.coverage.test.ts` — 4 tests (GEN-12, 14)

`npx tsc --noEmit` — zero TypeScript errors.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] GEN-07 rotation: employee double-booked across morning and afternoon templates on same day**
- **Found during:** Task 1 (first test run — 4 tests failing)
- **Issue:** Algorithm processed all templates for a day independently; an employee with access to both morning (area 10) and afternoon (area 11) templates was assigned to both on the same day, causing all-odd-week shifts to include afternoon shifts
- **Fix:** Added `!assignedTodaySet.has(emp.id)` to eligible employee filter for non-wildcard templates; sorted `todayTemplates` with preferred type first so the first assignment wins
- **Files modified:** `lib/services/generation.ts`
- **Commit:** 2ee5e8f

**2. [Rule 1 - Bug] GEN-12 requiredCount=2: only 1 employee assigned when 2 required**
- **Found during:** Task 1 (first test run)
- **Issue:** Initial week-based rest day selection picked the first day of the first available week for each employee. Employee index 0 picked Jan 5 (first day of ISO week 2) as a rest day — which was the only template day (Monday) — leaving only 1 eligible employee on Jan 5
- **Fix:** Replaced week-based distribution with stride-based segmentation: the non-Sunday valid day pool is divided into 3 equal segments; each employee picks at `employeeIndex % segmentSize` within each segment, distributing picks across the month without clustering on Mondays
- **Files modified:** `lib/services/generation.ts`
- **Commit:** 2ee5e8f (same commit — both bugs found and fixed before committing)

## Self-Check: PASSED

- `lib/services/generation.ts` — FOUND (420 lines)
- Commit 2ee5e8f — FOUND
- All 18 vitest tests — PASSED
- `npx tsc --noEmit` — CLEAN
