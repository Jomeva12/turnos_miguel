# Feature Research

**Domain:** Employee shift/schedule management for retail department store (~30 employees)
**Researched:** 2026-03-24
**Confidence:** HIGH

## Context Note

This is a 1:1 replica of an existing Laravel system already in production. The "user" is a single administrator. The feature landscape below is framed against what the industry considers standard, so the roadmap can distinguish what must be built vs. what can be deferred.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features the administrator assumes exist from day one. Missing any of these makes the system feel broken compared to the current Laravel version.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Monthly schedule grid (employees x days) | Primary interface for viewing and editing all shifts | HIGH | Rows = employees, columns = calendar days; the entire system revolves around this view |
| Automatic schedule generation | Core value — "one click for the whole month" | HIGH | Must apply all business rules: rest days, rotation, area coverage, split shifts |
| Manual shift override | Every auto-generated schedule needs correction capability | MEDIUM | Modal lateral per cell; must flag manually-set shifts visually |
| Month navigation | Users need to review past and plan ahead | LOW | Selector de mes; past months read-only or editable by policy |
| Employee list with area skills | The algorithm needs to know who can work where | MEDIUM | Pivot table employee ↔ area; 7 areas in this system |
| Rest day / absence recording | Vacaciones, incapacidades, permisos, calamidades, descansos | MEDIUM | Date-range vacations + single-day types; affects auto-generation |
| Area coverage rules by weekday | Different staffing counts per area per day | HIGH | E.g., Electrodoméstico needs 2 on L/M/J/V, 3 on Mié/Sáb |
| Excel export | Standard output format for printing/sharing | MEDIUM | Managers universally expect .xlsx export; format should mirror grid view |
| Authentication | Single-user admin login | LOW | email + password; no multi-role needed |
| Visual markers on schedule | Sundays highlighted, current day marked, manual shifts flagged | LOW | Pure UI; critical for scan-ability of the grid |

### Differentiators (Competitive Advantage)

Features that go beyond generic scheduling tools and match the complexity of this specific business domain. These are what make the system genuinely useful rather than just a digital spreadsheet.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Domain-specific rest rules (4/month, no Sat, no days 28–2) | Eliminates the #1 manual error in the current workflow | HIGH | Constraint engine must encode these rules precisely; wrong here = system is worse than paper |
| Split shift support ("7:00-11:00\|11:30-14:30") | Enables coverage patterns impossible with single time blocks | MEDIUM | Pipe-separated format; UI must render both blocks clearly per cell |
| Generation log / bitácora (info/warning/error badges) | Transparency when the algorithm had to make tradeoffs | MEDIUM | Users need to know why a shift looks unusual; builds trust in auto-generation |
| Timeline / coverage view (6:00–22:00 horizontal by area) | Manager can visually verify no coverage gaps before publishing | HIGH | Gantt-style view by area; different from the grid — shows overlap/gaps in real time |
| Area-specific scheduling rules (Marking Mar/Jue only, Varely Camacho Mié only, Buffet no domingo) | Encodes institutional knowledge that lives in the admin's head | HIGH | Must be data-driven, not hardcoded — area configs should be editable |
| Wildcard (comodín) shifts by weekday | Handles unplanned coverage needs without disrupting the core schedule | MEDIUM | Extra shifts available per day for improvised assignments |
| Morning/afternoon rotation equity (alternating weeks) | Fairness rule prevents employee complaints | MEDIUM | Algorithm tracks rotation state per employee across months |
| Day summary panel (coverage breakdown by area) | Quick verification of staffing levels for a given day | LOW | Sidebar panel; derived data from the grid |
| Employee profile panel | See all shifts, absences, area skills for one employee at a glance | LOW | Sidebar panel; helps admin answer "what is this person doing?" questions |
| Filters by area and absence type | Reduces visual noise in the grid when managing a specific segment | LOW | Column/row filtering on the main grid |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Mobile app (native) | Employees want to check their schedules on phone | This system has one admin user; a native app adds build/deploy/maintenance cost with zero benefit for the current use case | Web responsive is sufficient; admin works from desktop |
| Employee self-service (shift swap, time-off requests) | Standard in multi-employee tools | Adds approval workflows, notifications, and user accounts that are out of scope for a single-admin system | Admin manually records novedades via the existing interface |
| Multi-empresa / multi-almacén | "What if we expand?" | Adds database tenancy complexity before the core is stable | Architecture can accommodate it later with a tenant column; don't build it now |
| Payroll / ERP integration | Closes the loop on labor costs | Requires external system contracts, data mapping, and ongoing maintenance far outside the project scope | Export to Excel bridges the gap; payroll team processes it manually |
| Demand forecasting / AI scheduling | Modern platforms advertise this | Requires historical sales data that this system doesn't collect; the business rules are already well-defined and don't need ML | The deterministic algorithm with business rules is the correct approach here |
| Real-time push notifications to employees | "So employees always know their schedule" | No employee-facing accounts exist in this system | Print or share the Excel export; add employee portal in a future v2 if ever needed |
| Multi-admin roles / permissions | "What if the admin changes?" | One user, one role; YAGNI applies | Password change is sufficient; role system adds schema complexity for zero current benefit |

