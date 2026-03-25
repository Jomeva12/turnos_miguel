---
phase: 01-fundaci-n
plan: "01"
subsystem: database
tags: [nextjs, prisma, postgresql, tailwind, vitest, better-auth, date-fns, seed]

# Dependency graph
requires: []
provides:
  - "Full Prisma schema (all models for phases 1-5)"
  - "Seed data: 31 employees, 7 areas, 172 shift templates, admin user"
  - "Prisma singleton pattern (lib/db.ts)"
  - "Spanish date formatting utilities (formatMonthYear, formatDayShort)"
  - "Area colors and names as TypeScript constants (lib/constants/areas.ts)"
  - "Tailwind v4 CSS with dark mode variables and glassmorphism"
  - "Root layout with next-themes ThemeProvider (dark mode forced)"
  - "Vitest configuration and test infrastructure"
affects: [01-02, 01-03, 01-04, auth, habilidades, planilla, all-phases]

# Tech tracking
tech-stack:
  added:
    - "Next.js 15 (App Router, standalone output)"
    - "Prisma 6 + @prisma/client"
    - "PostgreSQL 16 (Homebrew install for local dev)"
    - "Tailwind CSS v4 (@tailwindcss/postcss, no tailwind.config.js)"
    - "better-auth 1.5.6 (replaces @better-auth/prisma which no longer exists)"
    - "date-fns 4 + es locale"
    - "next-themes 0.4"
    - "vitest 4 + @vitest/coverage-v8"
    - "tsx (for prisma seed)"
    - "react-hook-form + zod + @hookform/resolvers"
    - "clsx + tailwind-merge + lucide-react"
  patterns:
    - "Prisma singleton via globalThis (lib/db.ts) — prevents pool exhaustion"
    - "Date constructor year/month/day vs ISO string — avoids UTC timezone day-shift"
    - "better-auth/crypto hashPassword (not hash) for scrypt password hashing"
    - "better-auth Prisma adapter at better-auth/adapters/prisma (built-in, no separate package)"

key-files:
  created:
    - "prisma/schema.prisma — Full schema (User, Session, Account, Verification, Employee, Area, EmployeeArea, ShiftTemplate, Shift, Absence, GenerationLog)"
    - "prisma/seed.ts — Seed script with 31 employees, 7 areas, 172 templates, admin user"
    - "prisma/seed.test.ts — 10 integration tests verifying seed data integrity"
    - "lib/db.ts — Prisma singleton"
    - "lib/constants/areas.ts — AREA_COLORS with exact Laravel area names"
    - "lib/utils/format.ts — formatMonthYear, formatDayShort (date-fns v4 + es)"
    - "lib/utils/format.test.ts — 10 unit tests for Spanish formatting"
    - "app/globals.css — Tailwind v4 CSS with .glass class and dark mode tokens"
    - "app/layout.tsx — Root layout with ThemeProvider (dark mode forced)"
    - "vitest.config.ts — Test infrastructure"
    - "next.config.ts — standalone output, serverExternalPackages prisma"
    - "postcss.config.mjs — @tailwindcss/postcss"
    - "tsconfig.json — TypeScript config with @/* alias"
    - ".gitignore — Node, Next.js, Prisma ignores"
  modified: []

key-decisions:
  - "Downgrade from Prisma 7 to Prisma 6: Prisma 7 moved DATABASE_URL out of schema.prisma into prisma.config.ts — breaking change not mentioned in research. Prisma 6 (6.19.2) uses the traditional schema.prisma approach."
  - "Area names from Laravel source differ from plan: Valery Camacho (not Varely), Domicilio (not Domicilios), Cosmetico (not Cosmético), Electrodomestico (not Electrodoméstico) — used exact names from DatabaseSeeder.php"
  - "@better-auth/prisma package no longer exists: Prisma adapter is now built into better-auth at better-auth/adapters/prisma (found by inspecting package.json exports)"
  - "better-auth/crypto exports hashPassword not hash: corrected after runtime error (hash is not a function)"
  - "Install PostgreSQL via Homebrew: no local PostgreSQL or Docker available, installed postgresql@16 via brew services"
  - "DATABASE_URL uses system username (franciatrasvina) not postgres: standard Homebrew PostgreSQL setup has no postgres superuser"
  - "Seed uses deleteMany+createMany for ShiftTemplate idempotency: no unique constraint on (area+day+schedule) combination, delete-all and recreate is the cleanest approach"

