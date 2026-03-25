# Architecture Research

**Domain:** Shift management system — monthly scheduling grid for ~30 warehouse employees
**Researched:** 2026-03-24
**Confidence:** HIGH (Next.js 15 App Router patterns verified against official docs and current sources)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  /planilla    │  │  /empleados  │  │  /configuracion       │ │
│  │  (RSC + grid) │  │  (RSC list)  │  │  (areas, plantillas)  │ │
│  └──────┬────────┘  └──────┬───────┘  └──────────┬────────────┘ │
│         │                 │                      │              │
│  ┌──────▼────────┐  ┌──────▼──────────────────────▼──────────┐  │
│  │  PlanillaGrid │  │  Shared Client Components               │  │
│  │  (Client)     │  │  (modal lateral, panel cobertura)       │  │
│  └──────┬────────┘  └────────────────────────────────────────┘  │
├─────────┼───────────────────────────────────────────────────────┤
│         │              ACTION LAYER                              │
├─────────┼───────────────────────────────────────────────────────┤
│  ┌──────▼──────────────────────────────────────────────────┐    │
│  │                  Server Actions (lib/actions/)           │    │
│  │  shifts.ts  │  employees.ts  │  absences.ts  │  gen.ts  │    │
│  └──────┬──────────────────────────────────────────────────┘    │
│  ┌──────▼──────────────────────────────────────────────────┐    │
│  │               Route Handlers (app/api/)                  │    │
│  │  /api/export/xlsx   (streaming file download)            │    │
│  └──────┬──────────────────────────────────────────────────┘    │
├─────────┼───────────────────────────────────────────────────────┤
│         │              BUSINESS LAYER                            │
├─────────┼───────────────────────────────────────────────────────┤
│  ┌──────▼──────────────────────────────────────────────────┐    │
│  │               lib/services/                              │    │
│  │  generation.ts (algoritmo turnos)                        │    │
│  │  coverage.ts   (validación cobertura por área)           │    │
│  │  rotation.ts   (lógica semanas alternadas)               │    │
│  └──────┬──────────────────────────────────────────────────┘    │
├─────────┼───────────────────────────────────────────────────────┤
│         │              DATA LAYER                                │
├─────────┼───────────────────────────────────────────────────────┤
│  ┌──────▼──────────────────────────────────────────────────┐    │
│  │  lib/db/ (Prisma queries — no raw SQL)                   │    │
│  │  PostgreSQL via Prisma ORM                               │    │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| `app/(auth)/login/page.tsx` | Login form, session creation | Server Component + Server Action |
| `app/planilla/page.tsx` | Shell RSC: fetches employees + shifts for month | Async Server Component |
| `PlanillaGrid` | Editable grid (rows=employees, cols=days), cell click | Client Component (`'use client'`) |
| `ShiftCell` | Single cell in grid: display + inline edit trigger | Client Component |
| `AsignacionModal` | Lateral slide-over for manual shift assignment | Client Component with Server Action |
| `CoberturaSidebar` | Day coverage breakdown by area | Server Component (data passed as prop) |
| `EmpleadoPerfil` | Employee lateral sidebar | Client Component (opens on click) |
| `BitacoraGeneracion` | Generation log with badges info/warning/error | Server Component |
| `TimelineCobertura` | Horizontal 6:00–22:00 view by area | Client Component |
| `app/empleados/page.tsx` | Employee list, skills assignment | Async Server Component |
| `app/novedades/page.tsx` | Absences, vacations, incapacity list | Async Server Component |
| `lib/actions/shifts.ts` | assignShift, clearMonth, generateShifts | Server Actions file |
| `lib/actions/absences.ts` | createAbsence, updateAbsence, deleteAbsence | Server Actions file |
| `lib/actions/employees.ts` | updateEmployeeAreas, createEmployee | Server Actions file |
| `lib/services/generation.ts` | Full month generation algorithm | Pure TypeScript, no framework deps |
| `lib/services/coverage.ts` | Area coverage validation logic | Pure TypeScript |
| `app/api/export/route.ts` | XLSX export, streaming response | Route Handler (GET) |

