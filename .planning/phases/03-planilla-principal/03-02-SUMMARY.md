---
phase: 03-planilla-principal
plan: 02
subsystem: ui
tags: [react, nextjs, typescript, planilla, date-fns, server-actions, tailwind]

# Dependency graph
requires:
  - phase: 03-planilla-principal-plan-01
    provides: "types/planilla.ts (PlanillaData, EmployeeRow, ShiftData, AbsenceData, TemplateOption, DayHeader) and lib/db/ query functions"
  - phase: 02-algoritmo
    provides: "generateMonthShifts algorithm and triggerGeneration server action"
provides:
  - "app/(protected)/planilla/page.tsx — async RSC shell loading month data in parallel and passing to PlanillaGrid"
  - "components/planilla/PlanillaGrid.tsx — main Client Component with sticky table, filter state, O(1) shift/absence lookups"
  - "components/planilla/ShiftCell.tsx — cell component rendering absence badge, DESC, timeSlot, area badge, manual indicator"
  - "components/planilla/MonthNavigator.tsx — < Mes Año > navigation via router.push with ?mes=N&anio=AAAA"
  - "components/planilla/PlanillaToolbar.tsx — action buttons (Generar, Asignación Manual, Excel, Limpiar) + filter toggles"
  - "lib/actions/shifts.ts — generateMonth, clearShifts, clearAbsences server actions with auth guard"
affects:
  - 03-planilla-principal (plans 03-05 extend the grid with panels, absence modal, and export)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RSC shell loads data in parallel via Promise.all, passes serialized props to Client Component"
    - "O(1) shift/absence lookup Maps keyed by `${employeeId}-${dateISO}` built once in useMemo"
    - "Absence range expanded to individual days inside useMemo(absenceMap) — no per-render loops"
    - "Filter state (areaFilter, novedadFilter) lives in PlanillaGrid, passed down as props to toolbar"
    - "Sticky thead (zIndex 10) + sticky employee <td> column (zIndex 5) — both use var(--card) background"

key-files:
  created:
    - app/(protected)/planilla/page.tsx
    - components/planilla/PlanillaGrid.tsx
    - components/planilla/ShiftCell.tsx
    - components/planilla/MonthNavigator.tsx
    - components/planilla/PlanillaToolbar.tsx
    - lib/actions/shifts.ts
  modified: []

key-decisions:
  - "generateMonth in shifts.ts delegates to triggerGeneration from lib/actions/generation.ts — no duplication; generation service is Phase 2 output"
  - "clearShifts deletes ALL shifts (manual + generated) for the month — simpler admin UX; plan said 'all shifts of the month'"
  - "Absence expansion loop runs inside useMemo — correct placement ensures absenceMap rebuilds only when absences or days change"
  - "PlanillaGrid receives templates prop (passed through to toolbar) for future use in asignacion-manual button routing"

patterns-established:
  - "Server Actions in lib/actions/ always call requireSession() first — consistent auth guard pattern"
  - "Client Components in components/planilla/ are co-located; each exports a named function (not default)"

requirements-completed: [PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05, PLAN-06, PLAN-07, PLAN-08, PLAN-09, PLAN-10, PLAN-11]

# Metrics
duration: 5min
completed: 2026-03-25
---

# Phase 3 Plan 02: Planilla Principal — RSC Shell + 4 UI Components Summary

**Interactive monthly schedule grid with sticky employee rows, area/novedad filters, and action toolbar — /planilla route fully functional using Next.js RSC + 4 Client Components**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-25T01:12:43Z
- **Completed:** 2026-03-25T01:18:00Z
- **Tasks:** 2
- **Files modified:** 6 (all created)

## Accomplishments
- Built /planilla as async RSC loading employees, shifts, absences, templates in parallel with Promise.all
- Created PlanillaGrid with O(1) shift/absence Maps, sticky table headers/employee column, and client-side area/novedad filter state
- ShiftCell renders absence badge (VAC/INC/PER/CAL/DESCANSO) with semantic colors, DESC indicator, timeSlot with multipart (|) support, area badge, and ✏️ manual indicator
- MonthNavigator navigates months via router.push preserving URL query params
- PlanillaToolbar has 5 action buttons (including confirm dialogs for destructive actions) and color-coded toggle filters for 7 areas + 4 novedad types
- 3 Server Actions (generateMonth, clearShifts, clearAbsences) with auth guards — TypeScript compiles with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: RSC shell de la planilla y acciones de servidor** - `892655f` (feat)
2. **Task 2: PlanillaGrid, ShiftCell, MonthNavigator, PlanillaToolbar** - `780a4ea` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `app/(protected)/planilla/page.tsx` — Async RSC; reads searchParams.mes/anio, loads data in parallel, renders PlanillaGrid
- `lib/actions/shifts.ts` — generateMonth (delegates to triggerGeneration), clearShifts (deleteMany all), clearAbsences (deleteMany by date overlap); all auth-guarded
- `components/planilla/PlanillaGrid.tsx` — Main client component: day header generation via date-fns, shiftMap/absenceMap via useMemo, filtered employee list, full sticky table
- `components/planilla/ShiftCell.tsx` — Cell rendering: absence → colored badge; shift null timeSlot → DESC; shift with timeSlot → horario lines + area badge + ✏️; empty → —
- `components/planilla/MonthNavigator.tsx` — prev/next navigation with addMonths/subMonths; displays formatMonthYear
- `components/planilla/PlanillaToolbar.tsx` — Action buttons row + filter row (area toggles with AREA_COLORS, novedad toggles with semantic colors)

## Decisions Made
- `generateMonth` in shifts.ts wraps `triggerGeneration` from generation.ts to avoid duplicating the generation pipeline. Errors surface to the caller via alert in PlanillaToolbar.
- `clearShifts` deletes all shifts (not just non-manual) for the admin month-reset use case — behavior is confirmed via dialog before executing.
- Absence map expansion (range → individual days) runs inside `useMemo([absences, days])` so it's computed once per month change, not on every render.

## Deviations from Plan

None — plan executed exactly as written. All components match the specified props, layout, and behavior.

## Issues Encountered
None. TypeScript compiled cleanly after all 6 files were created.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- /planilla route is live and fully renders the monthly schedule grid
- PlanillaGrid exposes onEmployeeClick and onDayClick stub handlers (onClick={() => {}}) — plan 03-03 adds side panel state
- lib/actions/shifts.ts ready for plan 03-04 (absence creation will call revalidatePath("/planilla"))
- All planilla types from plan 03-01 are consumed correctly with no type errors

---
*Phase: 03-planilla-principal*
*Completed: 2026-03-25*