patterns-established:
  - "Prisma singleton: globalThis guard in lib/db.ts, import from @/lib/db everywhere"
  - "Date test construction: use new Date(year, month, day) not ISO string to avoid UTC day-shift in timezone-aware tests"
  - "Area constants: import from lib/constants/areas.ts for all badge colors across phases"
  - "Spanish dates: formatMonthYear capitalizes first letter, formatDayShort returns abbreviated day name"

requirements-completed: [DATA-01, DATA-02, DATA-04, DATA-05, INF-03]

# Metrics
duration: 13min
completed: "2026-03-24"
---

# Phase 1 Plan 01: Fundación — Schema, Seed, and Base Utilities Summary

**Next.js 15 project scaffolded with complete Prisma schema, 31 real employees + 7 areas + 172 shift templates seeded from Laravel source, and Spanish formatting utilities with 20 passing tests**

## Performance

- **Duration:** ~13 min
- **Started:** 2026-03-24T16:36:50Z
- **Completed:** 2026-03-24T16:49:28Z
- **Tasks:** 3/3
- **Files created:** 19

## Accomplishments

- Scaffolded Next.js 15 project from scratch (create-next-app blocked by folder name capitals — built manually)
- Created complete Prisma schema covering all 5 phases: 11 models including auth tables (User, Session, Account, Verification) and domain tables (Employee, Area, EmployeeArea, ShiftTemplate, Shift, Absence, GenerationLog)
- Seeded exact data from Laravel source: 31 employees, 7 areas, 172 shift templates including wildcard/comodin entries
- Admin user seeded with better-auth scrypt hash (not bcryptjs)
- 20 tests passing: 10 Spanish formatting unit tests + 10 seed data integration tests

## Task Commits

1. **Task 1: Scaffold project, schema, utilities** — `75b3fac` (feat)
2. **Task 2: Seed script** — `0e66a72` (feat)
3. **Task 3: Seed verification tests** — `286f537` (test)

## Files Created

- `/prisma/schema.prisma` — Full 11-model schema for all phases
- `/prisma/seed.ts` — 519-line seed script with 31 employees, 7 areas, 172 templates, admin user
- `/prisma/seed.test.ts` — 10 integration tests verifying seed integrity
- `/lib/db.ts` — Prisma singleton (globalThis pattern)
- `/lib/constants/areas.ts` — AREA_COLORS map (exact Laravel names + hex colors)
- `/lib/utils/format.ts` — formatMonthYear and formatDayShort with date-fns v4 + es locale
- `/lib/utils/format.test.ts` — 10 unit tests for Spanish formatting
- `/app/globals.css` — Tailwind v4 CSS, .glass glassmorphism class, dark mode tokens
- `/app/layout.tsx` — Root layout with next-themes (dark mode forced)
- `/vitest.config.ts` — Vitest test configuration
- `/next.config.ts` — standalone output, serverExternalPackages
- `/tsconfig.json`, `/postcss.config.mjs`, `/package.json`, `.gitignore`

## Decisions Made

- **Prisma 6 not 7:** Prisma 7 requires DATABASE_URL in prisma.config.ts (breaking change). Pinned to Prisma 6.
- **Exact Laravel area names:** Valery Camacho (not Varely), Domicilio (not Domicilios), Cosmetico/Electrodomestico (no accents) — from DatabaseSeeder.php.
- **better-auth adapters/prisma built-in:** `@better-auth/prisma` package no longer exists. Adapter is at `better-auth/adapters/prisma`.
- **hashPassword not hash:** `better-auth/crypto` exports `hashPassword`, not `hash`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] create-next-app fails on folder name GestionTurnos (capital letters)**
- **Found during:** Task 1 (scaffolding)
- **Issue:** `create-next-app` uses folder name as npm package name, rejects capital letters
- **Fix:** Built project scaffold manually: package.json with `"name": "gestion-turnos"`, installed all deps via npm install
- **Files modified:** package.json, all project files created manually
- **Verification:** `npm run dev` works, `npx prisma generate` works
- **Committed in:** 75b3fac (Task 1 commit)

