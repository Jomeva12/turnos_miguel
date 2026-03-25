# Stack Research

**Domain:** Shift management system (employee scheduling, dark mode admin interface)
**Researched:** 2026-03-24
**Confidence:** MEDIUM-HIGH (core stack HIGH, auth library MEDIUM due to ecosystem flux)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.x | Full-stack React framework | App Router is stable, Server Actions eliminate separate API layer for this single-admin app. Output: "standalone" pairs cleanly with Docker. |
| Prisma ORM | 6.x (6.2+) | Database access layer | Confirmed compatible with Next.js 15 App Router and Server Actions. Type-safe queries map directly to shift/employee models. Migrations included. |
| PostgreSQL | 16.x | Primary database | Already decided. Handles complex scheduling queries (date ranges, aggregations for coverage) better than MySQL for this workload. |
| Tailwind CSS | 4.x | Utility-first styling | v4 removes tailwind.config.js — pure CSS config. Direct dark mode via CSS variables, no `darkMode: "class"` setting needed. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.x | Date arithmetic, month grids, formatting | All shift date calculations. v4 adds first-class time zone support via `@date-fns/tz`. Modular — tree-shakes to <10KB for typical usage. Use for: generating month calendars, checking day-of-week, date ranges for vacations. |
| date-fns/locale (es) | (bundled) | Spanish locale for day/month names | Required for "lunes/martes" headers and "enero/febrero" month labels in the schedule table. |
| shadcn/ui | latest CLI | Headless component collection | Fully compatible with Next.js 15 + React 19 + Tailwind v4 as of late 2024. Copy-owns components into the project — no version lock. Provides: Table, Dialog, Sheet (slide-over panel), Badge, Select, Button, Calendar. |
| TanStack Table | 8.x | Headless table engine | Powers shadcn's DataTable. Handles 30 employees × 31 days (930 cells) with sorting/filtering. Required for the main schedule grid with custom cell renderers per shift type. |
| next-themes | 0.4.x | Dark/light mode toggle | Standard for Next.js. Works via `data-theme` attribute to avoid hydration flash in App Router. Use `attribute="data-theme"` with Tailwind v4. |
| ExcelJS | 4.x | Server-side .xlsx export | Preferred over SheetJS/xlsx because: (1) SheetJS stopped publishing to npm registry at v0.18.5 — public npm version is 2+ years old with a high-severity CVE; (2) ExcelJS is actively maintained, supports streaming writes, cell styling (bold headers, colored rows by shift type), and runs cleanly in Next.js Route Handlers. |
| better-auth | latest | Authentication (email+password) | Replaces NextAuth v5 (still beta as of 2026, no stable release timeline). better-auth is TypeScript-first, has credentials auth built-in without quirks, includes rate limiting and scrypt hashing by default. The Auth.js project itself is now merging into Better Auth. For a single-admin system this is the simplest secure path. |
| @better-auth/prisma | latest | Better Auth Prisma adapter | Connects auth sessions/users to the existing Prisma/PostgreSQL setup. |
| Zod | 3.x | Schema validation | Stable v3 — Zod v4 was in development as of research date, stick with v3. Validates shift templates, novedad forms, and employee config before Server Actions persist data. |
| react-hook-form | 7.x | Client-side form state | Pairs with Zod via `@hookform/resolvers`. Used for the shift edit modal and employee skills configuration forms. |
| @hookform/resolvers | 3.x | Zod ↔ RHF bridge | Required to wire Zod schemas into react-hook-form validation. |
| lucide-react | latest | Icon set | Ships with shadcn/ui. Covers all needed icons: calendar, user, clock, download, edit. |
| clsx + tailwind-merge | latest | Conditional class merging | Ships with shadcn/ui setup. Essential for dynamic cell coloring (shift type, Sunday highlight, current day marker). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Prisma CLI | Schema management, migrations | `npx prisma migrate dev` locally; `npx prisma migrate deploy` in Docker entrypoint |
| Docker (multi-stage) | Production container | Three-stage: deps → builder → runner (Alpine). Requires `output: "standalone"` in next.config.ts. Final image ~150MB. |
| EasyPanel | Container orchestration host | Existing infrastructure. Deploy via Dockerfile mode (not Nixpacks) for full control over build stages. |
| TypeScript | 5.x | Type safety | Already included in Next.js. Define strict types for Shift, Employee, Area, Novedad — they feed the algorithm logic. |

## Installation

