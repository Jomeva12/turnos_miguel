# Pitfalls Research

**Domain:** Shift management system — Laravel-to-Next.js migration
**Researched:** 2026-03-24
**Confidence:** HIGH (domain-specific; verified against official docs and community post-mortems)

---

## Critical Pitfalls

### Pitfall 1: Undocumented Business Logic Lost in Translation

**What goes wrong:**
The scheduling algorithm in the Laravel system encodes rules that were never written down: what happens when an employee's vacation overlaps a zona crítica day, which area gets priority when two understaffed areas compete for the same employee, how comodines are assigned if all qualified employees are already assigned. These edge cases exist as implicit behavior in PHP code. During a rewrite, developers implement the obvious rules and miss the silent ones. The new system produces different (wrong) output for edge cases that the admin only notices after a week of use.

**Why it happens:**
Rewrites focus on "what the system does" from the UI perspective. Business logic accumulated over months of production tweaks lives in controller methods, private helpers, and database query ordering — none of it documented. The rewrite team never reads the full Laravel source; they read the spec.

**How to avoid:**
Before writing a single line of Next.js scheduling code, extract and document every rule from the Laravel source. Run both systems side-by-side on the same month and diff the output. Write the algorithm as pure TypeScript functions first (no Prisma, no HTTP) with explicit unit tests for each documented rule — descansos, zona crítica exclusion, rotación, turnos partidos, cobertura mínima per área, Marking/Varely area day restrictions. Only wire it to the database after all unit tests pass against known-good Laravel output.

**Warning signs:**
- The algorithm "mostly works" but occasionally puts two employees on descanso the same day in Buffet
- Admin manually corrects the same type of shift every month
- Output differs from Laravel for months with 5 Sundays or months that start on Saturday

**Phase to address:**
Phase: Scheduling Algorithm — must precede any UI work that depends on generation output.

---

### Pitfall 2: Client/Server Component Boundary Mistake on the 30x31 Calendar Table

**What goes wrong:**
The main planilla (30 employees × 31 days) is rendered as a single Client Component because it needs cell-click interactions. This forces the entire table — potentially 930 cells each containing shift details — to hydrate on the client before it becomes interactive. Initial load is slow, Time To Interactive is high, and the JavaScript bundle bloats.

**Why it happens:**
Developers reach for `"use client"` at the parent level because "the table is interactive." They don't isolate interactions to leaf components. The result is a massive component tree sent to the browser that should have been server-rendered.

**How to avoid:**
Render the table shell, employee names, and day headers as Server Components. Mark only the individual cell or the modal trigger as `"use client"`. Use a pattern where the row data comes from a Server Component and each cell is a thin Client wrapper only when it contains the edit button. For the initial load, server-render the full table; interactions trigger Server Actions or route handlers, not full client state re-renders of the entire grid.

**Warning signs:**
- The table takes > 2 seconds to become interactive on first load
- The JavaScript bundle includes Prisma types or full shift objects serialized to the client
- Lighthouse TTI score is poor on the planilla route

**Phase to address:**
Phase: Planilla UI — architecture decision must be locked before component implementation begins.

---

### Pitfall 3: Prisma Connection Pool Exhaustion from Hot Reload

**What goes wrong:**
During development, Next.js hot-reloads modules on file changes. Each hot reload creates a new `PrismaClient` instance and a new connection pool. PostgreSQL has a default connection limit (usually 100). After ~20-30 hot reloads, the database refuses new connections with `FATAL: sorry, too many clients already`. This kills development velocity and is mistaken for an unrelated bug.

**Why it happens:**
Developers initialize `new PrismaClient()` at module level in `lib/db.ts` without a singleton guard. The first time they hit this, they restart the dev server to fix it, never diagnosing the root cause.

**How to avoid:**
Use the documented singleton pattern from day one:
```typescript
// lib/db.ts
import { PrismaClient } from "@prisma/client"
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```
This must be in place before the first API route is written. Do not skip it "for now."

**Warning signs:**
- `FATAL: sorry, too many clients already` after an active development session
- `Can't reach database server` errors that resolve after restarting dev server
- PostgreSQL `pg_stat_activity` shows dozens of idle connections from 127.0.0.1

