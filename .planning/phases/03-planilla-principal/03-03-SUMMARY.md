---
phase: 03-planilla-principal
plan: "03"
subsystem: ui
tags: [react, nextjs, date-fns, tailwind, glassmorphism, planilla]

requires:
  - phase: 03-planilla-principal-02
    provides: PlanillaGrid with shift cells, absence map, filter toolbar, month navigation

provides:
  - CoberturaSidebar: day coverage panel showing trabajando/descanso/vacaciones/by-area breakdown
  - EmpleadoPerfil: employee profile panel showing month stats and edit-turnos entry point
  - PlanillaGrid updated with mutual-exclusion panel state and clickable day headers and employee rows

affects:
  - 03-04-planilla-principal (manual shift assignment modal that may use selectedEmployee)
  - 03-05-planilla-principal (individual employee editor connected via onEditarTurnos)

tech-stack:
  added: []
  patterns:
    - Mutual exclusion for single-panel-at-a-time: setSelectedDay clears selectedEmployee and vice versa
    - Return null early pattern: both panel components return null when prop is null — no conditional JSX in parent
    - useMemo for per-day/per-employee stats: filters and aggregates runs only when deps change

key-files:
  created:
    - components/planilla/CoberturaSidebar.tsx
    - components/planilla/EmpleadoPerfil.tsx
  modified:
    - components/planilla/PlanillaGrid.tsx

key-decisions:
  - "Panels return null when prop is null — parent flex layout requires no conditional rendering, table naturally fills full width when both panels are closed"
  - "CoberturaSidebar calculates vacaciones from absence type VAC covering the day — consistent with absenceMap logic in PlanillaGrid"
  - "EmpleadoPerfil areasEsteMes uses JSON.stringify dedup on {name, color} objects — avoids importing extra libraries for Set-based object dedup"
  - "onEditarTurnos stub logs to console — wired to actual navigation in Plan 05"

patterns-established:
  - "Lateral panel pattern: w-64 glass-card self-start, opens from null state via parent click handler"
  - "SummaryRow/StatRow sub-components: icon + label + value with inline color props — reusable within component file"

requirements-completed:
  - SIDE-01
  - SIDE-02

duration: 8min
completed: 2026-03-24
---

# Phase 03 Plan 03: Paneles Laterales de Cobertura y Perfil Summary

**Two glass-card lateral panels added to PlanillaGrid: CoberturaSidebar shows daily coverage totals and per-area breakdown on day-header click; EmpleadoPerfil shows employee month stats on name click, with mutual exclusion state.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-24T00:05:10Z
- **Completed:** 2026-03-24T00:13:00Z
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- CoberturaSidebar: computes trabajando/descanso/vacaciones/total for any clicked day, groups shifts by areaName with colored badges
- EmpleadoPerfil: shows month-scoped totalTrabajando/totalDescansos/totalNovedades plus active areas, with "Editar Turnos" button stub
- PlanillaGrid: selectedDay and selectedEmployee state with mutual-exclusion handlers; day `<th>` and employee name `<td>` are now clickable

## Task Commits

1. **Task 1: Componentes de paneles laterales** - `4aa9959` (feat)
2. **Task 2: Conectar paneles laterales en PlanillaGrid** - `cd30bc7` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `components/planilla/CoberturaSidebar.tsx` — Day coverage sidebar panel
- `components/planilla/EmpleadoPerfil.tsx` — Employee profile sidebar panel
- `components/planilla/PlanillaGrid.tsx` — Added panel state, handlers, flex layout, and panel imports

## Decisions Made

- Panels use `return null` early guard — the flex layout in PlanillaGrid handles zero-width naturally without conditional class logic.
- Vacaciones count uses absence type `VAC` only (not all absence types) — consistent with domain meaning of "vacaciones" vs other novedades.
- `onEditarTurnos` intentionally stubs to `console.log` — actual navigation to individual editor is Plan 05's responsibility.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- PlanillaGrid now exposes `selectedEmployee` interaction pattern that Plan 04 (modal de asignacion manual) can extend.
- `onEditarTurnos(employeeId)` stub in EmpleadoPerfil is the hook Plan 05 (editor individual) will connect to.

---
*Phase: 03-planilla-principal*
*Completed: 2026-03-24*
