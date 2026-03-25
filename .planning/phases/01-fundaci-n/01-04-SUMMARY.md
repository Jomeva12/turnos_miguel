---
phase: 01-fundaci-n
plan: "04"
subsystem: infra
tags: [docker, dockerfile, docker-compose, prisma, easypanel, standalone, timezone]

# Dependency graph
requires:
  - "next.config.ts output:'standalone' (Plan 01) — required for Dockerfile standalone copy"
  - "prisma/migrations/ (Plan 01) — copied into runner stage for migrate deploy"
  - "better-auth (Plan 02) — BETTER_AUTH_SECRET/URL env vars in docker-compose"
provides:
  - "Dockerfile — 3-stage multi-stage build (deps/builder/runner) for Next.js standalone"
  - "docker-compose.yml — app + postgres:16-alpine services for local testing and EasyPanel"
  - "docker-entrypoint.sh — runs prisma migrate deploy then node server.js"
  - ".dockerignore — excludes node_modules, .next, .env, .planning from build context"
  - ".env.example — documents DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, TZ"
affects: [deployment, easypanel, all-phases-using-docker]

# Tech tracking
tech-stack:
  added: [docker, docker-compose, postgres:16-alpine]
  patterns:
    - "Multi-stage Dockerfile: deps → builder → runner (only production artifacts in final image)"
    - "TZ=America/Bogota set as ENV in Dockerfile AND in docker-compose environment — belt and suspenders"
    - "prisma migrate deploy in entrypoint (not dev) — no interactive prompts, safe for production"
    - "tzdata apk package in runner stage — required for TZ env var to actually affect date formatting"

key-files:
  created:
    - "Dockerfile — 3-stage build: node:20-alpine base, prisma generate in builder, standalone copy in runner"
    - "docker-compose.yml — postgres:16-alpine + app services, pgdata volume, env vars"
    - "docker-entrypoint.sh — sh script: prisma migrate deploy + node server.js"
    - ".dockerignore — excludes build noise and secrets from Docker build context"
    - ".env.example — template for required environment variables"
  modified: []

key-decisions:
  - "apk add --no-cache tzdata in runner: Alpine Linux doesn't include timezone data by default; without it TZ env var is silently ignored"
  - "Copy node_modules/.prisma and node_modules/@prisma into runner: Prisma CLI needs these for migrate deploy, not just the generated client"
  - "BETTER_AUTH_SECRET defaults to 'local-dev-secret-change-in-production' in docker-compose: allows zero-config local testing without .env"
  - "prisma migrate deploy NOT prisma migrate dev: deploy applies pending migrations silently, dev has interactive prompts and creates new migrations"

patterns-established:
  - "Docker: copy prisma/ directory AND node_modules/.prisma + node_modules/@prisma into runner for migrate deploy"
  - "Entrypoint pattern: sh set -e, migrate, then start node"

requirements-completed: [INF-01]

# Metrics
duration: 10min
completed: "2026-03-24"
---

# Phase 1 Plan 04: Docker configuration for EasyPanel deployment

**Multi-stage Dockerfile with TZ=America/Bogota, prisma migrate deploy entrypoint, and docker-compose for local + EasyPanel deployment**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-24T17:08:23Z
- **Completed:** 2026-03-24T17:13:00Z
- **Tasks:** 2/2 (complete — Task 2 approved by admin)
- **Files modified:** 5 created

## Accomplishments

- Created 3-stage Dockerfile (deps/builder/runner) using node:20-alpine, with `npx prisma generate` in builder and standalone output copy in runner
- Created docker-compose.yml with postgres:16-alpine and app services; TZ=America/Bogota set explicitly; pgdata volume for persistence
- Created docker-entrypoint.sh running `prisma migrate deploy` before `node server.js` (migrate deploy is safe for production, no interactive prompts)
- Added tzdata Alpine package so TZ env var actually affects date formatting (critical — without it Alpine silently ignores TZ)
- .env.example documents all required variables for EasyPanel configuration

## Task Commits

1. **Task 1: Dockerfile, docker-compose, and entrypoint script** — `bc8c5e4` (feat)
2. **Task 2: Verify Phase 1 end-to-end in Docker** — APPROVED by admin (2026-03-24)

## Files Created/Modified

- `Dockerfile` — 3-stage multi-stage build; TZ=America/Bogota ENV; tzdata apk; standalone copy; prisma dirs copied for migrate deploy
- `docker-compose.yml` — postgres:16-alpine + app; TZ env; BETTER_AUTH_SECRET with local dev default; pgdata volume
- `docker-entrypoint.sh` — sh set -e; prisma migrate deploy; node server.js
- `.dockerignore` — excludes node_modules, .next, .git, .env, .env.local, .planning
- `.env.example` — DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, TZ

## Decisions Made

- **tzdata package required:** Alpine Linux omits timezone data; without `apk add --no-cache tzdata`, the TZ=America/Bogota env var is silently ignored and dates shift by 5 hours.
- **Prisma dirs in runner:** Both `node_modules/.prisma` and `node_modules/@prisma` must be copied into runner stage for `prisma migrate deploy` to work — not just the schema/migrations.
- **migrate deploy vs dev:** `prisma migrate deploy` is non-interactive and only applies pending migrations — correct for container entrypoints. `prisma migrate dev` creates new migrations and has prompts — wrong for production.
- **BETTER_AUTH_SECRET default:** docker-compose uses `${BETTER_AUTH_SECRET:-local-dev-secret-change-in-production}` so `docker compose up` works with zero configuration for local testing.

## Deviations from Plan

**1. [Environment] Docker CLI not available in execution environment**
- **Found during:** Task 1 verification step
- **Issue:** `docker compose build` verification could not run because Docker is not installed in the agent's execution environment
- **Resolution:** `npm run build` passed successfully (confirming all code compiles), and Docker config was verified by code review against plan specifications. Human verification in Task 2 will validate the actual Docker build.
- **Impact:** None — Task 2 checkpoint covers the full Docker verification.

## Issues Encountered

- Docker not installed in agent environment — `npm run build` used as pre-verification. Full Docker verification delegated to Task 2 human checkpoint.

## User Setup Required

None — docker-compose handles all services. Run `docker compose up -d` for local testing.

## Next Phase Readiness

- Docker configuration complete and verified by admin
- Phase 1 fully complete — all 4 plans done, all features verified end-to-end in Docker
- Phase 2 (Algoritmo de Generacion) ready to begin

---
*Phase: 01-fundaci-n*
*Completed: 2026-03-24*

## Self-Check: PASSED

Files confirmed on disk:
- Dockerfile: FOUND
- docker-compose.yml: FOUND
- docker-entrypoint.sh: FOUND
- .dockerignore: FOUND
- .env.example: FOUND

Task 1 commit bc8c5e4 confirmed in git history.
Port change commit 6dee3aa confirmed in git history.
Task 2: human verification approved by admin.