**Phase to address:**
Phase: Project Setup / Database Layer — must be the first thing established before any data access code.

---

### Pitfall 4: Date Timezone Off-by-One in Monthly Schedule Generation

**What goes wrong:**
The schedule operates on a Colombian timezone (America/Bogota, UTC-5). When the algorithm runs at midnight or early morning, `new Date()` returns UTC, which maps to the previous calendar day in Bogota. The algorithm generates shifts for the wrong day. A shift created for "March 1" lands on "February 28" in the database. This is invisible in dev (developer is in same timezone) but surfaces in production.

**Why it happens:**
JavaScript `Date` operates in UTC. Developers test locally with their machine clock in UTC-5 or UTC-6 and never see the error. The Laravel system was running on a server configured to `America/Bogota` so PHP's `date()` always returned local time. The Next.js rewrite never sets a timezone and uses UTC throughout.

**How to avoid:**
Use `date-fns-tz` or the native `Intl` API for all date construction in the scheduling algorithm. Store all dates as UTC in PostgreSQL but convert to/from `America/Bogota` at every read/write boundary. Write an explicit utility: `toBogoTime(date: Date): Date` used everywhere in the algorithm. Set `TZ=America/Bogota` in the Docker container to eliminate ambiguity. Add a test that generates a schedule at `23:55 UTC` (18:55 Bogota) and verifies all dates are still the correct calendar day.

**Warning signs:**
- Shifts appear on day N-1 for the first few days of a month
- The generation log shows correct dates but the calendar display is off by one
- Tests pass locally but fail in CI (CI runs in UTC)

**Phase to address:**
Phase: Scheduling Algorithm — timezone handling must be established as a foundational utility before date math begins.

---

### Pitfall 5: Sticky Header Breaks Because of Overflow Container Nesting

**What goes wrong:**
The planilla table needs both a sticky first column (employee names) and a sticky header row (day numbers). Implementing `position: sticky` on `<th>` fails silently when any ancestor element has `overflow: hidden`, `overflow: auto`, or `overflow: scroll`. The headers scroll away with the content as if `sticky` were not set. This is notoriously difficult to debug because the CSS looks correct.

**Why it happens:**
The page layout uses `overflow: hidden` on a wrapper for rounded corners or to clip glassmorphism gradients. Developers add `position: sticky` to table headers and it doesn't work. They add `z-index` values thinking that's the issue. The real problem (overflow on a parent) is never found because it doesn't show up in the DevTools computed styles of the sticky element itself.

**How to avoid:**
The scrollable container must be a direct ancestor with `overflow-x: auto` and NO `overflow: hidden` anywhere between it and the sticky elements. Use a dedicated scroll wrapper `<div class="overflow-x-auto">` wrapping only the `<table>`. Apply glassmorphism/rounded corners only to elements outside this scroll wrapper. Set explicit `background-color` on all sticky `<th>` elements (transparent sticky cells show content scrolling underneath). Use z-index: `thead th { z-index: 10 }`, `td:first-child { z-index: 5 }`, corner cell `{ z-index: 15 }`.

**Warning signs:**
- `position: sticky` is set but header scrolls with content
- Adding `z-index` does not fix the issue
- The problem only appears when both overflow-x and overflow-y scrolling are active simultaneously

**Phase to address:**
Phase: Planilla UI — must be addressed during the table layout prototype, before adding data.

---

### Pitfall 6: Split Shift Format (`|`) Parsing Not Enforced Consistently

**What goes wrong:**
Turnos partidos are stored as `"7:00-11:00|11:30-14:30"`. Multiple places in the codebase parse this string: the calendar cell renderer, the coverage timeline (6:00-22:00 horizontal bar), the Excel export, the generation log, and the total-hours calculator. Each component implements its own string splitting logic slightly differently. When a comodin or manually assigned shift uses a slightly different format (`"7:00-11:00 | 11:30-14:30"` with spaces, or `"07:00-11:00|11:30-14:30"` with zero-padded hours), some renderers work and others silently show nothing.

