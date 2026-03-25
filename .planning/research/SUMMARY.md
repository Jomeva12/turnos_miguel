# Project Research Summary

**Project:** GestionTurnos v2.0 — Sistema de Gestión de Turnos
**Domain:** Employee shift scheduling — retail department store (~30 employees, 7 areas)
**Researched:** 2026-03-24
**Confidence:** HIGH

## Executive Summary

GestionTurnos v2.0 is a 1:1 functional rewrite of an existing Laravel shift management system into Next.js 15 with PostgreSQL. The product is a single-admin internal tool for a retail store, not a commercial SaaS platform. The entire value of the system rests on a deterministic scheduling algorithm that encodes institutional business rules — rest day constraints, morning/afternoon rotation equity, area-specific day restrictions, split shifts, and coverage minimums per area. Industry patterns for this class of system are well-established: a data-heavy grid view backed by server rendering, with interactivity isolated to leaf components, and the scheduling algorithm isolated as a pure service layer independently testable from the HTTP layer.

The recommended approach is a Next.js 15 App Router monolith with Prisma 6 + PostgreSQL, using the RSC-shell-with-client-island pattern for the main planilla grid, Server Actions for all write operations, and a single Route Handler for XLSX export. Auth should use better-auth (NextAuth v5 is still beta with no stable release timeline as of 2026). The UI stack is shadcn/ui + TanStack Table + Tailwind v4 — all confirmed compatible with Next.js 15 + React 19. The architecture has a natural build order dictated by dependency: data layer → auth → pure algorithm service → server actions → UI.

The dominant risk is algorithm correctness: undocumented business logic exists in the current Laravel system that will be silently lost during the rewrite if not proactively extracted and validated. A secondary risk cluster covers date timezone handling (Colombia/Bogota, UTC-5), Prisma connection pool management in development, and the xlsx npm package vulnerability (public registry version has a CVE — use ExcelJS instead). None of these risks are novel or hard to mitigate — they all have established, documented solutions that must be applied at project setup, not retrofitted later.

## Key Findings

### Recommended Stack

The stack is entirely Next.js-native with no bespoke infrastructure. Next.js 15 App Router with `output: "standalone"` deploys cleanly to Docker on EasyPanel. Prisma 6 provides the data access layer with type-safe queries. Tailwind CSS v4 drops `tailwind.config.js` entirely in favor of CSS-native configuration — dark mode via CSS variables requires no `darkMode: "class"` configuration. The auth library decision is the only medium-confidence item: better-auth is recommended as a pragmatic replacement for NextAuth v5, which has been in beta since 2024 with no confirmed stable release timeline.

See full details: `.planning/research/STACK.md`

**Core technologies:**
- Next.js 15 (App Router, standalone output): full-stack framework — Server Actions eliminate a separate API layer for this single-admin app
- Prisma 6 + PostgreSQL 16: type-safe ORM with migrations — compatible with App Router Server Actions; singleton pattern required in dev
- Tailwind CSS 4 + shadcn/ui: component and utility styling — copy-owned components, no version lock, confirmed compatible with React 19
- TanStack Table 8: headless table engine — handles 930-cell grid with custom cell renderers per shift type
- ExcelJS 4: server-side XLSX export — chosen over SheetJS due to a high-severity CVE in the public npm registry version of xlsx
- better-auth + @better-auth/prisma: authentication — TypeScript-first, credentials built-in, replaces the still-beta NextAuth v5
- date-fns 4 + @date-fns/tz: date arithmetic and Spanish locale — modular, tree-shakeable, first-class timezone support in v4
- next-themes 0.4: dark/light mode toggle — `attribute="data-theme"` required for Tailwind v4 compatibility

### Expected Features

This is a replica project, not a greenfield product. All features in the v1 MVP are table stakes — the system is not useful without any of them. The differentiators below are what make it better than a generic scheduling tool. Nothing from v2+ should be attempted before the replica is stable.

See full details: `.planning/research/FEATURES.md`

