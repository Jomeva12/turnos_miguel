---
phase: 04-ausencias-y-cobertura
plan: "03"
subsystem: ui
tags: [gantt, cobertura, nextjs, prisma, tailwind, server-component]

# Dependency graph
requires:
  - phase: 04-01
    provides: Prisma Shift/Area/Employee models and auth infrastructure
provides:
  - Vista Gantt de cobertura horaria /cobertura con selector de fecha
  - GET /api/cobertura?fecha=YYYY-MM-DD agrupado por area
  - CoberturaGantt Client Component con logica de posicionamiento temporal
  - DateSelector Client Component para navegacion por fecha
affects:
  - 04-04
  - 05-exportacion

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component consulta Prisma directamente (sin fetch SSR) para evitar problema URL absoluta
    - calcLeft/calcWidth con porcentaje sobre rango 6:00-22:00 (960 min)
    - parseTimeSlot divide por "|" para renderizar bloques de turno partido separados

key-files:
  created:
    - app/api/cobertura/route.ts
    - app/(protected)/cobertura/page.tsx
    - components/cobertura/CoberturaGantt.tsx
    - components/cobertura/DateSelector.tsx
  modified:
    - components/layout/Navbar.tsx

key-decisions:
  - "Server Component /cobertura consulta Prisma directamente (no via fetch) para evitar problema de URL absoluta en SSR"
  - "GANTT_START=360 / GANTT_END=1320 / GANTT_RANGE=960: rango 6:00-22:00 en minutos para calcular porcentajes"
  - "parseTimeSlot divide por | para turnos partidos; cada segmento genera un div absoluto independiente"
  - "Area General usa sub-fila por empleado; otras areas usan sub-filas por cantidad de shifts ese dia"
  - "Todas las areas siempre presentes aunque no tengan turnos (barra vacia visible)"
  - "fecha T12:00:00 sin timezone suffix en Date constructor para evitar off-by-one de medianoche UTC en titulo"

patterns-established:
  - "calcLeft(min): ((min-360)/960)*100 como porcentaje CSS left"
  - "calcWidth(start,end): ((min(end,1320)-start)/960)*100 como porcentaje CSS width"
  - "Gantt grid: 64 columnas div absolutas, cada 4ta con opacity mas alta (marcas de hora)"

requirements-completed:
  - COV-01
  - COV-02
  - COV-03
  - COV-04

# Metrics
duration: 8min
completed: "2026-03-25"
---

# Phase 4 Plan 03: Cobertura Gantt Summary

**Vista Gantt horizontal 6:00-22:00 con filas por area, bloques coloreados por turno, y soporte de turnos partidos renderizados como dos bloques independientes**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-25T02:07:47Z
- **Completed:** 2026-03-25T02:15:00Z
- **Tasks:** 2 (+ checkpoint auto-aprobado)
- **Files modified:** 5

## Accomplishments
- API GET /api/cobertura?fecha=YYYY-MM-DD retorna shifts+empleados agrupados por area (7 areas siempre presentes)
- Server Component /cobertura renderiza titulo en espanol largo y pasa CoberturaData al Gantt
- CoberturaGantt con logica de posicionamiento temporal (calcLeft/calcWidth) y soporte de turnos partidos
- DateSelector navega con router.push al cambiar la fecha

## Task Commits

1. **Tarea 1: API de cobertura y Server Component** - `a070768` (feat)
2. **Tarea 2: Componente Gantt horizontal** - `5d2cdf9` (feat)

## Files Created/Modified
- `app/api/cobertura/route.ts` - GET endpoint que agrupa shifts por area ordenados en orden fijo
- `app/(protected)/cobertura/page.tsx` - Server Component con selector de fecha y consulta Prisma directa
- `components/cobertura/CoberturaGantt.tsx` - Client Component con Gantt horizontal y logica de posicionamiento
- `components/cobertura/DateSelector.tsx` - Client Component input date con router.push
- `components/layout/Navbar.tsx` - Agregado link "Cobertura"

## Decisions Made
- Server Component consulta Prisma directamente (no via fetch a la API) para evitar el problema de URL relativa en SSR
- Gantt usa porcentajes CSS calculados sobre el rango 6:00-22:00 (960 minutos) para posicionamiento responsivo
- Turnos partidos ("|") se renderizan como dos divs absolutos independientes en la misma fila
- La pagina usa `new Date(fecha + T12:00:00)` (sin sufijo Z) para evitar off-by-one en el titulo del dia

## Deviations from Plan

None - plan ejecutado exactamente como fue escrito.

## Issues Encountered
- Navbar ya tenia el link de "Ausencias" (agregado en plan 04-02 por el ejecutor anterior), por lo que solo se agrego "Cobertura" como link adicional.

## Next Phase Readiness
- Vista /cobertura completa con Gantt funcional
- API /api/cobertura disponible para futuros consumidores (exportacion, reportes)
- Listo para fase 05 de exportacion Excel

---
*Phase: 04-ausencias-y-cobertura*
*Completed: 2026-03-25*

## Self-Check: PASSED

- FOUND: app/api/cobertura/route.ts
- FOUND: app/(protected)/cobertura/page.tsx
- FOUND: components/cobertura/CoberturaGantt.tsx
- FOUND: components/cobertura/DateSelector.tsx
- FOUND commit: a070768
- FOUND commit: 5d2cdf9
