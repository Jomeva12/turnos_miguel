# Phase 1: Fundación - Research

**Researched:** 2026-03-24
**Domain:** Next.js 15 App Router — Auth, Docker deploy, Prisma schema, seed data, skills UI
**Confidence:** HIGH (stack fully verified in project research; better-auth MEDIUM)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Login y credenciales**
- Glassmorphism mejorado con componentes shadcn/ui sobre fondo oscuro (no réplica pixel-perfect del Laravel, pero mismo concepto visual)
- Credenciales admin por defecto: yuli@diferencialdx.com / 3176890957a (vía seeder)
- Branding visible: "GestionTurnos v2.0" en login y navbar
- Sesión expirada: redirect silencioso al login, sin toast ni mensaje

**Datos semilla**
- Nombres reales de los ~30 empleados, extraídos del EmployeeSeeder del repo Laravel (https://github.com/Jomeva12/yuli_turnos.git, rama main)
- Las 7 áreas cargadas del seeder, fijas y no editables desde la app: General, Buffet, Cosmético, Domicilios, Electrodoméstico, Marking, Varely Camacho
- Plantillas de turno exactas de datos_proyecto.md: todos los horarios por día de la semana y por área, incluyendo comodines
- Asignaciones empleado-área: en blanco por defecto. La admin las asigna manualmente desde la UI
- Empleados fijos del seeder — no se agregan ni eliminan desde la app

**UI de habilidades (empleado-área)**
- Layout réplica del Laravel: tabla con lista de empleados y 7 columnas de checkboxes (una por área)
- Toggle instantáneo sin recarga de página (Server Action + revalidación)
- Feedback visual: solo cambio de color del checkbox (verde/gris), sin toast ni notificación
- Empleado sin ninguna área asignada: fila con warning visual sutil (borde amarillo o badge ⚠️)
- Orden de empleados: alfabético por nombre (A-Z)

**Navbar y layout shell**
- Réplica de la estructura del Laravel: navbar superior con logo "GestionTurnos v2.0" a la izquierda, links de navegación al centro, "Cerrar Sesión" a la derecha
- Links: Planilla | Habilidades | Asignación Manual
- Solo desktop — sin optimización responsive ni hamburger menu
- Colores de badges de área: mismos colores que el sistema Laravel actual (extraer del código fuente)

### Claude's Discretion
- Componentes shadcn/ui específicos para la página de login (Card, Input, Button, etc.)
- Estructura exacta de archivos/carpetas dentro de app/
- Configuración de better-auth y middleware de protección de rutas
- Diseño del Dockerfile y docker-compose para EasyPanel
- Schema Prisma: nombres de tablas, tipos de columnas, relaciones exactas

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | Administradora puede iniciar sesión con email y contraseña | better-auth credentials provider; login page with shadcn Card + Input + Button |
| AUTH-02 | Sesión persiste entre recargas del navegador | better-auth HTTP-only cookie sessions; `useSession` hook on client |
| AUTH-03 | Administradora puede cerrar sesión desde cualquier página | better-auth `signOut()` called from navbar "Cerrar Sesión" link |
| AUTH-04 | Rutas protegidas redirigen a login si no hay sesión activa | Next.js middleware (`middleware.ts`) + better-auth `getSession()` server-side check |
| DATA-01 | Sistema carga ~30 empleados con nombre completo vía seeder | Prisma seed script; employee names from Laravel repo EmployeeSeeder |
| DATA-02 | Sistema carga 7 áreas fijas vía seeder | Prisma seed; areas hardcoded: General, Buffet, Cosmético, Domicilios, Electrodoméstico, Marking, Varely Camacho |
| DATA-03 | Administradora puede asignar áreas habilitadas por empleado | Skills page with checkbox table; Server Action `toggleEmployeeArea`; `revalidatePath` for instant UI |
| DATA-04 | Sistema carga plantillas de turno con horarios por día y área | Prisma seed; shift templates from datos_proyecto.md parsed into structured records |
| DATA-05 | Plantillas incluyen required_count por área/día | Encoded in shift_template records with `requiredCount` and `dayOfWeek` + `areaId` fields |
| INF-01 | App desplegada en Docker con EasyPanel | Multi-stage Dockerfile; `output: "standalone"` in next.config.ts; docker-entrypoint.sh for migrate+start |
| INF-02 | Dark mode con gradientes y glassmorphism | Tailwind v4 CSS variables; next-themes `attribute="data-theme"`; glassmorphism via `backdrop-blur` + semi-transparent bg |
| INF-03 | Interfaz completamente en español | All labels, nav links, form fields, error messages in Spanish; `formatSpanish` utility from day one |
</phase_requirements>

---

## Summary

Phase 1 establishes the entire foundation that every subsequent phase depends on: a working Next.js 15 app deployed to Docker/EasyPanel with authentication, the complete Prisma schema, all seed data loaded, and the skills configuration UI functional. This phase produces no scheduling logic — it is purely infrastructure, auth, data layer, and the two UI pages required before any other work can begin (login + habilidades).

The stack is fully decided and verified: Next.js 15 App Router, Prisma 6 + PostgreSQL 16, Tailwind CSS v4, shadcn/ui, better-auth, date-fns 4. The main risk in this phase is not technical difficulty — it is completeness of the seed data. Employee names must be extracted from the Laravel repo, shift templates must be parsed from datos_proyecto.md into structured records, and area badge colors must be matched to the Laravel source. Missing or wrong seed data will corrupt every phase that follows.

The second risk is the Docker + EasyPanel setup getting into a bad state if the entrypoint script, environment variables, and standalone output are not wired together correctly from the start.

**Primary recommendation:** Build in strict order — Prisma schema first, seed script second, Docker verified third, auth fourth, skills UI last. Never skip the seed verification step.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.x | Full-stack React framework | App Router + Server Actions; `output: "standalone"` for Docker; greenfield choice for 2026 |
| Prisma ORM | 6.x (6.2+) | Database ORM + migrations | Type-safe queries; migration-based schema management; singleton required in dev |
| PostgreSQL | 16.x | Primary database | Complex date/area queries; decided in project research |
| Tailwind CSS | 4.x | Utility styling | Pure CSS config (no tailwind.config.js); dark mode via CSS variables |
| shadcn/ui | latest CLI | Component collection | Copy-owned components; compatible with Next.js 15 + React 19 + Tailwind v4 |
| better-auth | latest | Authentication | TypeScript-first; credentials built-in; replaces NextAuth v5 (still beta) |
| @better-auth/prisma | latest | Auth Prisma adapter | Connects auth sessions to existing Prisma/PostgreSQL |
| next-themes | 0.4.x | Dark mode toggle | `attribute="data-theme"` required for Tailwind v4 |
| date-fns | 4.x | Date formatting + Spanish locale | `es` locale bundled; tree-shakeable; v4 fixes Spanish grammar |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx + tailwind-merge | latest | Conditional class merging | Cell colors, state variants, glassmorphism variants |
| lucide-react | latest | Icons | Ships with shadcn/ui; all nav and UI icons |
| Zod | 3.x | Schema validation | Login form validation; Server Action input validation |
| react-hook-form | 7.x | Form state | Login form only in this phase |
| @hookform/resolvers | 3.x | Zod-RHF bridge | Wires Zod into react-hook-form |

### Installation

```bash
# Framework (if not already initialized)
npx create-next-app@latest gestion-turnos --typescript --tailwind --app --src-dir

# Database
npm install prisma @prisma/client
npx prisma init

# Auth
npm install better-auth @better-auth/prisma

# UI components
npx shadcn@latest init
npx shadcn@latest add card input button label checkbox badge

# Dark mode
npm install next-themes

# Forms
npm install react-hook-form zod @hookform/resolvers

# Utilities (added by shadcn init)
npm install clsx tailwind-merge lucide-react

# Date formatting
npm install date-fns
```

---

## Architecture Patterns

### Recommended Project Structure (Phase 1 scope)

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx           # Login page — RSC + Server Action
│   └── layout.tsx             # Auth layout (no navbar)
├── habilidades/
│   └── page.tsx               # Skills page — RSC shell
├── planilla/
│   └── page.tsx               # Placeholder redirect (built in Phase 3)
├── layout.tsx                 # Root layout — ThemeProvider + Navbar
└── page.tsx                   # Redirect to /planilla or /login

components/
├── layout/
│   └── Navbar.tsx             # Top navbar with links + Cerrar Sesión
├── habilidades/
│   └── HabilidadesTable.tsx   # Client — checkbox table (30 rows x 7 areas)
└── ui/                        # shadcn/ui components (auto-generated)

lib/
├── auth.ts                    # better-auth config + session helpers
├── db.ts                      # Prisma singleton (MUST be first file created)
├── actions/
│   └── employees.ts           # 'use server' — toggleEmployeeArea
└── utils/
    └── format.ts              # formatSpanish() date utility

prisma/
├── schema.prisma              # Full schema for all 5 phases
└── seed.ts                    # Employees + areas + shift templates + admin user

middleware.ts                  # Route protection — redirect /protected → /login
Dockerfile                     # Multi-stage build
docker-entrypoint.sh           # migrate deploy + start server
```

### Pattern 1: Prisma Singleton (MUST be Pattern 0)

**What:** Single PrismaClient instance shared across all hot reloads in development.
**When to use:** Day one, before any data access code is written. Non-negotiable.

```typescript
// lib/db.ts
import { PrismaClient } from "@prisma/client"
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

### Pattern 2: better-auth Setup

**What:** Single-admin credential auth with HTTP-only cookie sessions.
**When to use:** Auth configuration before login page is built.

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth"
import { prismaAdapter } from "@better-auth/prisma"
import { prisma } from "./db"

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  session: {
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
})
```

### Pattern 3: Middleware Route Protection

**What:** Next.js middleware intercepts all non-auth requests, redirects to /login if no session.
**When to use:** After auth is configured; before any protected pages are built.

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "./lib/auth-server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthRoute = pathname.startsWith("/login")

  const session = await getSessionFromRequest(request)

  if (!session && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/planilla", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
```