## Recommended Project Structure

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx              # Login page (RSC + Server Action inline)
│   └── layout.tsx                # Auth layout
├── planilla/
│   ├── page.tsx                  # RSC shell — fetches month data
│   ├── loading.tsx               # Skeleton table while data loads
│   └── [mes]/
│       └── page.tsx              # Navegación por mes (query param alternativo)
├── empleados/
│   ├── page.tsx                  # Employee list RSC
│   └── [id]/
│       └── page.tsx              # Employee edit RSC
├── novedades/
│   └── page.tsx                  # Absences list RSC
├── configuracion/
│   ├── areas/page.tsx            # Area management
│   └── plantillas/page.tsx      # Shift template editor
├── api/
│   └── export/
│       └── route.ts             # XLSX download Route Handler
├── layout.tsx                    # Root layout + auth check
└── page.tsx                      # Redirect to /planilla

components/
├── planilla/
│   ├── PlanillaGrid.tsx          # Client — main editable grid
│   ├── ShiftCell.tsx             # Client — single cell + click handler
│   ├── AsignacionModal.tsx       # Client — lateral slide-over
│   ├── CoberturaSidebar.tsx      # Mixed — server data, client interaction
│   ├── BitacoraGeneracion.tsx    # Server — generation log
│   ├── EmpleadoPerfil.tsx        # Client — employee sidebar
│   ├── TimelineCobertura.tsx     # Client — horizontal area timeline
│   └── MonthNavigator.tsx       # Client — month selector
├── empleados/
│   ├── EmpleadosList.tsx
│   └── EmpleadoForm.tsx          # Client
├── novedades/
│   └── NovedadForm.tsx           # Client
└── ui/
    ├── Badge.tsx
    ├── Modal.tsx
    └── Skeleton.tsx

lib/
├── actions/
│   ├── shifts.ts                 # 'use server' — shift mutations
│   ├── absences.ts               # 'use server' — absence mutations
│   ├── employees.ts              # 'use server' — employee mutations
│   └── generation.ts             # 'use server' — trigger generation algo
├── services/
│   ├── generation.ts             # Algorithm: full-month shift generation
│   ├── coverage.ts               # Coverage rules validation per area
│   └── rotation.ts              # Morning/afternoon alternation logic
├── db/
│   ├── shifts.ts                 # Prisma queries for shifts
│   ├── employees.ts              # Prisma queries for employees
│   ├── absences.ts               # Prisma queries for absences
│   └── templates.ts             # Prisma queries for shift_templates
└── auth.ts                       # Session helper (next-auth or iron-session)

prisma/
├── schema.prisma
└── seed.ts                       # ~30 employees + 7 areas + all templates
```

### Structure Rationale

- **`lib/actions/` separated from `lib/services/`:** Actions handle HTTP boundary (auth check, revalidation). Services contain pure business logic testable without Next.js.
- **`components/planilla/`:** All grid components co-located. The grid is the core UI — it deserves its own namespace.
- **`lib/db/`:** Prisma calls isolated from actions. Actions call db functions, not Prisma directly. This keeps queries reusable and testable.
- **`app/api/export/`:** Only one Route Handler in the whole app. XLSX export must stream a binary file — impossible with Server Actions (POST only, no streaming response).

## Architectural Patterns

### Pattern 1: RSC Shell with Client Island

**What:** Page server component fetches all data, passes it down to a Client Component that handles all interactivity.

**When to use:** Data-heavy views where the grid must be editable in-place without page navigations. This is the core pattern for the planilla.

**Trade-offs:** Initial load is fast (server-rendered). Client bundle includes the grid logic. State resets on full page reload, which is acceptable since the admin works one month at a time.

**Example:**
```typescript
// app/planilla/page.tsx — Server Component
export default async function PlanillaPage({ searchParams }) {
  const { mes, anio } = await searchParams
  const [employees, shifts, absences, templates] = await Promise.all([
    getEmployeesWithAreas(),
    getShiftsForMonth(mes, anio),
    getAbsencesForMonth(mes, anio),
    getShiftTemplates(),
  ])

  return (
    <PlanillaGrid
      employees={employees}
      shifts={shifts}
      absences={absences}
      templates={templates}
      mes={mes}
      anio={anio}
    />
  )
}

