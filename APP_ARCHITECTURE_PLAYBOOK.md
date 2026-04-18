# App Architecture Playbook (Reusable Blueprint)

## Purpose
Use this document as a practical architecture template for health apps (or any full-stack app) deployed on Azure.
It captures what this project does today, what failed during migration, and the reusable patterns to keep future projects stable.

---

## 1) Reference Architecture (Current Project)

### Stack
- Frontend: React + Vite + TypeScript
- Backend API: Express + tRPC
- Data access: Drizzle ORM (MySQL driver)
- Auth: Custom username/password + session cookies
- Infra: Azure App Service + Azure Blob Storage + managed DB

### Runtime topology
1. Browser calls app routes and tRPC endpoints.
2. Express server handles auth/session and API logic.
3. DB layer (`server/db.ts`) initializes Drizzle with MySQL-compatible URL.
4. Blob storage layer handles media uploads.
5. Health endpoints expose service and DB readiness.

### Critical constraint
The ORM and schema are MySQL-based.
If you configure Azure SQL Database (SQL Server style connection string), current DB driver is incompatible.

---

## 2) Layered Design (Use This In Future Projects)

### Presentation layer
- Responsibilities:
  - Forms, navigation, validation UX, loading and error states.
- Rules:
  - Never embed infrastructure assumptions in UI.
  - Display backend error messages safely and clearly.

### API/Application layer
- Responsibilities:
  - Input validation, auth, orchestration, transaction boundaries.
- Rules:
  - Keep route handlers thin.
  - Move DB-specific logic to repository/data layer.

### Data layer
- Responsibilities:
  - Connection lifecycle, CRUD/query functions, schema mappings.
- Rules:
  - One source of truth for connection string resolution.
  - Detect incompatible connection formats early at startup.
  - Add health diagnostics that are environment-safe.

### Infrastructure layer
- Responsibilities:
  - Hosting, app settings, secrets, storage, monitoring.
- Rules:
  - Treat environment mapping as code.
  - Verify settings with health checks immediately after deploy.

---

## 3) Request/Data Flow Patterns

### Signup flow (recommended pattern)
1. Client validates required fields and password rules.
2. Client sends `auth.signup` mutation.
3. API validates schema and calls user creation service.
4. Service requests DB handle from shared DB bootstrap.
5. If DB unavailable/incompatible, return typed error reason.
6. On success, create session token and set cookie.

### Health flow (recommended pattern)
1. `/api/healthz` confirms API process is alive.
2. `/api/healthz/db` confirms DB configuration compatibility and connection status.
3. Azure monitoring probes both endpoints.

---

## 4) Environment Strategy (Most Important Migration Lesson)

### Problem we hit
The app moved from Manus defaults to Azure infrastructure, but runtime DB settings were ambiguous.
Result: signup failed with "Database not available" because no usable DB connection was initialized.

### Reusable strategy
1. Define one canonical resolver for DB connection input.
2. Track source (`DATABASE_URL`, fallback, etc.) for diagnostics.
3. Validate format compatibility before trying to connect.
4. Expose compatibility and status through startup logs + health endpoint.

### Suggested env conventions
- `DATABASE_URL` (preferred): MySQL/TiDB URL used by app runtime.
- `AZURE_SQL_CONNECTION_STRING` (optional fallback): only if it is MySQL-compatible in your architecture.
- If using SQL Server, migrate data layer/driver explicitly instead of reusing MySQL wiring.

---

## 5) Deployment Blueprint (Azure)

### Build and release
1. Build frontend bundle.
2. Bundle backend entrypoint.
3. Deploy to App Service.
4. Inject app settings/secrets.
5. Restart app.
6. Validate `/api/healthz` and `/api/healthz/db`.

### Post-deploy verification checklist
- API responds 200 at `/api/healthz`.
- DB endpoint returns `ok: true` at `/api/healthz/db`.
- Signup succeeds end-to-end.
- Session cookie is issued and retained.
- Blob storage upload path still works.

### Rollback criteria
- `/api/healthz/db` becomes 503 after release.
- Auth/signup regression.
- Persistent 5xx on API routes.

---

## 6) Observability and Failure Taxonomy

### Required logs at startup
- Node/app version
- environment mode
- DB health summary (`ok`, `reason`, `source`)

### Error categories to standardize
- `missing_connection_string`
- `incompatible_sql_server_connection_string`
- `connection_failed`
- `connected`

### Why this helps
It reduces MTTR by turning generic user-facing errors into immediately actionable infrastructure signals.

---

## 7) Reusable Project Skeleton

```text
client/
  src/
    pages/
    components/
    lib/
server/
  _core/
    index.ts        # server bootstrap
    env.ts          # typed env access
  routers.ts        # API router composition
  auth.ts           # auth service
  db.ts             # DB bootstrap + data functions + diagnostics
drizzle/
  schema.ts
  migrations/
```

Keep these boundaries strict:
- `env.ts` owns env parsing and defaults.
- `db.ts` owns compatibility checks and connection bootstrap.
- Route files do not parse env directly.

---

## 8) Decision Record Template (Copy For Future Projects)

```md
# ADR-00X: Database Engine and Driver Choice

## Context
- Project requirements
- Hosting/runtime constraints
- Existing schema/tooling

## Decision
- Engine: (MySQL / Postgres / SQL Server)
- Driver/ORM: (Drizzle mysql2 / pg / mssql / etc.)
- Canonical env variable(s)

## Consequences
- Migration complexity
- Operational checks required
- Compatibility boundaries

## Validation
- Health endpoints
- Integration tests
- Rollback trigger
```

---

## 9) Future-Project Kickoff Checklist

1. Pick DB engine first (before coding schema).
2. Lock ORM driver to that engine.
3. Define canonical env names and fallback rules.
4. Implement startup diagnostics in week 1.
5. Add `/healthz` + `/healthz/db` before feature work.
6. Add one auth integration test in CI.
7. Add deployment verification runbook in repo.
8. Document rollback criteria before first production deploy.

---

## 10) Practical Notes For This Repository

- Current DB layer expects MySQL-compatible connection strings.
- If you move to Azure SQL Database (SQL Server), plan a deliberate migration:
  - schema migration strategy
  - ORM/driver update
  - query compatibility audit
  - integration tests for auth and core read/write paths

Use this playbook as your default architecture baseline, then create project-specific ADRs for intentional deviations.
