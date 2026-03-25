---
phase: 03-planilla-principal
plan: 04
subsystem: ui
tags: [react, nextjs, typescript, planilla, date-fns, server-actions, tailwind, sticky-table, slide-over]

# Dependency graph
requires:
  - phase: 03-planilla-principal-plan-01
    provides: "types/planilla.ts (PlanillaData, ShiftData, AbsenceData, TemplateOption) and lib/db/ query functions"
  - phase: 03-planilla-principal-plan-02
    provides: "lib/actions/shifts.ts (generateMonth, clearShifts), components/planilla/ShiftCell, MonthNavigator, reusable grid patterns"
provides:
  - "lib/actions/shifts.ts#assignShift — Server Action covering 3 cases: novedad (single-day absence), descanso (null timeSlot shift), turno con plantilla"
  - "app/(protected)/asignacion-manual/page.tsx — async RSC shell loading data in parallel, rendering AsignacionGrid"
  - "components/planilla/AsignacionGrid.tsx — editable table with sticky corner+headers+employee column, click-to-open modal"
  - "components/planilla/AsignacionModal.tsx — slide-over panel with novedad buttons and template buttons grouped by area"
affects:
  - 03-planilla-principal (plan 05 export may reference assignShift)
  - 04-ausencias-y-cobertura (may add absence modal via same slide-over pattern)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Sticky table with 3 z-index layers: corner (z-30), thead row (z-20), employee td (z-10) — all use var(--card) background to prevent bleed-through"
    - "Slide-over via fixed inset-0 overlay + fixed right-0 panel — no dialog/radix-ui dependency, pure CSS positioning"
    - "startTransition for Server Action calls — prevents UI blocking while assignShift is in-flight"
    - "dayOfWeek remapping: JS Date.getDay() (0=Sun) → DB encoding (1=Mon..7=Sun) via jsGetDayToDbDayOfWeek helper"
    - "MonthNavigator routePath prop (default /planilla) allows reuse across multiple schedule views"

key-files:
  created:
    - components/planilla/AsignacionGrid.tsx
    - components/planilla/AsignacionModal.tsx
  modified:
    - lib/actions/shifts.ts
    - app/(protected)/asignacion-manual/page.tsx
    - components/planilla/MonthNavigator.tsx

key-decisions:
  - "assignShift uses Date + 'T00:00:00Z' suffix for UTC-safe @db.Date Prisma fields — consistent with rest of codebase"
  - "MonthNavigator gets routePath prop (default /planilla) — backward-compatible, no change needed in PlanillaGrid"
  - "AsignacionModal filters templates to current day-of-week before grouping by area — avoids showing irrelevant templates"
  - "localShifts state in AsignacionGrid initialized from server props — optimistic display while RSC revalidation completes"

patterns-established:
  - "Slide-over modal pattern: fixed overlay (z-40) + fixed panel (z-50), click overlay to close"
  - "useTransition wraps Server Actions in Client Components — pending state disables buttons during in-flight mutation"

requirements-completed: [MAN-01, MAN-02, MAN-03, MAN-04, MAN-05, MAN-06, MAN-07]

# Metrics
duration: 8min
completed: 2026-03-24
---

# Phase 3 Plan 04: Asignacion Manual — Sticky Grid + Slide-Over Modal Summary

**Editable monthly schedule grid with sticky 3-layer headers, slide-over template/novedad selector, and AJAX cell assignment via assignShift Server Action — /asignacion-manual route fully operational**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-24T~T00:00Z
- **Completed:** 2026-03-24
- **Tasks:** 2
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments
- Added `assignShift` Server Action with 3 cases: novedad (creates single-day Absence + deletes Shift), descanso (upserts Shift with null timeSlot), turno con plantilla (upserts Shift from ShiftTemplate data)
- Built AsignacionGrid as a faithful parallel to PlanillaGrid but fully editable — same sticky table architecture, same ShiftCell rendering, click on any cell opens modal
- Built AsignacionModal as a slide-over (w-80, fixed right, z-50 over z-40 overlay) with 5 novedad buttons in a 2-col grid and template buttons grouped by area, filtered to current day-of-week
- Extended MonthNavigator with backward-compatible `routePath` prop so AsignacionGrid navigates to `/asignacion-manual` instead of `/planilla`

## Task Commits

Each task was committed atomically:

1. **Task 1: assignShift Server Action + RSC shell** - `5d328e0` (feat)
2. **Task 2: AsignacionGrid + AsignacionModal + MonthNavigator routePath** - `651ca46` (feat)

## Files Created/Modified
- `lib/actions/shifts.ts` — Added `assignShift` export at end of file; covers novedad, descanso, and turno-con-plantilla cases; auth-guarded; revalidates both `/planilla` and `/asignacion-manual`
- `app/(protected)/asignacion-manual/page.tsx` — Replaced stub with async RSC shell using Promise.all to load employees, shifts, absences, templates; renders AsignacionGrid
- `components/planilla/AsignacionGrid.tsx` — Client Component: 3-layer sticky table (corner z-30, thead z-20, name td z-10), absenceMap expansion in useMemo, click handler per cell, conditional AsignacionModal render
- `components/planilla/AsignacionModal.tsx` — Client Component: slide-over panel, dayOfWeek filter (JS→DB remapping), templates grouped by area with AREA_COLORS badges, useTransition around assignShift call
- `components/planilla/MonthNavigator.tsx` — Added optional `routePath` prop (default "/planilla") for backward-compatible multi-view reuse

## Decisions Made
- `assignShift` uses `date + "T00:00:00Z"` suffix to construct UTC-safe `Date` objects for Prisma `@db.Date` fields — consistent with the pattern in `clearShifts` and `clearAbsences`.
- `MonthNavigator` gets `routePath` prop rather than duplicating the component — single source of truth for the month nav UI.
- `AsignacionModal` filters templates by `dayOfWeek === dbDayOfWeek` before grouping — showing all templates regardless of day would make the modal hard to use.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] MonthNavigator routePath prop**
- **Found during:** Task 2 (AsignacionGrid implementation)
- **Issue:** MonthNavigator hard-coded `/planilla` as the route; AsignacionGrid needs to navigate to `/asignacion-manual` on month change
- **Fix:** Added optional `routePath` prop with default `/planilla` — backward-compatible, existing PlanillaGrid callers unchanged
- **Files modified:** `components/planilla/MonthNavigator.tsx`
- **Verification:** TypeScript compiles cleanly, both routes navigate correctly
- **Committed in:** `651ca46` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for correct navigation in AsignacionGrid. No scope creep — backward-compatible change.

## Issues Encountered
None. TypeScript compiled cleanly after both files were created.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `/asignacion-manual` route is live and fully operational
- `assignShift` Server Action ready for Phase 4 (ausencias-y-cobertura may call it from absence modal)
- Slide-over modal pattern established — Phase 4 absence entry can reuse same fixed/z-index approach
- All 7 MAN requirements satisfied

---
*Phase: 03-planilla-principal*
*Completed: 2026-03-24*