// components/planilla/PlanillaGrid.tsx — Client Component
'use client'
export function PlanillaGrid({ employees, shifts, absences, templates, mes, anio }) {
  const [localShifts, setLocalShifts] = useState(shifts)
  // All grid interactivity lives here
}
```

### Pattern 2: Server Actions for All Mutations

**What:** Every write operation (assign shift, clear month, save novedad) is a Server Action in `lib/actions/`. Client Components call them directly — no fetch() wrappers, no /api routes for internal mutations.

**When to use:** All internal mutations. This covers 95% of the app's write operations.

**Trade-offs:** Simpler than API routes. Type-safe end-to-end (no JSON serialization boundary). Revalidation (`revalidatePath`) automatically refreshes server data after mutation. Does not support parallel invocation (Next.js dispatches one at a time).

**Example:**
```typescript
// lib/actions/shifts.ts
'use server'
import { revalidatePath } from 'next/cache'
import { assignShiftInDb } from '@/lib/db/shifts'
import { getSession } from '@/lib/auth'

export async function assignShift(employeeId: number, date: string, shiftData: ShiftInput) {
  const session = await getSession()
  if (!session) throw new Error('No autorizado')

  await assignShiftInDb(employeeId, date, shiftData)
  revalidatePath('/planilla')
}

// components/planilla/ShiftCell.tsx
'use client'
import { assignShift } from '@/lib/actions/shifts'
import { useOptimistic } from 'react'

export function ShiftCell({ shift, employeeId, date }) {
  const [optimisticShift, setOptimisticShift] = useOptimistic(shift)

  async function handleSave(newShift) {
    setOptimisticShift(newShift)  // instant UI update
    await assignShift(employeeId, date, newShift)  // server sync
  }
  // ...
}
```

### Pattern 3: Generation Algorithm as Pure Service

**What:** The shift generation algorithm (`lib/services/generation.ts`) is a pure TypeScript function with zero framework dependencies. It receives month/year + all employee/template data and returns the complete shift assignment array.

**When to use:** Complex business logic that needs to be testable and potentially re-run in different contexts (Server Action, background job).

**Trade-offs:** Slightly more code (separate service + action layers). Pays off immediately because the generation algorithm is the hardest thing in this system — it needs unit tests independent of HTTP.

**Example:**
```typescript
// lib/services/generation.ts — zero framework deps
export function generateMonthShifts(
  mes: number,
  anio: number,
  employees: Employee[],
  templates: ShiftTemplate[],
  existingAbsences: Absence[]
): GeneratedShift[] {
  // Pure algorithm: descansos, rotación, cobertura
  // No Prisma, no Next.js, no HTTP
}

// lib/actions/generation.ts — thin wrapper
'use server'
import { generateMonthShifts } from '@/lib/services/generation'
import { getEmployeesWithAreas, getShiftTemplates, getAbsencesForMonth } from '@/lib/db'
import { saveGeneratedShifts } from '@/lib/db/shifts'
import { revalidatePath } from 'next/cache'

export async function triggerGeneration(mes: number, anio: number) {
  const session = await getSession()
  if (!session) throw new Error('No autorizado')

  const [employees, templates, absences] = await Promise.all([
    getEmployeesWithAreas(),
    getShiftTemplates(),
    getAbsencesForMonth(mes, anio),
  ])

  const generated = generateMonthShifts(mes, anio, employees, templates, absences)
  await saveGeneratedShifts(generated)
  revalidatePath('/planilla')
}
```

## Data Flow

### Request Flow — Initial Planilla Load

```
User navigates to /planilla?mes=3&anio=2026
    ↓
app/planilla/page.tsx (Server Component)
    ↓ Promise.all([...])
lib/db/employees.ts → Prisma → PostgreSQL
lib/db/shifts.ts    → Prisma → PostgreSQL
lib/db/absences.ts  → Prisma → PostgreSQL
    ↓ (all parallel)
PlanillaGrid (Client Component — hydrates with data)
    ↓
