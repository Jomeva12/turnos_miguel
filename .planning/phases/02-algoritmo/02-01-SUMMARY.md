---
phase: 02-algoritmo
plan: "01"
subsystem: database
tags: [prisma, typescript, types, db-layer, generation-algorithm]

requires:
  - phase: 01-fundaci-n
    provides: Prisma schema with Employee, Area, ShiftTemplate, Shift, Absence, GenerationLog models

provides:
  - types/generation.ts with 7 TypeScript interfaces (pure contract, no runtime code)
  - lib/db/employees.ts — getEmployeesWithAreas()
  - lib/db/templates.ts — getShiftTemplates()
  - lib/db/shifts.ts — getShiftsForMonth(), saveGeneratedShifts(), clearShiftsForMonth()
  - lib/db/absences.ts — getAbsencesForMonth()
  - lib/db/generationLog.ts — saveGenerationLog(), getGenerationLog()

affects: [02-02-PLAN, 02-03-PLAN, 02-04-PLAN, 03-planilla-principal, 04-ausencias-y-cobertura]

tech-stack:
  added: []
  patterns:
    - "Pure type contracts in types/generation.ts — no Prisma types leak out of the DB layer"
    - "UTC-safe date boundaries via Date.UTC() for Prisma @db.Date fields"
    - "saveGeneratedShifts: pre-fetch manual shifts to skip-on-conflict without complex Prisma logic"
    - "saveGenerationLog: delete+create upsert pattern (no composite unique in GenerationLog)"
    - "Prisma Json field: cast LogEntry[] as unknown as Prisma.InputJsonValue"

key-files:
  created:
    - types/generation.ts
    - lib/db/employees.ts
    - lib/db/templates.ts
    - lib/db/shifts.ts
    - lib/db/absences.ts
    - lib/db/generationLog.ts
  modified: []

key-decisions:
  - "Pure types in types/generation.ts: no imports from Prisma — algorithm is zero-framework"
  - "UTC boundaries: Date.UTC(year, month-1, 1) / Date.UTC(year, month, 0) throughout all db queries"
  - "saveGeneratedShifts skip-if-manual: pre-fetch manual shifts first, filter before upsert batch"
  - "GenerationLog upsert: delete+create because no @unique([month, year]) constraint in schema"
  - "Prisma Json cast: LogEntry[] as unknown as Prisma.InputJsonValue (required for typed arrays)"

patterns-established:
  - "DB layer pattern: lib/db/<entity>.ts exports named async functions, imports prisma from @/lib/db"
  - "Type isolation: algorithm types in types/generation.ts, Prisma types never exported to callers"

requirements-completed: [GEN-01, GEN-02, GEN-03, GEN-09, GEN-10, GEN-12, LOG-01]

duration: 4min
completed: 2026-03-24
---

# Phase 02 Plan 01: Type Contracts and DB Query Layer Summary

**7 TypeScript generation interfaces plus 8 Prisma query functions across 5 lib/db files, giving Plan 02-03 a typed, Prisma-free contract to code against**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-24T17:37:41Z
- **Completed:** 2026-03-24T17:41:10Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- `types/generation.ts` defines all 7 interfaces (AbsenceRecord, EmployeeWithAreas, ShiftTemplateFlat, GenerationInput, GeneratedShift, LogEntry, GenerationResult) with no Prisma imports
- 5 `lib/db/` files implement every query function the generation algorithm will call, using UTC-safe date boundaries and a skip-if-manual upsert strategy
- All 24 existing tests continue to pass; `npx tsc --noEmit` reports zero errors in new files

## Task Commits

1. **Task 1: Type contracts for generation algorithm** - `3ee411d` (feat)
2. **Task 2: DB query layer — employees, templates, shifts, absences, generation log** - `69998f7` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `types/generation.ts` — 7 pure TypeScript interfaces; zero runtime code; dates as ISO strings
- `lib/db/employees.ts` — getEmployeesWithAreas(): employees with >=1 area, sorted by name
- `lib/db/templates.ts` — getShiftTemplates(): all templates, areaName flattened
- `lib/db/shifts.ts` — getShiftsForMonth(), saveGeneratedShifts() (skip-manual), clearShiftsForMonth()
- `lib/db/absences.ts` — getAbsencesForMonth(): overlap query, dates as ISO strings
- `lib/db/generationLog.ts` — saveGenerationLog() (delete+create), getGenerationLog()

## Decisions Made

- `types/generation.ts` has no Prisma imports: algorithm is pure and testable without DB setup
- UTC boundaries (`Date.UTC`) prevent off-by-one errors when Prisma stores `@db.Date` as UTC midnight
- `saveGeneratedShifts` pre-fetches manual shifts before upserting to skip them cleanly
- `GenerationLog` uses delete+create upsert because schema has no `@@unique([month, year])`
- `Prisma.InputJsonValue` cast needed for strongly-typed `LogEntry[]` in Json column

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Prisma Json type cast for LogEntry[]**
- **Found during:** Task 2 (generationLog.ts)
- **Issue:** `LogEntry[]` is not assignable to Prisma's `InputJsonValue` — TS error TS2322
- **Fix:** Added `import { Prisma } from "@prisma/client"` and cast `log as unknown as Prisma.InputJsonValue`
- **Files modified:** lib/db/generationLog.ts
- **Verification:** `npx tsc --noEmit` passes clean
- **Committed in:** 69998f7 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - TS type error)
**Impact on plan:** Minimal — standard Prisma Json handling pattern. No scope creep.

## Issues Encountered

Pre-existing `lib/services/__tests__/generation.rules.test.ts` and `generation.coverage.test.ts` reference `../generation` which does not exist yet (created in Plan 02-03). These files are untracked and their TS errors are pre-existing — out of scope. The 24 tests that were passing before this plan continue to pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All type contracts ready for Plan 02-02 (business rules analysis) and Plan 02-03 (algorithm implementation)
- DB layer is fully typed and testable — Plan 02-03 author can write pure unit tests against the type interfaces without DB
- `lib/services/__tests__/generation.rules.test.ts` and `generation.coverage.test.ts` are waiting for Plan 02-03 to create `lib/services/generation.ts`

---
*Phase: 02-algoritmo*
*Completed: 2026-03-24*