**Must have — table stakes (replica parity):**
- Monthly schedule grid (employees x days) — primary interface, everything revolves around this view
- Automatic schedule generation with full business rules engine — core value proposition
- Manual shift override with manual-flag visual indicator — essential correction capability
- Employee management with area skills pivot — required by algorithm
- Shift templates + area coverage rules configuration — required by algorithm
- Absence/leave recording (vacaciones, incapacidad, permiso, calamidad, descanso) — required by algorithm
- Excel export (.xlsx) — universal sharing format; managers expect it
- Visual markers: Sundays highlighted, current day marked, manual shifts flagged — scan-ability
- Authentication (email+password, single admin) — gateway to everything
- Generation log / bitácora (info/warning/error badges) — trust in auto-generation
- Timeline/coverage view (horizontal Gantt 6:00-22:00 by area) — coverage gap verification

**Should have — differentiators:**
- Domain-specific rest rules (4/month, no Sat, no days 28-2, zona crítica boundary crossing) — eliminates #1 manual error
- Split shift support with pipe format (`07:00-11:00|11:30-14:30`) — enables multi-block coverage patterns
- Area-specific day restrictions (Marking Mar/Jue only, Varely Camacho Mié only, Buffet no domingo) — encodes institutional knowledge
- Morning/afternoon rotation equity tracking across months — fairness rule
- Wildcard (comodin) shifts by weekday — handles unplanned coverage needs
- Day summary panel and employee profile sidebar — quick verification tools
- Filters by area and absence type — navigation in large grid
- Month clear (limpiar turnos y novedades) — reset capability

**Defer to v2+:**
- Employee self-service portal — requires multi-user auth, out of current scope
- Multi-almacen / multi-tenant support — requires tenancy architecture redesign
- Payroll/ERP integration — blocked by external dependencies
- AI/demand-based scheduling — deterministic rules engine is the correct approach here

### Architecture Approach

The system uses a standard Next.js 15 layered architecture with a hard separation between the HTTP boundary (Server Actions in `lib/actions/`), pure business logic (`lib/services/`), and data access (`lib/db/` Prisma queries). The main planilla page follows the RSC-shell-with-client-island pattern: an async Server Component fetches all month data server-side and passes it as props to `PlanillaGrid`, a Client Component that owns all interactivity. This avoids the anti-pattern of fetching data inside a client component via `useEffect`. The only Route Handler in the system is `app/api/export/route.ts` for XLSX download — all other mutations go through Server Actions. No global state library is needed; `useState` + `useOptimistic` + `revalidatePath` handles the full state lifecycle.

See full details: `.planning/research/ARCHITECTURE.md`

**Major components:**
1. `lib/services/generation.ts` — pure TypeScript scheduling algorithm with zero framework dependencies; independently unit-testable
2. `components/planilla/PlanillaGrid.tsx` — Client Component owning the interactive 30x31 grid; receives all data as props from RSC shell
3. `lib/actions/shifts.ts / absences.ts / generation.ts` — Server Actions handling auth check, data fetch, service call, and `revalidatePath`
4. `lib/db/` — Prisma query layer; actions never call Prisma directly, always through this layer
5. `app/api/export/route.ts` — Route Handler streaming XLSX binary response; the only legitimate API route in the app
6. `components/planilla/TimelineCobertura.tsx` — custom CSS Grid Gantt visualization (6:00-22:00); no chart library required

### Critical Pitfalls

See full details: `.planning/research/PITFALLS.md`

1. **Undocumented algorithm logic lost in translation** — Extract every rule from the Laravel source before writing a single line of Next.js scheduling code. Run both systems on the same months and diff output row-by-row. Unit test each rule against known-good Laravel output before wiring to the database.
2. **Timezone off-by-one in generation** — Use `@date-fns/tz` for all date construction; set `TZ=America/Bogota` in Docker; create a single `toBogoTime()` utility used everywhere in the algorithm. Test generation at 23:55 UTC.
3. **Prisma connection pool exhaustion from hot reload** — Use the `globalThis` singleton pattern in `lib/db.ts` from day one. Never initialize `new PrismaClient()` at module level outside the singleton guard.
4. **Split shift format inconsistency** — Create a single canonical `parseShift(raw: string): ShiftSegment[]` function in `lib/shifts.ts` before building any UI that displays shift times. No inline pipe-splitting anywhere in the codebase.
5. **`"use client"` on the entire planilla table** — The table shell, employee rows, and day headers must be Server Components. Only individual interactive cells and modal triggers get `"use client"`. Full table client hydration of 930 cells is a preventable performance trap.
6. **xlsx npm CVE** — Never `npm install xlsx` from the public registry (frozen at v0.18.5, high-severity CVE). Use ExcelJS instead, generated server-side in the Route Handler only.
7. **Sticky header broken by overflow ancestor** — The scroll container wrapping the table must have `overflow-x: auto` with no `overflow: hidden` on any ancestor between it and `<th>`. Set explicit `background-color` on all sticky elements.
8. **Spanish locale capitalization** — Wrap all `date-fns` Spanish formatting in a single `formatSpanish()` utility that capitalizes month names. Use date-fns v3+ for grammatically correct `de` preposition in long dates.