```bash
# Core (already in project)
npm install next react react-dom

# Database
npm install prisma @prisma/client
npx prisma init

# Auth
npm install better-auth @better-auth/prisma

# UI
npx shadcn@latest init
npx shadcn@latest add table dialog sheet badge select button calendar

# Date handling
npm install date-fns @date-fns/tz

# Tables
npm install @tanstack/react-table

# Forms
npm install react-hook-form zod @hookform/resolvers

# Excel export
npm install exceljs

# Dark mode
npm install next-themes

# Utilities (likely added by shadcn init already)
npm install clsx tailwind-merge lucide-react
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| ExcelJS | SheetJS/xlsx | Only if you need to PARSE uploaded Excel files (SheetJS excels at reading). For write-only export, ExcelJS is safer due to npm CVE issue. |
| better-auth | NextAuth v5 (Auth.js beta) | If the project already has NextAuth v4 configured and migration cost is high. For greenfield, better-auth is the better call in 2026. |
| better-auth | Lucia auth | Lucia v3 moved to a "reference implementation" model — not a full library anymore. Avoid for new projects. |
| date-fns | Luxon | If working with many time zones (Luxon is better there). This system is single-location, no TZ complexity — date-fns v4 is sufficient and smaller. |
| date-fns | Day.js | Day.js has plugin sprawl for locale support; date-fns has it built-in via tree-shakeable imports. |
| shadcn/ui | Radix UI (direct) | Only if you need unstyled primitives and will build all styles from scratch. shadcn gives you Radix + opinionated Tailwind defaults you can own. |
| TanStack Table | react-table (v7) | Never — v7 is deprecated. TanStack Table IS the new react-table. |
| next-themes | Manual CSS variable toggle | Only if you need more granular control than next-themes provides. For 99% of cases, next-themes is sufficient. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| SheetJS/xlsx from npm registry | The public npm package is frozen at v0.18.5, which has a high-severity CVE. SheetJS moved to their own CDN/registry. Do not `npm install xlsx`. | ExcelJS for write; SheetJS Pro CDN if you need SheetJS specifically |
| Moment.js | Deprecated by maintainers since 2020. 67KB gzipped, mutable API, no tree-shaking. | date-fns v4 |
| NextAuth v4 (stable) | Not compatible with Next.js 15 App Router patterns. Requires v5 beta. | better-auth |
| NextAuth v5 (beta) | Still beta in 2026 with no stable release timeline confirmed. API has changed multiple times. | better-auth |
| Lucia auth v3 | Maintainers explicitly changed it to a "reference implementation" — not meant as a production library anymore. | better-auth |
| Material UI / Ant Design | These ship full component CSS that conflicts badly with Tailwind. Dark mode requires separate theme configuration, not CSS variables. | shadcn/ui (Radix + Tailwind) |
| FullCalendar | Heavyweight (200KB+) drag-and-drop calendar — this system needs a custom data grid, not a calendar widget. FullCalendar's table model doesn't fit the employees-vs-days matrix. | TanStack Table + custom cells |
| react-big-calendar | Same issue as FullCalendar — event-based calendar, not a schedule grid. | TanStack Table |
| Prisma v5 | v6 has breaking changes; if the project already initialized with v5, migrate before going further. v6 is required for the `@prisma/adapter-pg` direct connection mode needed for Docker. | Prisma v6 |

## Stack Patterns by Variant

**For the main schedule grid (30 employees × 31 days):**
- Use TanStack Table with `getCoreRowModel` only (no pagination — all employees visible)
- Virtualize with `@tanstack/react-virtual` if performance degrades (unlikely at 30 rows)
- Custom `cell` renderers for: shift badge, rest day, novedad overlay, Sunday highlight

**For the Excel export:**
- Use a Next.js Route Handler (`app/api/export/route.ts`) returning a `Response` with `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- ExcelJS writes to a Buffer in memory, buffer passed directly to Response
- Do NOT use Server Actions for file downloads — Route Handlers are the correct primitive

**For the coverage timeline view (6:00–22:00 horizontal):**
- This is a custom visualization, not a table — build with CSS Grid or flexbox directly
- No need for a chart library; it's essentially a Gantt-like bar per employee per area

**For Docker + EasyPanel:**
- Use `output: "standalone"` in `next.config.ts`
- Run `prisma migrate deploy` in `docker-entrypoint.sh` before starting the Next.js server
- Set `DATABASE_URL` and `BETTER_AUTH_SECRET` as EasyPanel environment variables, never in Dockerfile

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 15.x | React 19 | shadcn/ui CLI handles the `--legacy-peer-deps` flag automatically on npm |
| Tailwind CSS 4.x | Next.js 15.x | No `tailwind.config.js` needed; configure via `@import "tailwindcss"` in globals.css |
| Prisma 6.x | Next.js 15 Server Actions | Confirmed compatible. Use a singleton pattern for PrismaClient in dev to avoid hot-reload exhaustion |
| better-auth latest | Prisma 6.x | Via `@better-auth/prisma` adapter |
| date-fns 4.x | Any | The `@date-fns/tz` package is a peer dependency for timezone support; install separately if needed |
| ExcelJS 4.x | Node.js 18+ | Requires Node.js runtime (server-side only). Do not import in Client Components. |
| shadcn/ui | TanStack Table 8.x | shadcn's DataTable docs target TanStack Table v8; do not mix with v7 |

## Sources

- WebSearch (multiple sources) — Auth.js/better-auth ecosystem status 2026: MEDIUM confidence (community posts, no single authoritative benchmark)
- [ExcelJS npm](https://www.npmjs.com/package/exceljs) — Active maintenance confirmed
- [SheetJS CVE warning](https://thelinuxcode.com/npm-sheetjs-xlsx-in-2026-safe-installation-secure-parsing-and-real-world-nodejs-patterns/) — npm registry version has high-severity CVE: HIGH confidence
- [shadcn/ui React 19 + Next.js 15](https://ui.shadcn.com/docs/react-19) — Official shadcn docs: HIGH confidence
- [Prisma + Next.js 15](https://www.prisma.io/nextjs) — Official Prisma docs: HIGH confidence
- [date-fns v4 release](https://date-fns.org/) — First-class TZ support in v4: HIGH confidence
- [Better Auth vs NextAuth 2026](https://betterstack.com/community/guides/scaling-nodejs/better-auth-vs-nextauth-authjs-vs-autho/) — Community comparison: MEDIUM confidence
- [Next.js standalone Docker](https://nextjs.org/docs/app/getting-started/deploying) — Official Next.js deploy docs: HIGH confidence
- [EasyPanel Next.js quickstart](https://easypanel.io/docs/quickstarts/nextjs) — Official EasyPanel docs: HIGH confidence

---
*Stack research for: GestionTurnos v2.0 — Next.js shift management system*
*Researched: 2026-03-24*