**Why it happens:**
There is no canonical parser function. The format seems simple enough to inline. Three developers implement it three ways over four weeks. Edge cases (spaces around pipe, zero-padded times, single-segment shifts that look like split shifts) are never tested.

**How to avoid:**
Create a single `parseShift(raw: string): ShiftSegment[]` function in `lib/shifts.ts` on day one of shift-related work. Define `ShiftSegment = { start: string; end: string }`. All rendering, exporting, and calculation code calls this function. Write unit tests covering: single segment, split segment, spaces around pipe, zero-padded hours, empty string, null. Never parse the pipe format inline anywhere.

**Warning signs:**
- Coverage timeline shows employee working when calendar shows descanso
- Excel hours total differs from what calendar displays
- Manually assigned shifts with spaces around pipe don't appear in coverage view

**Phase to address:**
Phase: Scheduling Algorithm / Data Layer — define the parser before building any UI that displays shift times.

---

### Pitfall 7: xlsx Package Vulnerability and File Generation on Wrong Side

**What goes wrong:**
The npm registry version of `xlsx` (SheetJS) is version 0.18.5, is 2+ years stale, and has a high-severity vulnerability. Projects that `npm install xlsx` get this version. Additionally, developers generate the Excel buffer on the client side (inside a React component) which blocks the UI thread for large datasets (930 cells plus headers).

**Why it happens:**
`npm install xlsx` is the top search result for Excel in Node.js. The package has 10M+ weekly downloads from the stale registry version. Developers assume npm always has the latest. Client-side generation is used because it avoids creating an API route.