## Implications for Roadmap

Based on research, the natural build order is dictated by hard dependency chains from the architecture research and the pitfall-to-phase mapping from the pitfalls research. The algorithm is the riskiest and most foundational component — it should be built and validated before any UI that depends on it.

### Phase 1: Foundation and Data Layer

**Rationale:** Everything else depends on the database schema and auth. Prisma schema, migrations, seed data (30 employees, 7 areas, shift templates), and the Prisma singleton pattern must be established before any other code is written. The Docker/EasyPanel deployment baseline should also be proven here to avoid environment surprises later. Auth gate protects all subsequent routes.

**Delivers:** Running Next.js app in Docker on EasyPanel with PostgreSQL, protected admin login, seeded reference data, and verified Prisma singleton (no connection pool exhaustion).

**Addresses features:** Authentication, employee data model, area skills pivot, shift templates, area coverage rules configuration.

**Avoids pitfalls:** Prisma connection pool exhaustion (singleton from day one), timezone setup (TZ=America/Bogota in Docker from day one), Spanish locale utility (formatSpanish() defined before any UI).

**Research flag:** Standard patterns — skip phase research.

### Phase 2: Scheduling Algorithm Service

**Rationale:** The algorithm is the highest-risk component and the only part of the system with no established library solution. It must be built as pure TypeScript, tested against extracted Laravel output, and fully validated before any UI depends on it. Building it first means UI phases can proceed with confidence in the underlying data. The pitfalls research identifies this as the most expensive failure mode if deferred.

**Delivers:** `lib/services/generation.ts` producing correct monthly shift assignments for all documented business rules, with unit tests covering: 4 rest days/month, no-Sat rest, no-days-28-2 (zona crítica), morning/afternoon rotation equity, split shifts, area-specific day restrictions, comodin shifts, absence exclusion, month-boundary zona crítica (Nov 28 → Dec 2).

**Addresses features:** Automatic schedule generation, all domain-specific business rules, split shift format canonical parser.

**Avoids pitfalls:** Undocumented logic loss (extracted and tested against Laravel), timezone off-by-one (all date math uses `toBogoTime()` utility), split shift format inconsistency (canonical parser defined in this phase).

**Research flag:** This phase needs careful extraction work from the existing Laravel source — not standard research, but side-by-side diff validation.

### Phase 3: Core Planilla UI

**Rationale:** With the data layer and algorithm validated, the main grid can be built with confidence in the data contract. The RSC-shell-with-client-island architecture decision must be locked at the start of this phase to prevent the client-hydration anti-pattern. The sticky header layout prototype should be built and manually tested before adding data, as per the pitfall research.

**Delivers:** `app/planilla/page.tsx` (RSC shell) + `PlanillaGrid` (Client Component) displaying shifts for the current month with month navigation, visual markers (Sundays highlighted, current day, manual shift indicator), and the manual shift override modal.

**Addresses features:** Monthly schedule grid, month navigation, manual shift override, visual markers, generation trigger, generation log/bitácora.

**Avoids pitfalls:** `"use client"` boundary mistake (architecture decision locked before implementation), sticky header overflow failure (layout prototype tested first), UX pitfall of no loading state on generation (Generate button disabled on click with spinner).

**Research flag:** Standard Next.js App Router patterns — skip phase research.

### Phase 4: Absence Management and Coverage Views

