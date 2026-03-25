---
phase: 01-fundaci-n
plan: "03"
subsystem: ui
tags: [habilidades, server-action, prisma, checkbox, use-transition, glassmorphism, tailwind]

# Dependency graph
requires:
  - "lib/db.ts (Prisma singleton from Plan 01)"
  - "prisma/schema.prisma (Employee, Area, EmployeeArea models from Plan 01)"
  - "lib/auth.ts (better-auth session check from Plan 02)"
  - "app/(protected)/layout.tsx (Navbar + protected route group from Plan 02)"
  - "lib/constants/areas.ts (AREA_COLORS for column headers from Plan 01)"
provides:
  - "toggleEmployeeArea Server Action (lib/actions/employees.ts) — creates/deletes EmployeeArea records with auth guard"
  - "HabilidadesTable client component — interactive checkbox table with per-cell useTransition"
  - "Habilidades page (/habilidades) — real server component replacing placeholder"
  - "lib/actions/employees.test.ts — 4 vitest integration tests for Prisma toggle logic"
affects: [02-generacion, all-phases-using-employee-area]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Action with 'use server' + auth guard + revalidatePath pattern"
    - "Per-cell useTransition isolates pending state — toggling one checkbox doesn't block others"
    - "upsert with composite key (employeeId_areaId) for idempotent create; deleteMany for idempotent delete"
    - "defaultChecked (not controlled) on checkboxes — React optimistic UI; revalidatePath syncs state"

key-files:
  created:
    - "lib/actions/employees.ts — 'use server' toggleEmployeeArea: auth guard, upsert/deleteMany, revalidatePath"
    - "lib/actions/employees.test.ts — 4 vitest tests: create, delete, idempotent-create, idempotent-delete"
    - "components/habilidades/HabilidadesTable.tsx — client component, per-cell AreaCheckbox with useTransition"
  modified:
    - "app/(protected)/habilidades/page.tsx — replaced placeholder with full async Server Component"

key-decisions:
  - "Per-cell useTransition (AreaCheckbox wrapper): isolates pending state per checkbox so one toggle doesn't gray the whole table"
  - "defaultChecked not value/checked: avoids controlled input complexity — Server Action revalidatePath syncs truth from DB"
  - "deleteMany for remove case: safe and idempotent even if record doesn't exist (no findUnique + delete needed)"
  - "Yellow outline + 'sin áreas' badge dual warning: outline gives immediate row-level visibility, badge communicates semantics"

patterns-established:
  - "Server Actions live in lib/actions/ with 'use server' at file top"
  - "Auth check pattern in Server Actions: auth.api.getSession({ headers: await headers() })"
  - "EmployeeArea composite key: employeeId_areaId for upsert where clause"

requirements-completed: [DATA-03]

# Metrics
duration: 8min
completed: "2026-03-24"
---

# Phase 1 Plan 03: Habilidades — employee-area checkbox table with Server Action toggles

**Checkbox table mapping ~30 employees x 7 areas with instant toggle via Server Action upsert/deleteMany, per-cell useTransition, and yellow warning for unassigned employees**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-24T17:03:09Z
- **Completed:** 2026-03-24T17:11:00Z
- **Tasks:** 2/2
- **Files modified:** 4 (1 modified, 3 created)

## Accomplishments

- Built `toggleEmployeeArea` Server Action with auth guard, upsert (enabled=true) and deleteMany (enabled=false), and revalidatePath("/habilidades")
- Created HabilidadesTable client component with per-cell `AreaCheckbox` wrapper using isolated `useTransition` — each checkbox manages its own pending state independently
- Real habilidades page replaces placeholder: fetches employees (with areas included) and areas in parallel via Promise.all, sorted alphabetically by name
- Visual warnings for employees with zero areas: yellow `outline` on the row + "sin áreas" badge with matching yellow styling

## Task Commits

1. **Task 1: Server Action toggleEmployeeArea and its test** — `67ffe71` (feat)
2. **Task 2: Habilidades page with employee-area checkbox table** — `8e99648` (feat)

## Files Created/Modified

- `lib/actions/employees.ts` — Server Action: auth check, upsert/deleteMany, revalidatePath
- `lib/actions/employees.test.ts` — 4 vitest tests validating Prisma toggle operations directly
- `components/habilidades/HabilidadesTable.tsx` — Client Component with AreaCheckbox, AREA_COLORS headers, warning for zero-area employees
- `app/(protected)/habilidades/page.tsx` — Async Server Component: parallel Prisma fetch, passes data to HabilidadesTable

## Decisions Made

- **Per-cell useTransition:** Each `AreaCheckbox` component has its own `useTransition` — toggling one checkbox shows opacity pending state only on that cell, not the whole table.
- **defaultChecked instead of controlled value:** Avoids React controlled/uncontrolled complexity. Server-side revalidatePath handles truth sync after each toggle.
- **deleteMany for delete case:** Safe and idempotent — no error if record already missing, no extra findUnique query needed.
- **Dual warning (outline + badge):** Yellow outline provides row-level visual scanning, "sin áreas" text badge provides explicit semantic meaning.

## Deviations from Plan

None — plan executed exactly as written. The plan specified `app/habilidades/page.tsx` but the existing route group structure from Plan 02 places it at `app/(protected)/habilidades/page.tsx`. The placeholder was replaced in-place (same route, same URL `/habilidades`), consistent with Plan 02's architecture.

## Issues Encountered

None — TypeScript passed on first check, `npm run build` passed on first run (8 routes, `/habilidades` renders as static prerender).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `/habilidades` is fully functional: checkbox toggles persist to database, employee order is alphabetical, warnings display for zero-area employees
- `toggleEmployeeArea` Server Action ready for use by any future UI needing employee-area mutations
- Phase 2 (generation algorithm) can read `employee.areas` via Prisma includes — the assignment data structure is in place
- Plan 04 (planilla) can proceed — the route group and navbar links are already wired up

---
*Phase: 01-fundaci-n*
*Completed: 2026-03-24*

## Self-Check: PASSED

All 4 required files confirmed to exist on disk. Both task commits (67ffe71, 8e99648) confirmed in git history. `npm run build` passed with 8 routes including `/habilidades`.