**2. [Rule 3 - Blocking] Prisma 7 incompatible with schema.prisma DATABASE_URL**
- **Found during:** Task 1 (`npx prisma generate`)
- **Issue:** Prisma 7 removed `url = env("DATABASE_URL")` from datasource block
- **Fix:** Downgraded to Prisma 6 (`npm install prisma@6 @prisma/client@6`)
- **Files modified:** package.json, package-lock.json
- **Verification:** `npx prisma generate` and `npx prisma validate` pass
- **Committed in:** 75b3fac (Task 1 commit)

**3. [Rule 3 - Blocking] No local PostgreSQL available**
- **Found during:** Task 1 (`npx prisma migrate dev`)
- **Issue:** No PostgreSQL running locally, no Docker
- **Fix:** `brew install postgresql@16 && brew services start postgresql@16 && createdb gestion_turnos`
- **Fix 2:** Updated DATABASE_URL to use system user `franciatrasvina` (Homebrew default, no postgres superuser)
- **Verification:** `pg_isready` returns "accepting connections", migration ran successfully
- **Committed in:** 75b3fac (Task 1 commit, .env not committed)

**4. [Rule 1 - Bug] @better-auth/prisma package does not exist**
- **Found during:** Task 1 (npm install)
- **Issue:** `npm install @better-auth/prisma` returns 404 — package was merged into main better-auth package
- **Fix:** Removed from install command; adapter is at `better-auth/adapters/prisma`
- **Files modified:** package.json (removed from dependencies)
- **Committed in:** 75b3fac (Task 1 commit)

**5. [Rule 1 - Bug] better-auth/crypto exports hashPassword not hash**
- **Found during:** Task 2 (seed script runtime)
- **Issue:** `import { hash } from "better-auth/crypto"` — TypeError: hash is not a function
- **Fix:** Changed to `import { hashPassword } from "better-auth/crypto"`
- **Files modified:** prisma/seed.ts
- **Verification:** Seed runs successfully, admin user created with valid password hash
- **Committed in:** 0e66a72 (Task 2 commit)

**6. [Rule 1 - Bug] Test dates using ISO string format cause day-shift in non-UTC timezone**
- **Found during:** Task 1 (format.test.ts)
- **Issue:** `new Date("2024-03-04")` parses as UTC midnight → shifts to previous day in UTC-5 (America/Bogota)
- **Fix:** Changed to `new Date(year, month, day)` constructor (local time, no TZ shift)
- **Files modified:** lib/utils/format.test.ts
- **Verification:** All 10 format tests pass
- **Committed in:** 75b3fac (Task 1 commit)

---

**Total deviations:** 6 auto-fixed (2 blocking issues, 3 bugs, 1 blocking package issue)
**Impact on plan:** All auto-fixes were essential for correctness. The Prisma version change is the most significant — future phases should be aware that Prisma 7 has breaking changes not covered by the research.

## Issues Encountered

- The Laravel area names have no accent marks and different spellings from what the plan specified. Using exact names from the source to ensure Laravel-parity.
- 172 shift templates seeded (not 50+ as plan estimated) — the actual data is more comprehensive with all wildcard entries included.

## Next Phase Readiness

- Database schema migrated and validated
- Seed data loaded and verified by 10 integration tests
- Prisma singleton ready for auth and UI work
- All base utilities (formatting, area constants) in place
- Plan 02 (auth + login page) can proceed immediately

---
*Phase: 01-fundaci-n*
*Completed: 2026-03-24*