Browser: fully interactive grid with local state
```

### Request Flow — Manual Shift Assignment

```
User clicks cell → AsignacionModal opens (local state)
    ↓
User selects turno + saves
    ↓
assignShift() Server Action called (POST under the hood)
    ↓ useOptimistic → UI updates immediately
lib/actions/shifts.ts → auth check
    ↓
lib/db/shifts.ts → Prisma → PostgreSQL
    ↓
revalidatePath('/planilla')
    ↓
Next.js re-fetches RSC data for /planilla
    ↓
Grid re-renders with server-confirmed data
```

### Request Flow — Generation Algorithm

```
Admin clicks "Generar mes"
    ↓
triggerGeneration(mes, anio) Server Action
    ↓ [may take 1-3 seconds for 30 employees x 30 days]
lib/services/generation.ts (pure algorithm)
    ↓
saveGeneratedShifts() — bulk upsert
    ↓
revalidatePath('/planilla') + generation_notes saved
    ↓
Planilla grid refreshes with new shifts + bitácora visible
```

### Request Flow — XLSX Export

```
User clicks "Exportar Excel"
    ↓
<a href="/api/export?mes=3&anio=2026"> or fetch()
    ↓
app/api/export/route.ts (Route Handler)
    ↓
Query shifts for month → build XLSX buffer (exceljs or xlsx)
    ↓
Response with Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
    ↓
Browser triggers file download
```

### State Management

```
Server State (source of truth):
    PostgreSQL ← Prisma ← lib/db/
        ↓ (on page load)
    RSC page.tsx fetches and passes as props
        ↓
    PlanillaGrid local useState (client copy)
        ↓ (on mutation)
    Server Action → revalidatePath → RSC re-fetch
        ↑ (optimistic layer)
    useOptimistic updates local UI immediately
