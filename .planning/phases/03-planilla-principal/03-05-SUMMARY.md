---
phase: 03-planilla-principal
plan: 05
subsystem: ui
tags: [react, nextjs, typescript, planilla, date-fns, tailwind, editor-individual, next-navigation]

# Dependency graph
requires:
  - phase: 03-planilla-principal-plan-01
    provides: "types/planilla.ts (EmployeeRow, ShiftData, AbsenceData, TemplateOption) and lib/db/ query functions"
  - phase: 03-planilla-principal-plan-03
    provides: "EmpleadoPerfil component with onEditarTurnos callback stub; PlanillaGrid layout"
  - phase: 03-planilla-principal-plan-04
    provides: "AsignacionModal (slide-over with novedades + template buttons); assignShift Server Action"
provides:
  - "app/(protected)/editor/[empleadoId]/page.tsx — RSC shell para el editor individual de un empleado"
  - "components/planilla/EditorIndividual.tsx — grid de 7 columnas de días del mes con modal de asignación por clic"
  - "PlanillaGrid.tsx#onEditarTurnos — navega a /editor/[id]?mes=N&anio=AAAA via router.push"
affects:
  - 04-ausencias-y-cobertura (puede navegar a editor individual desde ausencias)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Grid de días mensual con offset Mon-first: getDay() → (jsDay===0 ? 6 : jsDay-1) para alinear primer día al día de semana correcto"
    - "EditorIndividual reutiliza AsignacionModal de Plan 04 sin modificaciones — mismo slide-over pattern"
    - "useRouter en PlanillaGrid: router.push conserva mes/anio en la URL del editor individual"

key-files:
  created:
    - app/(protected)/editor/[empleadoId]/page.tsx
    - components/planilla/EditorIndividual.tsx
  modified:
    - components/planilla/PlanillaGrid.tsx

key-decisions:
  - "getWeekOffset helper: JS getDay() (0=Sun) remapeado a índice Mon-first (Mon=0..Sat=5,Sun=6) para offset de primer día del mes"
  - "MonthNavigator en EditorIndividual usa routePath=/editor/[id] — navegación de mes conserva el empleado seleccionado"
  - "absenceMap en EditorIndividual usa solo las ausencias del empleado (ya filtradas en RSC) — lookup por dateISO directo sin prefijo employeeId"

patterns-established:
  - "RSC shell filtra datos por empleado antes de pasar al Client Component — Client Component recibe solo datos relevantes"

requirements-completed: [EDIT-01, EDIT-02, EDIT-03]

# Metrics
duration: 4min
completed: 2026-03-25
---

# Phase 3 Plan 05: Editor Individual Summary

**Grid mensual de 7 columnas por empleado con AsignacionModal reutilizado y navegacion desde planilla via router.push — ruta /editor/[empleadoId] completamente funcional**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-25T01:24:05Z
- **Completed:** 2026-03-25
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments
- Creada ruta `/editor/[empleadoId]` como RSC shell que carga empleado, shifts, ausencias y plantillas en paralelo con Promise.all, filtra datos del empleado específico, y renderiza EditorIndividual
- Construido EditorIndividual como Client Component con grid de 7 columnas (Mon-first), offset de primer día del mes, tarjetas de días clickeables que reutilizan ShiftCell, y AsignacionModal idéntico al de AsignacionGrid
- Conectado el botón "Editar Turnos" del EmpleadoPerfil: reemplazado console.log placeholder por router.push(`/editor/${id}?mes=${mes}&anio=${anio}`)

## Task Commits

Each task was committed atomically:

1. **Task 1: RSC shell y componente EditorIndividual** - `c1ae49c` (feat)
2. **Task 2: Conectar botón Editar Turnos con router.push** - `dc37397` (feat)

## Files Created/Modified
- `app/(protected)/editor/[empleadoId]/page.tsx` — RSC async shell: lee params/searchParams, carga datos con Promise.all, filtra por empleado, renderiza EditorIndividual
- `components/planilla/EditorIndividual.tsx` — Client Component: grid de 7 columnas con offset Mon-first, tarjetas clickeables por día, ShiftCell para estado visual, AsignacionModal al hacer clic
- `components/planilla/PlanillaGrid.tsx` — Agrega useRouter, reemplaza stub de onEditarTurnos por router.push a /editor/[id]

## Decisions Made
- `getWeekOffset` helper en EditorIndividual calcula celdas vacías iniciales para alinear primer día al día-de-semana correcto en grilla Mon-first
- `absenceMap` usa `dateISO` como clave directa (sin prefijo employeeId) porque el RSC ya filtra por empleado antes de pasar los datos
- `MonthNavigator` recibe `routePath=/editor/${employee.id}` para que la navegación de mes preserve el empleado seleccionado

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. TypeScript compiló limpiamente en ambas tareas.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 3 completa: todos los 5 planes implementados
- Flujo completo admin → /planilla → clic empleado → Editar Turnos → /editor/[id] → clic día → modal → guardar funcional de extremo a extremo
- Phase 4 (ausencias y cobertura) puede reutilizar AsignacionModal y el slide-over pattern
- Los requisitos EDIT-01, EDIT-02, EDIT-03 están satisfechos

---
*Phase: 03-planilla-principal*
*Completed: 2026-03-25*