### Pattern 4: Server Action for Checkbox Toggle

**What:** Instant server-side toggle of employee-area assignment without full page reload.
**When to use:** Habilidades page checkboxes.

```typescript
// lib/actions/employees.ts
'use server'
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function toggleEmployeeArea(employeeId: number, areaId: number, enabled: boolean) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("No autorizado")

  if (enabled) {
    await prisma.employeeArea.upsert({
      where: { employeeId_areaId: { employeeId, areaId } },
      create: { employeeId, areaId },
      update: {},
    })
  } else {
    await prisma.employeeArea.deleteMany({ where: { employeeId, areaId } })
  }
  revalidatePath("/habilidades")
}
```

### Pattern 5: Docker Multi-Stage + Entrypoint

**What:** Three-stage Docker build (deps → builder → runner) with Alpine for minimal image.
**When to use:** INF-01 — deploy to EasyPanel.

```dockerfile
# Stage 1: deps
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 3: runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV TZ=America/Bogota
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
```

```bash
#!/bin/sh
# docker-entrypoint.sh
npx prisma migrate deploy
node server.js
```

### Pattern 6: Glassmorphism with Tailwind v4

**What:** Dark mode glassmorphism using CSS variables and `backdrop-blur`.
**When to use:** Login card, navbar, any floating panel.