---

## Feature Dependencies

```
Authentication
    └──required by──> All other features (gate)

Employee List + Area Skills
    └──required by──> Automatic Schedule Generation
    └──required by──> Manual Shift Assignment
    └──required by──> Employee Profile Panel

Shift Templates (horarios por día/área)
    └──required by──> Automatic Schedule Generation
    └──required by──> Manual Shift Assignment

Area Coverage Rules
    └──required by──> Automatic Schedule Generation
    └──required by──> Timeline / Coverage View
    └──required by──> Day Summary Panel

Automatic Schedule Generation
    └──enhanced by──> Generation Log / Bitácora
    └──enhanced by──> Wildcard (Comodín) Shifts
    └──required by──> Month Navigation (to view generated months)

Monthly Schedule Grid
    └──required by──> Manual Shift Override
    └──required by──> Filters by Area / Absence Type
    └──required by──> Excel Export
    └──required by──> Visual Markers
    └──required by──> Day Summary Panel (sidebar)
    └──required by──> Employee Profile Panel (sidebar)

Absence / Leave Recording
    └──required by──> Automatic Schedule Generation (must skip absent employees)
    └──required by──> Filters by Absence Type

Timeline / Coverage View
    └──requires──> Area Coverage Rules
    └──requires──> Shift Templates
```

### Dependency Notes

- **Authentication required by everything:** Must be Phase 1. All other routes are protected.
- **Employee list + area skills required by generation:** Data model must be seeded with real employee/area data before the algorithm can run.
- **Shift templates required by generation:** The templates define what "morning" and "afternoon" mean per area/day — generation cannot produce meaningful output without them.
- **Area coverage rules required by timeline view:** The coverage view visualizes whether rules are being met; it can't work without the rules being defined in the system.
- **Absences required by generation:** The algorithm must check for existing novedades before assigning shifts; otherwise it schedules vacationing employees.
- **Grid required by export:** Excel export is a rendering of the grid; grid must exist first.

---

## MVP Definition

### Launch With (v1 — replica parity)

The goal is functional parity with the existing Laravel system. These are the non-negotiables.

- [ ] Authentication (email/password, single admin) — gateway to everything
- [ ] Employee management with area skills (pivot) — required by algorithm
- [ ] Shift templates configuration — required by algorithm
- [ ] Area coverage rules (7 areas, per-weekday counts) — required by algorithm and timeline view
- [ ] Monthly schedule grid (employees x days, paginated by month) — primary interface
- [ ] Automatic schedule generation (full month, day range, single day) — core value
- [ ] Business rules engine: 4 rest days/month, no-Sat rest, no-days-28-2 rest, rotation equity, split shifts, area-specific day restrictions, comodines
- [ ] Manual shift override (modal, with manual flag indicator) — essential correction capability
- [ ] Absence / leave recording (vacaciones rango, incapacidad, permiso, calamidad, descanso) — required by algorithm and admin workflow
- [ ] Generation log / bitácora (info/warning/error) — trust-building for auto-generation
- [ ] Timeline / coverage view (horizontal Gantt 6:00–22:00 by area) — coverage verification
- [ ] Excel export (.xlsx) — universal sharing format
- [ ] Visual markers (Sundays red, current day, manual shift indicator) — scan-ability
- [ ] Day summary panel (cobertura por área) — quick verification
- [ ] Employee profile panel sidebar — admin reference tool
- [ ] Filters by area and absence type — navigation in large grid
- [ ] Month clear (limpiar turnos y novedades) — reset capability

### Add After Validation (v1.x)

Features to consider if the system is adopted and the admin requests them.

- [ ] Print-optimized CSS for the schedule grid — trigger: admin prints from browser and complains about formatting
- [ ] Bulk absence recording (multiple employees, same date range) — trigger: admin reports vacation season is tedious
- [ ] Schedule "publish" state (draft vs. published) — trigger: admin accidentally shares incomplete schedules

