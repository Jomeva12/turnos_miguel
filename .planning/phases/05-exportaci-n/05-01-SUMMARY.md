---
phase: 05-exportaci-n
plan: "01"
subsystem: api
tags: [exceljs, xlsx, export, route-handler, tdd, prisma]

# Dependency graph
requires:
  - phase: 04-ausencias-y-cobertura
    provides: Shift and Employee Prisma models with full month data queryable
provides:
  - GET /api/export route handler that streams .xlsx planilla for any month
  - exceljs dependency installed
affects: [05-02-exportaci-n]

# Tech tracking
tech-stack:
  added: [exceljs@4.4.0]
  patterns: [TDD Route Handler, ExcelJS workbook buffer streaming via Response, O(1) shift lookup with nested Map, UPPERCASE Spanish day abbreviations via hardcoded array]

key-files:
  created:
    - app/api/export/route.ts
    - app/api/export/route.test.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "ExcelJS (not xlsx/sheetjs) — xlsx npm package has high-severity CVE, ExcelJS is safe and actively maintained"
  - "Include ALL employees in export (not just those with shifts) — matches full planilla view for complete monthly picture"
  - "DAY_ABBR hardcoded array indexed by getDay() — avoids relying on date-fns locale for UPPERCASE output; toUpperCase() explicitly applied"
  - "Route Handler returns Response (not NextResponse) with binary buffer — standard Next.js App Router pattern for file downloads"
  - "prisma export used from lib/db (not 'db') — actual singleton export name"

patterns-established:
  - "ExcelJS workbook pattern: addWorksheet -> addRow(header) -> loop employees -> addRow per employee -> freeze panes -> writeBuffer -> Response"
  - "Split shift rendering: timeSlot.includes('|') -> replace('|', '\n') + cell.alignment wrapText:true vertical:top"
  - "Null timeSlot -> DESCANSO text; no shift record -> blank cell"

requirements-completed: [EXP-01, EXP-02, EXP-03]

# Metrics
duration: 8min
completed: 2026-03-25
---

# Phase 05 Plan 01: Excel Export Route Handler Summary

**ExcelJS GET /api/export route handler streaming .xlsx planilla with UPPERCASE Spanish day headers, split-shift two-line rendering, and frozen sticky headers**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-25T02:13:36Z
- **Completed:** 2026-03-25T02:21:00Z
- **Tasks:** 2 (Task 1: Install ExcelJS, Task 2: Route Handler TDD)
- **Files modified:** 4

## Accomplishments
- Installed exceljs@4.4.0 as approved safe alternative to xlsx/sheetjs (which has CVE)
- GET /api/export?year=YYYY&month=MM streams binary .xlsx with full employee schedule
- TDD: 10 tests written (RED), then all passing (GREEN) — validation, Content-Type, Content-Disposition, Prisma calls, buffer output
- TypeScript clean, Next.js build passes with /api/export route listed

## Task Commits

Each task was committed atomically:

1. **Task 1: Install ExcelJS** - `e817e4f` (chore)
2. **Task 2: RED phase tests** - `de78e26` (test)
3. **Task 2: GREEN phase implementation** - `fa8dcd4` (feat)

_Note: TDD task produced two commits (test RED -> feat GREEN)_

## Files Created/Modified
- `app/api/export/route.ts` - GET handler: validates params, queries Prisma, builds ExcelJS workbook, streams .xlsx buffer
- `app/api/export/route.test.ts` - 10 vitest tests covering 400 errors, 200 response shape, Prisma calls, binary output
- `package.json` - added exceljs@^4.4.0 dependency
- `package-lock.json` - updated lockfile

## Decisions Made
- ExcelJS over xlsx/sheetjs: xlsx npm registry version has a high-severity CVE documented in stack research
- ALL employees included in export (not just those with shifts that month) — ensures export matches full planilla view
- DAY_ABBR hardcoded as `["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"]` indexed by `getDay()` — reliable UPPERCASE without locale formatting
- `prisma` (not `db`) used as import name from `@/lib/db` — matches actual singleton export name in codebase

## Deviations from Plan

**1. [Rule 1 - Bug] Import name correction: `prisma` not `db`**
- **Found during:** Task 2 (implementation)
- **Issue:** Plan referenced `import db from "@/lib/db"` but lib/db.ts exports `export const prisma`
- **Fix:** Used correct import `import { prisma } from "@/lib/db"`
- **Files modified:** app/api/export/route.ts
- **Verification:** TypeScript compiles clean, tests pass
- **Committed in:** fa8dcd4 (Task 2 feat commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - import name mismatch)
**Impact on plan:** Minor naming fix, no scope creep, correctness required.

## Issues Encountered
- Test type assertion for mocked Prisma needed `as any as {...}` double cast — TypeScript strict mode rejects direct cast of PrismaClient to test mock shape. Added eslint-disable comment and fixed inline.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- /api/export route ready; admin UI Excel button needs to call GET /api/export?year=...&month=... (Phase 5 Plan 02 or existing planilla wiring)
- Phase 5 Plan 02 (Limpiar Turnos/Novedades Server Actions) already complete per git log

---
*Phase: 05-exportaci-n*
*Completed: 2026-03-25*
