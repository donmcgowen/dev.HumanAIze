# Azure Database Migration Guide (Human-Readable)

## Who this is for
This guide is for builders who want to move an app from a default platform database setup (like Manus) to Azure, without breaking signup/login and core API flows.

It is written in plain language and based on your current project patterns.

---

## TL;DR (Fast answer)
Your current app uses:
- Drizzle ORM with the MySQL driver
- MySQL-style schema and migrations

So you have 2 choices:

1. **Recommended for speed and low risk**: stay MySQL-compatible on Azure (Azure Database for MySQL, TiDB, etc.)
2. **Bigger migration**: move fully to Azure SQL Database (SQL Server), which requires data-layer and query migration

If you want to learn while shipping quickly, do Path 1 now and Path 2 later as a planned project.

---

## Step 0: Decide your migration path

### Path 1: Keep MySQL-compatible DB on Azure
Choose this when:
- You want fastest stable release
- You want minimal code changes
- Your existing schema/migrations already work

### Path 2: Migrate to Azure SQL Database (SQL Server)
Choose this when:
- You need SQL Server features specifically
- You can invest in migration and testing effort
- You accept larger refactor scope

---

## Current app reality (important)
Your repository currently expects MySQL-compatible connection behavior in the active DB code path.

Because of that:
- SQL Server format strings (for Azure SQL Database) are incompatible with the current MySQL driver path.
- If you set only a SQL Server-style string, signup can fail with database-not-available behavior.

---

## Path 1 Guide: MySQL-compatible on Azure (recommended now)

## 1. Provision database
Use one of:
- Azure Database for MySQL Flexible Server
- TiDB Cloud deployed in Azure region
- Another managed MySQL-compatible service

## 2. Get connection string
You want a URL like:

```text
mysql://user:password@host:3306/database
```

## 3. Configure App Service settings
In Azure App Service configuration:
- Set `DATABASE_URL` to your MySQL-compatible URL
- Keep other settings (JWT secret, storage keys, etc.) as before

Tip:
- Prefer `DATABASE_URL` as canonical runtime setting.

## 4. Apply migrations
Run your schema migrations against the new database before switching traffic.

## 5. Restart app
After settings and migrations, restart App Service.

## 6. Verify health endpoints
Check:
- `/api/healthz` should return healthy API status
- `/api/healthz/db` should return `ok: true`

## 7. Verify user journey
Test this exact flow:
1. Open signup page
2. Create account
3. Confirm login works
4. Confirm session cookie persists

## 8. Rollback plan
If anything fails:
1. Revert `DATABASE_URL` to previous known-good value
2. Restart App Service
3. Re-test `/api/healthz/db` and signup

---

## Path 2 Guide: Full Azure SQL Database migration (planned project)

This is a real migration, not just a config change.

## 1. Plan scope first
Document:
- Which tables must move
- Which queries are MySQL-specific
- Which ORM/driver changes are required

## 2. Pick target data access strategy
Common options:
- Keep Drizzle but move to SQL Server-compatible setup (if fully supported for your query surface)
- Move to another SQL Server-capable data library/ORM
- Use `mssql` query layer where needed

## 3. Build compatibility matrix
For each critical query group:
- Auth
- Profile
- Dashboard reads
- Logging/inserts

Mark each as:
- Works unchanged
- Needs SQL syntax updates
- Needs library/driver rewrite

## 4. Add parallel test environment
Create staging with:
- Azure SQL Database
- Same API build
- Isolated test traffic

## 5. Migrate schema and data
- Recreate schema in SQL Server style
- Move data in controlled batches
- Verify row counts and key integrity

## 6. Update code incrementally
Migrate by module (auth first):
1. DB bootstrap
2. Auth create/login
3. Core reads/writes
4. Secondary features

## 7. Add migration safety checks
Before go-live:
- Integration tests for signup/login
- DB health endpoint green
- Error rate baseline in logs

## 8. Cutover strategy
Use phased rollout:
1. Internal users only
2. Small percentage of traffic
3. Full traffic after metrics stay stable

## 9. Rollback strategy
Always keep fallback path available during rollout window.
If failures spike:
- Route traffic back to previous DB path
- Revert data-layer build
- Run incident review before retrying

---

## Human-friendly warning signs and what they mean

- "Database not available": app could not create usable DB client
- DB health says missing connection string: App Service settings not fully configured
- DB health says incompatible SQL Server string: running MySQL driver against SQL Server format
- Signup fails but API alive: likely DB config/compatibility issue, not frontend

---

## Suggested learning progression

If your goal is to learn and ship:
1. Complete Path 1 and stabilize production
2. Capture metrics and pain points
3. Run Path 2 as a structured upgrade project
4. Use staging and incremental module migration

This gives you real migration experience without forcing a risky big-bang switch.

---

## Reusable checklist (copy/paste for future projects)

## Pre-migration
- [ ] Identify current ORM and DB driver
- [ ] Confirm target DB engine compatibility
- [ ] Define canonical runtime env vars
- [ ] Add DB health endpoint

## Migration execution
- [ ] Provision target DB
- [ ] Apply schema/migrations
- [ ] Configure app settings
- [ ] Restart app
- [ ] Validate health endpoints
- [ ] Test signup/login and one critical read path

## Post-migration
- [ ] Monitor errors and latency
- [ ] Verify user account creation success rate
- [ ] Keep rollback path for defined window
- [ ] Document lessons learned

---

## Project-specific recommendation for your app

Right now, choose **Path 1 (MySQL-compatible on Azure)** for fastest reliable progress.
Then plan **Path 2 (Azure SQL Database)** as a separate migration milestone when you are ready to refactor data access safely.
