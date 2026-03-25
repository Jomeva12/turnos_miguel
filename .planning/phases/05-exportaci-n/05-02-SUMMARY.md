---
phase: 05-exportaci-n
plan: "02"
subsystem: api
tags: [server-actions, prisma, cleanup, planilla, next.js]

# Dependency graph
requires:
  - phase: 03-planilla-principal
    provides: PlanillaToolbar with Limpiar Turnos/Novedades buttons (previously stubbed)
  - phase: 01-fundaci-n
    provides: Prisma schema with Shift and Absence models

provides:
  - app/actions/cleanup.ts with deleteShiftsByMonth and deleteAbsencesByMonth Server Actions
  - PlanillaToolbar buttons wired to month-scoped cleanup Server Actions with loading state

affects: [planilla, exportacion]

# Tech tracking
tech-stack:
  added: []
  patterns: [month-scoped deleteMany via local-time Date constructor to avoid UTC day-shift in Bogota TZ]

key-files:
  created:
    - app/actions/cleanup.ts
  modified:
    - components/planilla/PlanillaToolbar.tsx

key-decisions:
  - "cleanup.ts uses local-time Date constructor new Date(year, month-1, day) instead of Date.UTC to avoid off-by-one day in America/Bogota timezone"
  - "PlanillaToolbar import swapped from clearShifts/clearAbsences to deleteShiftsByMonth/deleteAbsencesByMonth — same UX behavior, canonical cleanup module now in app/actions/cleanup.ts"

patterns-established:
  - "Month-range deletion pattern: getMonthRange helper validates params + computes firstDay/lastDay in local time"

requirements-completed: [EXP-01]

# Metrics
duration: 2min
completed: 2026-03-25
---

# Phase 05 Plan 02: Cleanup Server Actions Summary

**Month-scoped deleteShiftsByMonth and deleteAbsencesByMonth Server Actions in app/actions/cleanup.ts, wired to Limpiar Turnos/Novedades buttons in PlanillaToolbar with useTransition loading state**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-25T02:13:20Z
- **Completed:** 2026-03-25T02:15:15Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `app/actions/cleanup.ts` with two Server Actions: `deleteShiftsByMonth` and `deleteAbsencesByMonth`, both validating year/month params and returning `{ deleted: number }`
- Updated `PlanillaToolbar` to import from the new cleanup module instead of the legacy `clearShifts`/`clearAbsences` from `lib/actions/shifts.ts`
- Both Limpiar Turnos and Limpiar Novedades buttons show "Limpiando..." loading state (disabled + text change) via shared `useTransition` while action is pending

## Task Commits

Each task was committed atomically:

1. **Task 1: Cleanup Server Actions** - `22cdb05` (feat)
2. **Task 2: Wire cleanup buttons in planilla** - `7a3fd1c` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `app/actions/cleanup.ts` - Server Actions deleteShiftsByMonth/deleteAbsencesByMonth with param validation and revalidatePath
- `components/planilla/PlanillaToolbar.tsx` - Limpiar Turnos/Novedades buttons now call cleanup actions, show loading state

## Decisions Made
- Used `new Date(year, month - 1, 1)` (local-time constructor) instead of `Date.UTC()` — avoids off-by-one day issue in TZ=America/Bogota where UTC midnight could shift to the previous day.
- `lib/db.ts` exports `prisma` as a named export (not default); plan template showed `import db from "@/lib/db"` but actual file uses `import { prisma } from "@/lib/db"` — used the correct named import.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected Prisma db import to match actual export**
- **Found during:** Task 1 (Cleanup Server Actions)
- **Issue:** Plan template specified `import db from "@/lib/db"` (default import) but `lib/db.ts` only exports `prisma` as a named export
- **Fix:** Used `import { prisma } from "@/lib/db"` — consistent with all other server actions in the codebase
- **Files modified:** app/actions/cleanup.ts
- **Verification:** TypeScript compiles without errors
- **Committed in:** 22cdb05 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — import mismatch)
**Impact on plan:** Minor corrective fix. No scope creep.

## Issues Encountered
None beyond the import fix above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Cleanup Server Actions are ready. Limpiar Turnos and Limpiar Novedades buttons are fully functional with loading state.
- Phase 05 plan 02 complete. Phase 05 is fully complete (both 05-01 and 05-02 done).

---
*Phase: 05-exportaci-n*
*Completed: 2026-03-25*