**Rationale:** Absence recording affects generation output and must be in place for the algorithm to produce correct results in real use. The timeline/coverage view (Gantt 6:00-22:00) is architecturally independent from the grid but requires both the algorithm output and area coverage rules — both established in earlier phases.

**Delivers:** `app/novedades/page.tsx` for absence/leave CRUD (vacaciones date ranges, incapacidad, permiso, calamidad, descanso), grid cells reflecting absence types, `TimelineCobertura` horizontal coverage view, `CoberturaSidebar` day summary panel, and employee profile sidebar.

**Addresses features:** Absence/leave recording, timeline/coverage view (6:00-22:00 by area), day summary panel, employee profile panel, filters by area and absence type.

**Avoids pitfalls:** Novedades spanning month boundaries (test March 28 – April 4 vacation blocks shifts in both months), both split shift segments visible in timeline (not just first), coverage calculation memoized (not recalculated per render).

**Research flag:** Standard patterns — skip phase research. The Gantt visualization is custom CSS Grid, no library needed.

### Phase 5: Excel Export and Polish

**Rationale:** Excel export is a standalone deliverable with no dependencies on the UI phases beyond the underlying data. It belongs last because it reuses the same `lib/db/` query layer already built in Phase 1 and the shift data structure established in Phase 2. Polish items (filters, month clear, comodin edge cases) round out parity.

**Delivers:** `app/api/export/route.ts` producing formatted .xlsx with merged employee name cells, colored rows by shift type, split shifts as two lines (not literal pipe), month clear functionality, and filters by area/absence type.

**Addresses features:** Excel export, month clear, filters by area and absence type, comodin wildcard shifts.

**Avoids pitfalls:** xlsx CVE (uses ExcelJS from day one, never xlsx from public npm registry), Excel generation on wrong side (server-only Route Handler, never client-side), split shift pipe rendered as two lines (canonical parser reused from Phase 2).

**Research flag:** Standard patterns — skip phase research. ExcelJS API is well-documented.

### Phase Ordering Rationale

- Phase 1 before everything: Prisma schema is the shared contract. Without it, no other phase can proceed.
- Phase 2 before Phase 3: The algorithm is the highest risk item; validating it before building UI prevents discovering it's wrong after the UI is complete and expectations are set.
- Phase 3 before Phase 4: Absence cells in the grid are a UI concern; the grid must exist before the absence display is meaningful.
- Phase 5 last: Export is a read-only rendering of already-existing data; no other phase depends on it; sequencing it last minimizes schedule risk.
- Pitfall prevention is front-loaded: The Prisma singleton, TZ environment variable, canonical shift parser, and Spanish locale utility are all established in Phases 1-2, before any UI phase has a chance to duplicate or contradict them.

### Research Flags

Phases needing deeper research during planning:

- **Phase 2 (Scheduling Algorithm):** Not a research question — a knowledge extraction question. The existing Laravel source must be audited for undocumented rules before the algorithm is written. This is the only phase where the risk is "we don't know what we don't know."

Phases with standard patterns (skip research-phase):

- **Phase 1 (Foundation):** Next.js + Prisma + Docker deployment is well-documented. EasyPanel has an official Next.js quickstart. Patterns are standard.
- **Phase 3 (Planilla UI):** RSC-shell-with-client-island is a documented Next.js pattern. TanStack Table v8 + shadcn DataTable has official docs. Sticky headers are a known CSS issue with a known fix.
- **Phase 4 (Absences + Coverage):** Absence CRUD is standard Prisma + Server Actions. Gantt visualization is custom CSS Grid with no library dependencies.
- **Phase 5 (Export + Polish):** ExcelJS Route Handler is a documented pattern. Filters are standard Prisma `where` clause work.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core stack (Next.js 15, Prisma 6, PostgreSQL 16, Tailwind 4, shadcn/ui) verified against official docs. Only exception: better-auth vs NextAuth ecosystem is MEDIUM — community consensus from multiple sources, no single authoritative benchmark. |
| Features | HIGH | This is a replica of a production system. Feature landscape is known. Industry research confirms all features align with standard scheduling tool expectations. |
| Architecture | HIGH | Next.js 15 App Router patterns verified against official Next.js docs, Prisma official docs, and React 19 official docs. RSC + Server Actions + useOptimistic pattern is current best practice. |
| Pitfalls | HIGH | Most pitfalls have HIGH-confidence sources: Prisma singleton from official Prisma docs, SheetJS CVE from official SheetJS docs, date-fns locale from official GitHub issues, TZ handling from documented Docker best practices. |