```css
/* app/globals.css */
@import "tailwindcss";

:root {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
}

.glass {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

### Anti-Patterns to Avoid

- **`new PrismaClient()` in each file:** Exhausts PostgreSQL connection pool in dev within 20-30 hot reloads. Always use the singleton in `lib/db.ts`.
- **Storing session token in localStorage:** Exposes auth token to XSS. better-auth uses HTTP-only cookies by default — do not override this.
- **Putting `'use server'` on individual functions inside a page file:** Only safe in dedicated actions files (`lib/actions/*.ts`). Mixing server functions into page components creates confusing boundaries.
- **`darkMode: "class"` in Tailwind config:** Tailwind v4 has no `tailwind.config.js`. Use CSS variables and `next-themes` with `attribute="data-theme"`.
- **Running `prisma migrate dev` in Docker entrypoint:** Use `prisma migrate deploy` in production/Docker. `migrate dev` is for local development only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email+password auth | Custom session management | better-auth | Session fixation, timing attacks, cookie security are non-trivial |
| Password hashing | Custom bcrypt calls | better-auth built-in (scrypt) | better-auth handles scrypt by default; no separate install |
| Route protection | Manual cookie checks in every page | Next.js middleware + better-auth | Middleware runs at edge before any RSC; centralized, not per-page |
| Dark mode system preference sync | Manual localStorage + CSS toggle | next-themes | Handles hydration flash, system preference, SSR correctly |
| Form validation | Manual regex in Server Action | Zod + react-hook-form | Type-safe, composable, reusable schemas |
| Component primitives | Custom Modal, Input, Button | shadcn/ui (Radix) | Accessibility (focus trap, ARIA) is hard to get right from scratch |

**Key insight:** Phase 1 is the one phase where using solid libraries over hand-rolled solutions matters most — bugs in auth, session management, or DB connection setup will silently corrupt every subsequent phase.

---

## Common Pitfalls

### Pitfall 1: Prisma Connection Pool Exhaustion

**What goes wrong:** `FATAL: sorry, too many clients already` after active dev session with hot reloads.
**Why it happens:** Each hot reload creates a new `PrismaClient` without the singleton guard.
**How to avoid:** Use the `globalThis` singleton pattern in `lib/db.ts` — this MUST be the first file created before any data access code.
**Warning signs:** DB errors that resolve after restarting dev server; `pg_stat_activity` showing dozens of idle connections.

### Pitfall 2: TZ=America/Bogota Missing in Docker

**What goes wrong:** Dates shift by one day in production. A shift created for "March 1" lands on "February 28" in the DB. Invisible in local dev if developer is in UTC-5 or UTC-6.
**Why it happens:** JavaScript `Date` operates in UTC. The Laravel system ran on a server configured to `America/Bogota`.
**How to avoid:** Set `TZ=America/Bogota` as `ENV` in Dockerfile AND as an EasyPanel environment variable. Verify with a smoke test immediately after first deploy.
**Warning signs:** Dates in DB are off by one during early morning hours in Colombia.

### Pitfall 3: better-auth Session Not Accessible in Middleware

**What goes wrong:** Middleware cannot read the session, so all routes redirect to login even when logged in.
**Why it happens:** better-auth session reading in Edge runtime (middleware) requires the `getSession` call to use the request headers API, not the Node.js `headers()` function.
**How to avoid:** Use `auth.api.getSession({ headers: request.headers })` in middleware — pass `request.headers` directly, not the Next.js `headers()` import.
**Warning signs:** Login succeeds but every protected page redirects back to login immediately.

### Pitfall 4: Seed Data Incomplete or Wrong Format

**What goes wrong:** Shift templates have wrong time format (spaces vs no-spaces around `-`), missing required_count, or area names that don't match the enum. Every phase 2+ query returns wrong data.
**Why it happens:** seed.ts is written manually from datos_proyecto.md; minor formatting inconsistencies accumulate.
**How to avoid:** After seeding, run a verification query that asserts: 30 employees loaded, 7 areas loaded, shift template count per day matches datos_proyecto.md totals (Lunes: 14 general + 4 specialty, etc.), and at least one template per area-day combination that requires coverage.
**Warning signs:** Skills page shows wrong employee count; generation algorithm in Phase 2 produces incorrect coverage.

### Pitfall 5: next-themes Hydration Flash with Tailwind v4

**What goes wrong:** Dark mode flashes light mode briefly on page load (hydration mismatch).
**Why it happens:** `darkMode: "class"` is a Tailwind v3 pattern. Tailwind v4 uses CSS variables — the theme attribute must align.
**How to avoid:** Set `attribute="data-theme"` on the `ThemeProvider`, and define all colors as CSS variables in `globals.css` scoped to `[data-theme="dark"]`. Never use `dark:` Tailwind prefix; use CSS variables instead.
**Warning signs:** Visible light flash on page load; dark mode styles only applying after client hydration.

### Pitfall 6: Area Badge Colors Not Extracted Before Building UI

**What goes wrong:** Area badges use placeholder colors in Phase 1. By Phase 3 (Planilla), the admin notices colors are wrong and requires a global find-replace across components.
**Why it happens:** Colors seem like a minor detail, so they are deferred. But they are used in every component that displays area data.
**How to avoid:** Extract area badge colors from the Laravel source (`https://github.com/Jomeva12/yuli_turnos.git`) during seed script creation and encode them as CSS custom properties or a TypeScript constant in `lib/constants/areas.ts`. All components import from this single source.
**Warning signs:** Badge colors in login screen / navbar demo look different from Laravel screenshots.

---

## Code Examples

### Prisma Schema (Phase 1 tables)

```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  // better-auth session tables added via migrate
}

model Employee {
  id        Int      @id @default(autoincrement())
  name      String
  createdAt DateTime @default(now())
  areas     EmployeeArea[]
  shifts    Shift[]
  absences  Absence[]
}

model Area {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  color     String   // hex color for badge, e.g. "#22c55e"
  employees EmployeeArea[]
  shiftTemplates ShiftTemplate[]
}

model EmployeeArea {
  employeeId Int
  areaId     Int
  employee   Employee @relation(fields: [employeeId], references: [id])
  area       Area     @relation(fields: [areaId], references: [id])

  @@id([employeeId, areaId])
}

model ShiftTemplate {
  id            Int     @id @default(autoincrement())
  areaId        Int
  dayOfWeek     Int     // 1=Mon ... 7=Sun
  timeSlot      String  // "7:00-11:00|11:30-14:30"
  isWildcard    Boolean @default(false)
  requiredCount Int     @default(1)
  area          Area    @relation(fields: [areaId], references: [id])
}

// Shift and Absence tables defined now for schema completeness;
// populated starting in Phase 2
model Shift {
  id           Int      @id @default(autoincrement())
  employeeId   Int
  date         DateTime @db.Date
  timeSlot     String?
  areaId       Int?
  isManual     Boolean  @default(false)
  employee     Employee @relation(fields: [employeeId], references: [id])

  @@unique([employeeId, date])
}

model Absence {
  id         Int      @id @default(autoincrement())
  employeeId Int
  startDate  DateTime @db.Date
  endDate    DateTime @db.Date
  type       String   // VAC | INC | PER | CAL | DESCANSO
  employee   Employee @relation(fields: [employeeId], references: [id])
}
```

### Seed Script Structure

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client"
import { hash } from "better-auth/crypto" // or bcryptjs

const prisma = new PrismaClient()

const AREAS = [
  { name: "General",          color: "#6b7280" },
  { name: "Buffet",           color: "#f59e0b" },
  { name: "Cosmético",        color: "#ec4899" },
  { name: "Domicilios",       color: "#3b82f6" },
  { name: "Electrodoméstico", color: "#8b5cf6" },
  { name: "Marking",          color: "#10b981" },
  { name: "Varely Camacho",   color: "#ef4444" },
  // NOTE: colors above are PLACEHOLDERS — replace with actual Laravel colors
  // after extracting from https://github.com/Jomeva12/yuli_turnos.git
]

// Employee names: extract from Laravel EmployeeSeeder before running seed
const EMPLOYEES = [
  // "APELLIDO NOMBRE" format as in Laravel seeder
  // ~30 names from https://github.com/Jomeva12/yuli_turnos.git
]

async function main() {
  // 1. Seed admin user via better-auth compatible user record
  // 2. Seed areas
  // 3. Seed employees
  // 4. Seed shift templates from datos_proyecto.md
}
```

### formatSpanish Utility

```typescript
// lib/utils/format.ts
import { format } from "date-fns"
import { es } from "date-fns/locale"

/** Returns capitalized Spanish month name: "Marzo" not "marzo" */
export function formatMonthYear(date: Date): string {
  const raw = format(date, "MMMM yyyy", { locale: es })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

/** Returns short day name in Spanish: "Lun", "Mar", "Mié"... */
export function formatDayShort(date: Date): string {
  return format(date, "EEE", { locale: es })
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| NextAuth v4 | better-auth | 2025-2026 | NextAuth v5 never reached stable; better-auth is now the standard for new Next.js projects |
| `tailwind.config.js` | CSS `@import "tailwindcss"` in globals.css | Tailwind v4 (2024) | No config file; all customization via CSS variables |
| `darkMode: "class"` | CSS variable + `attribute="data-theme"` on ThemeProvider | Tailwind v4 (2024) | Class-based dark mode does not work in Tailwind v4 |
| `next-auth` session cookies | better-auth HTTP-only session cookies | 2025 | Same concept; better-auth API is cleaner |

**Deprecated/outdated:**
- `NextAuth v4`: Not compatible with Next.js 15 App Router patterns
- `NextAuth v5 / Auth.js`: Still beta as of 2026, avoid for new projects
- `Lucia auth v3`: Moved to reference implementation status; not a production library

---

## Open Questions

1. **Employee names from Laravel repo**
   - What we know: Names are in `EmployeeSeeder` at https://github.com/Jomeva12/yuli_turnos.git (main branch)
   - What's unclear: Exact file path and format (may be PHP array or factory)
   - Recommendation: Pull the repo and read `database/seeders/EmployeeSeeder.php` before writing seed.ts. Do not invent names.

2. **Area badge colors from Laravel source**
   - What we know: Laravel system uses Bootstrap CSS; colors likely in Blade templates or a CSS file
   - What's unclear: Whether colors are utility classes (e.g., `badge-success`) or hex values
   - Recommendation: Read `resources/views/` in Laravel repo, look for badge rendering per area, map Bootstrap color to hex equivalent before seeding.

3. **better-auth admin user seeding**
   - What we know: better-auth manages its own user table schema via migrations
   - What's unclear: Whether `prisma/seed.ts` can directly insert a user record or must call the better-auth API
   - Recommendation: Run `npx @better-auth/cli migrate` first to create auth tables, then seed via `prisma.user.create()` with a pre-hashed password using better-auth's `hash()` export.

4. **EasyPanel PostgreSQL service**
   - What we know: EasyPanel runs Docker containers; PostgreSQL as a separate service in the same project
   - What's unclear: Whether to use EasyPanel's managed PostgreSQL service or a custom PostgreSQL container
   - Recommendation: Use EasyPanel's built-in PostgreSQL service (simpler networking, managed backups). Set `DATABASE_URL` as an EasyPanel environment variable pointing to the internal service hostname.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (no config yet — Wave 0 gap) |
| Config file | `vitest.config.ts` — does not exist yet |
| Quick run command | `npx vitest run --reporter=verbose lib/utils` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Login form accepts valid credentials | smoke (manual browser) | — | ❌ manual only |
| AUTH-02 | Session cookie persists on page reload | smoke (manual browser) | — | ❌ manual only |
| AUTH-03 | Cerrar Sesión clears session and redirects | smoke (manual browser) | — | ❌ manual only |
| AUTH-04 | `/habilidades` without session redirects to `/login` | smoke (manual browser) | — | ❌ manual only |
| DATA-01 | 30 employees loaded after seed | unit | `npx vitest run prisma/seed.test.ts` | ❌ Wave 0 |
| DATA-02 | 7 areas loaded after seed, names match spec | unit | `npx vitest run prisma/seed.test.ts` | ❌ Wave 0 |
| DATA-03 | toggleEmployeeArea creates/deletes EmployeeArea record | unit | `npx vitest run lib/actions/employees.test.ts` | ❌ Wave 0 |
| DATA-04 | Shift templates loaded with correct timeSlot format | unit | `npx vitest run prisma/seed.test.ts` | ❌ Wave 0 |
| DATA-05 | requiredCount matches datos_proyecto.md per area/day | unit | `npx vitest run prisma/seed.test.ts` | ❌ Wave 0 |
| INF-01 | App starts in Docker and responds to GET / | smoke (manual docker build) | — | ❌ manual only |
| INF-02 | Dark mode applies on load (no flash) | smoke (manual browser) | — | ❌ manual only |
| INF-03 | All visible text is in Spanish | smoke (manual review) | — | ❌ manual only |

### Sampling Rate
- **Per task commit:** `npx vitest run lib/ prisma/ --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` — basic Vitest config for Next.js project; install: `npm install -D vitest @vitest/coverage-v8`
- [ ] `prisma/seed.test.ts` — asserts: employee count = ~30, area count = 7, shift template count per day matches datos_proyecto.md, no duplicate area names
- [ ] `lib/actions/employees.test.ts` — unit test for `toggleEmployeeArea` with Prisma mock
- [ ] `lib/utils/format.test.ts` — asserts `formatMonthYear` capitalizes, `formatDayShort` returns Spanish abbreviations

---

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` — Full stack selection with version compatibility matrix
- `.planning/research/ARCHITECTURE.md` — Next.js 15 App Router patterns, build order, data flow
- `.planning/research/PITFALLS.md` — Prisma singleton, TZ pitfall, connection pool, Spanish locale
- [Next.js standalone Docker deploy](https://nextjs.org/docs/app/getting-started/deploying) — Official Next.js docs
- [Prisma + Next.js 15](https://www.prisma.io/nextjs) — Official Prisma docs
- [shadcn/ui React 19 + Next.js 15](https://ui.shadcn.com/docs/react-19) — Official shadcn docs

### Secondary (MEDIUM confidence)
- [better-auth vs NextAuth 2026](https://betterstack.com/community/guides/scaling-nodejs/better-auth-vs-nextauth-authjs-vs-autho/) — Community comparison confirming better-auth recommendation
- [EasyPanel Next.js quickstart](https://easypanel.io/docs/quickstarts/nextjs) — Official EasyPanel docs

### Tertiary (LOW confidence)
- datos_proyecto.md — Shift template source; requires manual parsing into structured records (format is prose, not structured data)
- Laravel repo employee names — Requires reading PHP EmployeeSeeder; names not yet extracted

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified in `.planning/research/STACK.md` against official docs
- Architecture: HIGH — verified in `.planning/research/ARCHITECTURE.md` against Next.js official docs
- Auth (better-auth): MEDIUM — recommended as NextAuth v5 replacement; API details need verification against better-auth latest docs before implementation
- Seed data completeness: LOW — employee names and area colors not yet extracted from Laravel repo; must happen before seed.ts is written
- Pitfalls: HIGH — all critical pitfalls for this phase are documented with official sources

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable stack; better-auth check recommended before planning auth tasks)