### Future Consideration (v2+)

Defer until there is explicit demand.

- [ ] Employee portal (view own schedule, no admin capability) — requires multi-user auth, out of current scope
- [ ] Multi-almacén support — requires tenant architecture redesign
- [ ] Audit log (who changed what, when) — nice for compliance but not currently requested
- [ ] Integration with external HR system — blocked by external dependency; tackle only if explicitly contracted

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Authentication | HIGH | LOW | P1 |
| Monthly schedule grid | HIGH | MEDIUM | P1 |
| Automatic generation + business rules engine | HIGH | HIGH | P1 |
| Manual shift override | HIGH | MEDIUM | P1 |
| Employee + area skills data | HIGH | LOW | P1 |
| Shift templates | HIGH | MEDIUM | P1 |
| Area coverage rules | HIGH | MEDIUM | P1 |
| Absence / leave recording | HIGH | MEDIUM | P1 |
| Generation log / bitácora | HIGH | LOW | P1 |
| Excel export | HIGH | MEDIUM | P1 |
| Timeline / coverage view | HIGH | HIGH | P1 |
| Visual markers (Sundays, manual flag) | MEDIUM | LOW | P1 |
| Day summary panel | MEDIUM | LOW | P2 |
| Employee profile panel | MEDIUM | LOW | P2 |
| Filters by area / absence type | MEDIUM | LOW | P2 |
| Month clear | MEDIUM | LOW | P2 |
| Split shift display | HIGH | MEDIUM | P1 |
| Comodín (wildcard) shifts | MEDIUM | MEDIUM | P1 |

**Priority key:**
- P1: Must have for launch (replica parity)
- P2: Should have, included in first release but not blocking
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

This is a single-admin internal tool, not a commercial product. Competitor analysis is used only to validate what features are industry-standard vs. custom to this business.

| Feature | Industry Standard (When I Work, Homebase, Sling) | This System |
|---------|--------------------------------------------------|-------------|
| Schedule grid (employees x time) | Yes — universal | Yes, same concept |
| Auto-scheduling | Yes — but usually AI/demand-driven | Yes — deterministic rules engine (more appropriate for fixed staff) |
| Absence tracking | Yes — PTO/sick/vacation types | Yes — vacaciones, incapacidad, permiso, calamidad, descanso |
| Excel export | Yes — standard in all tools | Yes |
| Coverage view / timeline | Yes — common in mid-tier tools | Yes — 6:00-22:00 horizontal Gantt |
| Employee skill/area assignment | Yes (called "positions" or "roles") | Yes — 7 specific areas with per-employee pivot |
| Split shifts | Partial — some tools support it | Yes — explicit format "HH:MM-HH:MM\|HH:MM-HH:MM" |
| Generation log / audit trail | Rare in SMB tools | Yes — custom bitácora with severity badges |
| Domain-specific rest rules (no Sat, no days 28-2) | No — generic tools don't encode business-specific rules | Yes — core differentiator |
| Mobile app / employee self-service | Yes — industry standard | Explicitly out of scope for v1 |
| Payroll integration | Yes — premium tier feature | Explicitly out of scope |

---

## Sources

- [Top 10 Employee Scheduling Software Features — SelectHub](https://www.selecthub.com/employee-scheduling/employee-scheduling-software-requirements/)
- [Best Employee Scheduling Software 2025 — Lift HCM](https://lifthcm.com/article/best-employee-scheduling-software-2025)
- [Best Retail Scheduling Software — Connecteam](https://connecteam.com/best-retail-scheduling-software-solutions/)
- [Employee Scheduling for Retail — Workforce.com](https://workforce.com/buyers-guides/employee-scheduling-software-retail)
- [Employee Shift Scheduling (constraint programming) — Timefold](https://timefold.ai/model/employee-shift-scheduling)
- [Automating Shift Scheduling with Linear Programming — Walmart Global Tech Blog](https://medium.com/walmartglobaltech/automating-shift-scheduling-with-linear-programming-fe1720f13620)
- [Leave Management & Absence Tracking overview — Calamari](https://www.calamari.io/leave-management)
- [30 Best Employee Scheduling Software — People Managing People](https://peoplemanagingpeople.com/tools/best-employee-scheduling-software/)

---
*Feature research for: Employee shift management — retail department store (~30 employees, 7 areas)*
*Researched: 2026-03-24*