**Overall confidence:** HIGH

### Gaps to Address

- **Exact Laravel business rules for edge cases:** The zona crítica boundary crossing (Nov 28 → Dec 2), the tie-breaking logic when two areas compete for the same understaffed employee, and the comodin assignment order are not documented anywhere. These must be extracted from the Laravel source code in Phase 2 before the algorithm is written.
- **better-auth session configuration details:** The exact better-auth configuration for HTTP-only cookie sessions with the Prisma adapter has medium-confidence sources. The implementation details should be verified against the official better-auth docs at the start of Phase 1.
- **Split shift total-hours computation:** The research flags a potential issue with computing total hours from the pipe format at render time vs. storing pre-computed minutes in the database. The correct approach (store computed minutes) is identified but the Prisma schema column needs to be designed accordingly in Phase 1.

## Sources

### Primary (HIGH confidence)

- [Next.js App Router — Data Fetching](https://nextjs.org/docs/app/getting-started/fetching-data) — RSC patterns, Server Actions
- [Next.js App Router — Mutating Data](https://nextjs.org/docs/app/getting-started/mutating-data) — Server Action mutation patterns
- [Next.js standalone Docker deploy](https://nextjs.org/docs/app/getting-started/deploying) — `output: "standalone"` configuration
- [Prisma + Next.js](https://www.prisma.io/nextjs) — Prisma 6 + App Router compatibility
- [Prisma database connections docs](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections) — singleton pattern
- [shadcn/ui React 19 + Next.js 15](https://ui.shadcn.com/docs/react-19) — compatibility confirmation
- [date-fns v4 release notes](https://date-fns.org/) — TZ support
- [date-fns GitHub issue #674](https://github.com/date-fns/date-fns/issues/674) — Spanish locale capitalization
- [date-fns GitHub issue #1770](https://github.com/date-fns/date-fns/issues/1770) — Spanish locale grammar
- [ExcelJS npm](https://www.npmjs.com/package/exceljs) — active maintenance confirmed
- [SheetJS CVE warning](https://thelinuxcode.com/npm-sheetjs-xlsx-in-2026-safe-installation-secure-parsing-and-real-world-nodejs-patterns/) — public registry version CVE
- [EasyPanel Next.js quickstart](https://easypanel.io/docs/quickstarts/nextjs) — Docker deploy patterns
- [useOptimistic — React docs](https://react.dev/reference/react/useOptimistic) — optimistic UI pattern

### Secondary (MEDIUM confidence)

- [Better Auth vs NextAuth 2026 — BetterStack](https://betterstack.com/community/guides/scaling-nodejs/better-auth-vs-nextauth-authjs-vs-autho/) — auth library comparison
- [Server Actions vs Route Handlers — MakerKit](https://makerkit.dev/blog/tutorials/server-actions-vs-route-handlers) — mutation pattern guidance
- [App Router pitfalls — imidef.com](https://imidef.com/en/2026-02-11-app-router-pitfalls) — client component boundary mistakes
- [6 RSC performance mistakes — LogRocket](https://blog.logrocket.com/react-server-components-performance-mistakes) — hydration anti-patterns
- [Sticky header with overflow fix](https://dev.to/jennieji/so-hard-to-make-table-header-sticky-14fj) — CSS sticky header debugging
- [Laravel-to-Next.js migration post-mortem — Axelerant](https://www.axelerant.com/blog/drupal-to-laravel-booking-platform-migration) — undocumented logic risk

### Tertiary (LOW confidence / context only)

- [SelectHub employee scheduling features](https://www.selecthub.com/employee-scheduling/employee-scheduling-software-requirements/) — industry feature standard
- [Workforce.com retail scheduling](https://workforce.com/buyers-guides/employee-scheduling-software-retail) — retail-specific features
- [Timefold constraint programming](https://timefold.ai/model/employee-shift-scheduling) — algorithm structure reference

---
*Research completed: 2026-03-24*
*Ready for roadmap: yes*
