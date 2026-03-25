---
phase: 1
slug: fundaci-n
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-24
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x |
| **Config file** | vitest.config.ts (Wave 0 installs) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | 01 | 1 | DATA-01 | unit | `npx vitest run prisma/seed.test.ts` | Plan 01 Task 3 | ⬜ pending |
| TBD | 01 | 1 | DATA-02 | unit | `npx vitest run prisma/seed.test.ts` | Plan 01 Task 3 | ⬜ pending |
| TBD | 01 | 1 | DATA-04 | unit | `npx vitest run prisma/seed.test.ts` | Plan 01 Task 3 | ⬜ pending |
| TBD | 01 | 1 | DATA-05 | unit | `npx vitest run prisma/seed.test.ts` | Plan 01 Task 3 | ⬜ pending |
| TBD | 01 | 1 | AUTH-01 | integration | `npx vitest run` | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | AUTH-02 | integration | `npx vitest run` | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | AUTH-03 | integration | `npx vitest run` | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | AUTH-04 | integration | `npx vitest run` | ❌ W0 | ⬜ pending |
| TBD | 03 | 3 | DATA-03 | integration | `npx vitest run lib/actions/employees.test.ts` | Plan 03 Task 1 | ⬜ pending |
| TBD | 01 | 1 | INF-01 | manual | Docker build & run | N/A | ⬜ pending |
| TBD | 01 | 1 | INF-02 | manual | Visual inspection | N/A | ⬜ pending |
| TBD | 01 | 1 | INF-03 | manual | Visual inspection | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `vitest` + `@vitest/coverage-v8` — test framework install (Plan 01 Task 1)
- [x] `vitest.config.ts` — vitest configuration (Plan 01 Task 1)
- [x] `prisma/seed.test.ts` — seed data verification (Plan 01 Task 3)
- [x] `lib/actions/employees.test.ts` — toggle logic verification (Plan 03 Task 1)

*All Wave 0 test files are now created within their respective plans.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Docker build succeeds and app runs | INF-01 | Requires Docker daemon | `docker build -t gestion-turnos .` then `docker run -p 3000:3000 gestion-turnos` |
| Dark mode + glassmorphism renders correctly | INF-02 | Visual design verification | Open login page, verify dark background, glass card effect |
| Spanish locale throughout interface | INF-03 | Visual/language verification | Navigate all pages, verify Spanish labels, days, months |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
