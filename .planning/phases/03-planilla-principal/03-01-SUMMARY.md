---
phase: 03-planilla-principal
plan: 01
subsystem: database
tags: [prisma, typescript, planilla, types, queries]

# Dependency graph
requires:
  - phase: 02-algoritmo
    provides: "generation types (EmployeeWithAreas, ShiftTemplateFlat, AbsenceRecord) and db query layer"
provides:
  - "types/planilla.ts — TypeScript contracts for planilla UI layer (EmployeeRow, ShiftData, AbsenceData, TemplateOption, PlanillaData, DayHeader, MonthYear)"
  - "lib/db/employees.ts — getEmployeesWithAreas() returning EmployeeRow[]"
  - "lib/db/shifts.ts — getShiftsForMonth() returning ShiftData[] with area colors, getAbsencesForMonth() returning AbsenceData[]"
  - "lib/db/templates.ts — getShiftTemplates() returning TemplateOption[]"
affects:
  - 03-planilla-principal (plans 02-05 consume these types and queries directly)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Planilla UI types are ISO-date-string based (no Date objects) to avoid server→client serialization issues"
    - "Flat arrays (areaIds[], areaNames[]) in EmployeeRow vs nested objects in generation EmployeeWithAreas — parallel structures for different layers"
    - "AREA_COLORS lookup resolves hex colors at query time (areaColor field in ShiftData)"

key-files:
  created:
    - types/planilla.ts
  modified:
    - lib/db/employees.ts
    - lib/db/templates.ts
    - lib/db/shifts.ts
    - lib/actions/generation.ts
    - lib/services/__tests__/generation.integration.test.ts

key-decisions:
  - "EmployeeRow uses flat areaIds/areaNames arrays instead of nested objects — simpler for planilla UI, generation layer maps to EmployeeWithAreas inline"
  - "getShiftsForMonth and getAbsencesForMonth added to shifts.ts (not a separate planilla-shifts.ts) — keeps all shift-related queries in one file"
  - "TemplateOption is structurally identical to ShiftTemplateFlat — TypeScript structural typing accepts it transparently in generation algorithm"
  - "generation.ts maps EmployeeRow→EmployeeWithAreas inline using areaIds/areaNames — 3-line transform, no new abstraction needed"

patterns-established:
  - "Planilla types live in types/planilla.ts — all planilla components import from @/types/planilla"
  - "DB query functions in lib/db/*.ts use planilla types as return types, generation layer adapts from them"

requirements-completed: [PLAN-01, PLAN-06, PLAN-07, PLAN-08]

# Metrics
duration: 4min
completed: 2026-03-25
---

# Phase 3 Plan 01: Planilla Principal — Types & Queries Summary

**TypeScript contracts and Prisma queries for the planilla UI: 7 interfaces in types/planilla.ts plus 4 typed query functions covering shifts, absences, employees, and templates**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-25T01:06:11Z
- **Completed:** 2026-03-25T01:09:56Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Defined 7 TypeScript interfaces in types/planilla.ts: MonthYear, DayHeader, ShiftData, AbsenceData, EmployeeRow, TemplateOption, PlanillaData
- Updated 3 lib/db/ query files to return planilla types with full type safety
- Added getAbsencesForMonth (returning AbsenceData[]) to lib/db/shifts.ts
- getShiftsForMonth now resolves areaColor from AREA_COLORS at query time
- All 51 vitest tests continue to pass after type migration

## Task Commits

Each task was committed atomically:

1. **Task 1: Definir tipos TypeScript centrales para planilla** - `9fa8e5a` (feat)
2. **Task 2: Crear capa de queries Prisma para planilla** - `1b7c763` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `types/planilla.ts` — 7 interfaces for planilla UI layer, no runtime code
- `lib/db/employees.ts` — Updated: getEmployeesWithAreas() returns EmployeeRow[] (flat areaIds/areaNames)
- `lib/db/shifts.ts` — Updated: getShiftsForMonth() returns ShiftData[] with areaColor; added getAbsencesForMonth() returning AbsenceData[]
- `lib/db/templates.ts` — Updated: getShiftTemplates() returns TemplateOption[]
- `lib/actions/generation.ts` — Updated: maps EmployeeRow[]→EmployeeWithAreas[] before passing to algorithm
- `lib/services/__tests__/generation.integration.test.ts` — Updated: uses emp.areaIds instead of emp.areas.map

## Decisions Made
- `EmployeeRow` uses flat `areaIds[]`/`areaNames[]` arrays (simpler for UI iteration) rather than nested `{areaId, areaName}[]` objects. Generation layer bridges the gap with a 3-line inline map in generation.ts.
- `getAbsencesForMonth` added to `lib/db/shifts.ts` (not a new file) since shift/absence queries are closely related and consumed together by planilla.
- `TemplateOption` and `ShiftTemplateFlat` are structurally identical — TypeScript's structural typing means no adapter needed in the generation algorithm.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated generation.ts and integration test to adapt to EmployeeRow type**
- **Found during:** Task 2 (Crear capa de queries)
- **Issue:** Changing getEmployeesWithAreas() return type from EmployeeWithAreas[] to EmployeeRow[] broke generation.ts (algorithm expects .areas[] nested objects) and integration test (used emp.areas.map)
- **Fix:** Added inline mapping in generation.ts (3 locations) to convert EmployeeRow→EmployeeWithAreas; updated integration test to use emp.areaIds
- **Files modified:** lib/actions/generation.ts, lib/services/__tests__/generation.integration.test.ts
- **Verification:** npx tsc --noEmit passes; 51/51 vitest tests pass
- **Committed in:** 1b7c763 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — cascading type change)
**Impact on plan:** Required to maintain the existing generation pipeline while introducing planilla types. No scope creep.

## Issues Encountered
None beyond the type migration deviation documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- types/planilla.ts is ready — plans 03-02 through 03-05 can import all planilla interfaces
- lib/db/ query functions are ready — page.tsx (plan 03-02) can call getShiftsForMonth, getAbsencesForMonth, getEmployeesWithAreas, getShiftTemplates
- No blockers for subsequent planilla plans

---
*Phase: 03-planilla-principal*
*Completed: 2026-03-25*