**How to avoid:**
Install SheetJS from the official CDN/registry: `npm install https://cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz` or pin to a specific version from their registry. Generate the Excel file server-side in a Next.js Route Handler (`app/api/export/route.ts`), stream the response with `Content-Disposition: attachment`. Never run Excel generation in a Client Component. Return the buffer as a binary response with `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

**Warning signs:**
- `npm audit` reports high-severity vulnerability in xlsx
- Export button freezes the UI for 2-3 seconds on large datasets
- The version in `node_modules/xlsx/package.json` is 0.18.x

**Phase to address:**
Phase: Excel Export — install from correct source at the start of this phase, before writing any generation code.

---

### Pitfall 8: Spanish Locale Capitalization and Grammar in date-fns

**What goes wrong:**
The `es` locale in `date-fns` produces lowercase month names ("enero", "febrero") by default. The Laravel system displayed capitalized months ("Enero", "Febrero") in headers. The admin notices the difference but cannot articulate why the UI "looks wrong." Additionally, the Spanish locale in date-fns versions before v3 is missing the `de` preposition in long date formats (`"1 enero 2026"` instead of `"1 de enero de 2026"`), producing grammatically incorrect Spanish.

**Why it happens:**
Developers assume `format(date, 'MMMM', { locale: es })` produces the same output as the Laravel `__('months.january')` translation. It does not. The capitalization difference is subtle in headers but obvious in the generation report.

**How to avoid:**
Use `date-fns` v3+ which fixes the Spanish locale grammar. Wrap all month/day name formatting in a single utility function `formatSpanish(date, pattern)` that applies `.charAt(0).toUpperCase()` when a capitalized month is needed. Never call `format()` with `locale: es` directly throughout the codebase — all Spanish date formatting goes through the utility. Write a test asserting the output matches expected Spanish strings for all 12 months.

**Warning signs:**
- Month names in headers appear lowercase in the new system but were capitalized in Laravel
- Date display like "1 enero 2026" instead of "1 de enero de 2026"
- Date-fns locale import fails at runtime with TypeScript errors about locale code format

**Phase to address:**
Phase: Project Setup / Utilities — create the date utility before building any UI that displays dates.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Inline pipe-format parsing in each component | Faster to write | Multiple parsers diverge; edge cases break silently in some views | Never |
| `new PrismaClient()` in each file | No setup required | Connection pool exhaustion in development within hours | Never |
| `"use client"` on the entire planilla table | Simpler interactivity | Slow initial load, full client hydration of 930 cells | Never |
| Hardcoded "America/Bogota" offset (-5) instead of named timezone | Works most of the year | Breaks during DST changes (Colombia doesn't observe DST but server may) | Never — use named timezone |
| Skip unit tests for algorithm, rely on visual QA | Faster MVP | Silent regressions in edge-case months (5-Sunday months, February) | Never for scheduling logic |
| Derive total hours from string parsing at render time | Simple | Inconsistent totals when format varies; recalculates on every render | Store computed minutes in DB |
| Single-page month load (all 30 employees, 31 days, all shift data) | Simpler data fetching | If each cell has 2-3 novedades, query can return 2000+ rows | Acceptable at this scale (~30 employees) |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| SheetJS / xlsx | `npm install xlsx` from public registry | Install from `cdn.sheetjs.com` or official ProSheetJS registry |
| SheetJS in Next.js | Import at top level in a Server Component | Dynamic import inside route handler; xlsx uses Node.js Buffer API |
| PostgreSQL + Prisma | Initialize `PrismaClient` without singleton in dev | Use `globalThis` singleton pattern in `lib/db.ts` |
| date-fns Spanish locale | Use `es` locale directly for display strings | Wrap in utility; capitalize when needed; use v3+ for grammar fix |
| Docker + Next.js | Not setting `TZ` env variable | Set `TZ=America/Bogota` in `docker-compose.yml` and EasyPanel config |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full table client hydration | UI unresponsive for 2-3s after load | Server Components for rows, Client Components only for interactive cells | At page load with 30+ employees |
| N+1 query in planilla data fetch | Planilla API takes 3-5s | Use Prisma `include` to fetch employees + shifts + novedades in one query with proper joins | With 30 employees, noticeable immediately |
| Excel generation on main thread | Export button freezes UI | Route Handler on server; never in client component | With full month of 930 cells |
| Recalculating coverage on every render | Coverage timeline lags on scroll | Memoize coverage calculation; compute once per day, not per render | When scrolling through 31 days |
| Fetching entire schedule for filter operations | Filter by area rerenders everything | Filter in the database query with `where` clause, not client-side Array.filter | At 30 employees — immediate |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Session token accessible client-side | Admin session hijacking | Use HTTP-only cookies via Next.js middleware; never store auth token in localStorage |
| Unprotected generation API route | Any user can trigger schedule generation | Verify session in every Server Action and Route Handler; middleware alone is insufficient |
| Shift data in URL query params | Shift details in browser history and server logs | POST for mutations; GET only for navigation; no PII or shift content in URLs |
| Single admin account with no rate limiting | Brute-force on login | Add rate limiting to the login route; lock after N failed attempts |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading state during schedule generation | Admin clicks Generate, nothing happens, clicks again — generates twice | Disable the Generate button immediately on click; show spinner; generation must be idempotent |
| Modal closes on accidental click outside | Admin loses half-edited manual assignment | Require explicit close (X button or Cancel); do not close modal on backdrop click for edit flows |
| No diff between auto-generated and manual shifts | Admin cannot tell which cells were manually overridden | Show visual indicator (dot, border color) on manually assigned cells; already required per PROJECT.md |
| Silent failure on constraint violations | Admin assigns shift violating a rule; system accepts silently | Return validation errors from Server Action; display inline in the cell or modal |
| Sticky headers disappear on mobile because of viewport width | Admin on phone cannot use the table | Accept that the full planilla requires a desktop; add a redirect/warning for small screens |

---

## "Looks Done But Isn't" Checklist

- [ ] **Schedule generation:** Verify zona crítica (days 28-2) blocks descansos — not just for current month but for month boundary (28 Nov → 2 Dec)
- [ ] **Rotación equitativa:** Verify that mañana/tarde alternation resets correctly at month start based on previous month's last week
- [ ] **Turnos partidos:** Verify both segments appear in coverage timeline, not just the first segment
- [ ] **Novedades:** Verify that vacaciones spanning two months (e.g., March 28 – April 4) block shifts on BOTH months
- [ ] **Excel export:** Verify merged cells for employee names render correctly; verify split shift `|` displays as two lines, not a literal pipe character
- [ ] **Sticky headers:** Verify sticky behavior at all viewport widths (1280, 1440, 1920) and with both axes scrolling simultaneously
- [ ] **Date locale:** Verify month selector shows "Marzo 2026" not "marzo 2026" and navigation shows correct Spanish month names
- [ ] **Manual assignment indicator:** Verify the visual indicator persists after page reload (must be stored in DB, not component state)
- [ ] **Cobertura view:** Verify that 6:00-22:00 timeline correctly shows gaps between split shift segments
- [ ] **Comodines:** Verify that wildcard shifts appear correctly when no employee is yet assigned to them

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Algorithm logic divergence discovered post-launch | HIGH | Run both systems in parallel for 1 month; export Laravel output as golden reference; write comparison tests |
| Connection pool exhaustion in production | MEDIUM | Add `connection_limit=5` to DATABASE_URL; implement PgBouncer in EasyPanel; singleton already prevents dev issue |
| Wrong timezone in stored dates | HIGH | Data migration script to shift all timestamps by offset delta; requires downtime |
| xlsx vulnerability found after build | LOW | Replace package from correct source; regenerate lockfile; rebuild Docker image |
| Sticky header CSS broken in production but not dev | LOW | Audit all ancestor `overflow` properties; extract table into isolated component with controlled container |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Undocumented business logic lost | Phase: Scheduling Algorithm | Run both systems on 3 months of data and diff output row-by-row |
| Client component boundary mistake | Phase: Planilla UI (architecture) | Lighthouse TTI < 1.5s on first load; no Prisma types in client bundle |
| Prisma connection pool exhaustion | Phase: Project Setup | `pg_stat_activity` shows ≤ 5 connections during active dev session |
| Timezone off-by-one | Phase: Scheduling Algorithm | Test generation at 23:55 UTC; all dates match Bogota calendar day |
| Sticky header overflow failure | Phase: Planilla UI (layout prototype) | Manual test: scroll both axes simultaneously; headers stay fixed |
| Split shift format inconsistency | Phase: Data Layer / Utilities | Single parser function; zero inline pipe-splitting in codebase |
| xlsx vulnerability | Phase: Excel Export | `npm audit` shows no high-severity vulnerabilities |
| Spanish locale capitalization | Phase: Project Setup / Utilities | All month names in headers are capitalized; dates use `de` preposition |
| Feature parity regression | Phase: QA / Pre-launch | Side-by-side comparison with Laravel system on 3 months |
| No loading state on generation | Phase: Scheduling UI | Generate button disables on click; spinner visible; no duplicate generations |

---

## Sources

- [App Router pitfalls: common Next.js mistakes and practical ways to avoid them](https://imidef.com/en/2026-02-11-app-router-pitfalls) — MEDIUM confidence
- [6 React Server Component performance pitfalls in Next.js - LogRocket](https://blog.logrocket.com/react-server-components-performance-mistakes) — MEDIUM confidence
- [How to Fix 'Too Many Database Connections Opened' in Prisma with Next.js Hot Reload](https://www.timsanteford.com/posts/how-to-fix-too-many-database-connections-opened-in-prisma-with-next-js-hot-reload/) — HIGH confidence (matches Prisma official docs)
- [Prisma: Database connections documentation](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections) — HIGH confidence (official)
- [date-fns issue #674: Spanish locale doesn't capitalize months](https://github.com/date-fns/date-fns/issues/674) — HIGH confidence (official issue tracker)
- [date-fns issue #1770: Spanish locale missing preposition](https://github.com/date-fns/date-fns/issues/1770) — HIGH confidence (official issue tracker)
- [SheetJS xlsx package warning](https://docs.sheetjs.com/docs/demos/static/nextjs/) — HIGH confidence (official SheetJS docs)
- [Sticky headers with overflow: explanation](https://dev.to/jennieji/so-hard-to-make-table-header-sticky-14fj) — MEDIUM confidence
- [Migration parity pitfalls: Drupal to Laravel post-mortem](https://www.axelerant.com/blog/drupal-to-laravel-booking-platform-migration) — MEDIUM confidence
- [React sticky header and column implementation](https://muhimasri.com/blogs/react-sticky-header-column/) — MEDIUM confidence

---
*Pitfalls research for: Shift management system — Laravel-to-Next.js migration*
*Researched: 2026-03-24*