```

The planilla grid holds a client-side copy of the shift data in `useState`. This is intentional — the grid needs to be highly interactive (hover, click, modal, keyboard). `useOptimistic` bridges the gap: show changes instantly, sync with server async.

No global state library (Zustand, Redux) is needed. The single admin user means no multi-tab sync concerns.

### Key Data Flows

1. **Month navigation:** URL search param `?mes=3&anio=2026` drives RSC re-fetch. `MonthNavigator` uses `router.push()` — clean, bookmarkable, no client state.
2. **Day panel (CoberturaSidebar):** Derived from already-loaded shift data in `PlanillaGrid`. Computed client-side on day click — no extra server request needed.
3. **Employee profile sidebar:** Triggered by row click in grid. Employee data already loaded — panel opens instantly from props.
4. **Absence affects display:** When a novedad is added, `revalidatePath('/planilla')` refreshes the grid so the cell shows the novedad type (vacaciones, incapacidad, etc.).

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 admin user (current) | Monolith is perfect. No queue, no worker, no cache layer needed. |
| Multi-user read (managers view) | Add read-only auth role. No structural changes needed — RSC data is always fresh. |
| Multiple almacenes | Add `almacenId` scope to all queries. Prisma multi-tenant pattern is straightforward. Current architecture handles this with minimal changes. |

### Scaling Priorities

1. **First bottleneck:** Generation algorithm CPU time for large employee counts. At 30 employees it's instant (<100ms). If it ever exceeds 5 seconds, move to a background job (queue) and show progress via polling. Not needed now.
2. **Second bottleneck:** XLSX export for large date ranges. Use streaming response from the Route Handler. Already designed this way.

## Anti-Patterns

### Anti-Pattern 1: API Routes for Internal Mutations

**What people do:** Create `/api/shifts/assign`, `/api/shifts/generate`, etc. for every write operation the UI triggers.

**Why it's wrong:** Doubles the code surface. Loses type safety (JSON serialization boundary). Requires manual `fetch()` wrappers on the client. Server Actions are strictly better for internal mutations.

**Do this instead:** `lib/actions/shifts.ts` with `'use server'` — directly called from Client Components, automatically POST, no boilerplate.

### Anti-Pattern 2: Fetching Shift Data Inside the Grid Client Component

**What people do:** PlanillaGrid mounts, calls `fetch('/api/shifts?mes=3')` in a `useEffect`.

**Why it's wrong:** Creates a client-side waterfall. Doubles the time to interactive. Grid renders empty, then shows skeleton, then fills in. React Server Components exist exactly to avoid this.

**Do this instead:** RSC page fetches everything server-side. PlanillaGrid receives `shifts` as props on first render — already populated, no loading flash for initial data.

### Anti-Pattern 3: Embedding Business Logic in Server Actions

**What people do:** Put the 200-line generation algorithm directly inside the `triggerGeneration` Server Action.

**Why it's wrong:** Cannot unit test without a Next.js HTTP context. Business logic becomes coupled to framework. The generation algorithm is the most complex and risky part of this system — it must be independently testable.

**Do this instead:** `lib/services/generation.ts` is pure TypeScript. Server Action is a thin wrapper: authenticate → fetch data → call service → save result → revalidate.

### Anti-Pattern 4: Using Route Handler for XLSX When a Server Action Could Work

**What people do:** Try to return a binary response from a Server Action.

**Why it's wrong:** Server Actions only support POST and cannot stream file downloads. Browsers cannot trigger a file save from a Server Action response.

**Do this instead:** The XLSX export is the one legitimate Route Handler in this app. Use `GET /api/export?mes=3&anio=2026` with proper `Content-Disposition: attachment` headers.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| PostgreSQL | Prisma ORM in `lib/db/` | All queries via Prisma client, never raw SQL |
| EasyPanel deploy | Docker + ENV vars | `DATABASE_URL`, `NEXTAUTH_SECRET` via EasyPanel secrets |
| Auth | iron-session or next-auth | Single admin user, cookie-based session |
| XLSX export | exceljs or xlsx npm package | Used only in Route Handler, not in browser bundle |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Client Component → Server Action | Direct function import + call | Type-safe, no fetch wrapper |
| Server Action → DB layer | Function call (`lib/db/`) | Actions never use Prisma directly |
| Server Action → Service | Function call (`lib/services/`) | Services are pure, no framework deps |
| RSC page → Client Component | Props (server → client boundary) | All shift/employee data passes as serializable props |
| Route Handler → DB layer | Same `lib/db/` functions | Route Handler for export reuses same query functions |

## Build Order Implications

Based on this architecture, the natural build dependency order is:

1. **Data layer first** (`prisma/schema.prisma`, `lib/db/`) — everything depends on this
2. **Auth** (`lib/auth.ts`, login page) — Server Actions gate on session
3. **Core generation service** (`lib/services/generation.ts`) — pure logic, testable in isolation
4. **Server Actions** (`lib/actions/`) — depend on db + services
5. **RSC pages** (`app/planilla/page.tsx`) — depend on db queries
6. **Client Components** (`PlanillaGrid`, `ShiftCell`, modals) — depend on Server Actions + props contract
7. **Route Handler** (`app/api/export/`) — depends on db layer, independent of actions

This means the generation algorithm (step 3) is the first real risk to resolve — it's the core of the system and its correctness determines whether the rest is worth building.

## Sources

- [Next.js App Router — Data Fetching Patterns](https://nextjs.org/docs/app/getting-started/fetching-data)
- [Next.js App Router — Mutating Data with Server Actions](https://nextjs.org/docs/app/getting-started/mutating-data)
- [Next.js — Building APIs with Next.js](https://nextjs.org/blog/building-apis-with-nextjs)
- [Server Actions vs Route Handlers — MakerKit](https://makerkit.dev/blog/tutorials/server-actions-vs-route-handlers)
- [useOptimistic — React Docs](https://react.dev/reference/react/useOptimistic)
- [Next.js 15 App Router Complete Guide — Liven Apps / Medium](https://medium.com/@livenapps/next-js-15-app-router-a-complete-senior-level-guide-0554a2b820f7)
- [Server Actions vs API Route Handlers — vercel/next.js Discussion #72919](https://github.com/vercel/next.js/discussions/72919)

---
*Architecture research for: GestionTurnos v2.0 — monthly shift scheduling system*
*Researched: 2026-03-24*
