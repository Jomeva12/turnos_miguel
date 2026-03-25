---
phase: 04-ausencias-y-cobertura
plan: 02
subsystem: ui
tags: [react, nextjs, prisma, server-components, client-components, glassmorphism]

# Dependency graph
requires:
  - phase: 04-01
    provides: Server Actions createAbsence, deleteAbsence, clearMonthAbsences + AbsenceType + Absence model

provides:
  - app/(protected)/ausencias/page.tsx — Server Component que carga empleados y ausencias del mes en TZ Bogota
  - components/ausencias/AusenciasForm.tsx — Client Component formulario de registro de novedad
  - components/ausencias/AusenciasList.tsx — Client Component tabla con badges de color, eliminar por fila y limpiar mes

affects:
  - 05-finalizacion
  - cobertura

# Tech tracking
tech-stack:
  added: []
  patterns:
    - AbsenceRowItem isolates useTransition per row so deleting one row does not block others
    - Auto-fill fechaFin = fechaInicio when tipo != VAC (single-day absences)
    - UTC Date.UTC() boundary queries for Prisma @db.Date fields

key-files:
  created:
    - app/(protected)/ausencias/page.tsx
    - components/ausencias/AusenciasForm.tsx
    - components/ausencias/AusenciasList.tsx
  modified:
    - components/layout/Navbar.tsx

key-decisions:
  - "AbsenceRowItem sub-component isolates useTransition per row — same pattern as AreaCheckbox in HabilidadesTable"
  - "fechaFin auto-fills with fechaInicio for non-VAC types to support single-day absences with minimal friction"
  - "timeZone: UTC in toLocaleDateString for absence dates (Prisma @db.Date stores midnight UTC) — prevents off-by-one day display"

patterns-established:
  - "Per-row useTransition isolation: wrap each mutable row in its own component to scope pending state"
  - "Auto-fill pattern: when tipo changes away from VAC, align fechaFin to fechaInicio immediately"

requirements-completed:
  - ABS-01
  - ABS-02
  - ABS-03
  - ABS-04

# Metrics
duration: 2min
completed: 2026-03-25
---

# Phase 4 Plan 02: Ausencias UI Summary

**Pagina /ausencias con formulario de registro glassmorphism + tabla de novedades con badges de color semantico, eliminacion por fila y limpieza mensual con confirmacion**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-25T02:07:20Z
- **Completed:** 2026-03-25T02:09:17Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Server Component que calcula mes/anio en TZ America/Bogota y hace queries paralelas de empleados + ausencias del mes
- AusenciasForm con auto-fill de fecha fin para tipos de un dia (INC, PER, CAL) y useTransition en submit
- AusenciasList con tabla glassmorphism, badges VAC/INC/PER/CAL/DESCANSO con colores semanticos, deleteAbsence por fila aislado con useTransition, y clearMonthAbsences con confirm() nativo

## Task Commits

1. **Tarea 1: Pagina de Ausencias y formulario de registro** - `821c6b9` (feat)
2. **Tarea 2: Lista de novedades del mes con eliminar y limpiar** - `7a53886` (feat)

## Files Created/Modified

- `app/(protected)/ausencias/page.tsx` — Server Component, queries prisma.employee + prisma.absence del mes actual en TZ Bogota
- `components/ausencias/AusenciasForm.tsx` — Client Component, formulario con 4 campos, useTransition, auto-fill fechaFin para no-VAC
- `components/ausencias/AusenciasList.tsx` — Client Component, tabla con AbsenceRowItem isolation, badges por tipo, boton limpiar con confirmacion
- `components/layout/Navbar.tsx` — Agregado link "Ausencias" al array NAV_LINKS

## Decisions Made

- **AbsenceRowItem isolation:** Sub-componente por fila para aislar useTransition, mismo patron que AreaCheckbox en HabilidadesTable — un delete no bloquea la tabla completa.
- **Auto-fill fechaFin:** Al cambiar tipo a no-VAC o al cambiar fechaInicio con tipo no-VAC, fechaFin se sincroniza automaticamente — reduce friccion para ausencias de un dia.
- **timeZone: UTC en formatDate:** Prisma almacena @db.Date como medianoche UTC, entonces toLocaleDateString debe usar timeZone: "UTC" para evitar mostrar un dia antes en TZ Bogota (UTC-5).

## Deviations from Plan

None — plan ejecutado exactamente como estaba escrito.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- /ausencias disponible con formulario + lista completa
- Navbar actualizado con link Ausencias
- Listo para integracion con vista de cobertura (04-03) o finalizacion (fase 05)

---
*Phase: 04-ausencias-y-cobertura*
*Completed: 2026-03-25*
