# HumanAIze MVP Execution Plan

Date: 2026-04-15

## Objective
Ship a focused MVP that is a simple tracker with useful insights, using manual-first workflows and minimal screens.

## Success Criteria
- New user can sign up/login with email/password
- User can enter glucose, meals, exercise, and weight manually
- Dashboard shows daily glucose trend and basic meal/glucose correlation
- Insights are primarily rule-based and actionable
- Simple reminders drive daily logging behavior
- Core UX is limited to 4 MVP screens

## Priority Order

### P0 (Week 1-2): Must Have for MVP

1. Manual glucose entry flow
- Add backend endpoints for create/list glucose entries (manual source)
- Add Add Entry UI section for glucose value, timestamp, notes
- Validate entries and show same-day list
- Files likely touched:
  - server/routers.ts
  - server/db.ts
  - client/src/pages/Monitoring.tsx or new Add Entry page

2. Exercise logging persistence
- Wire workouts form to backend mutation and persisted storage
- Store: exercise type, duration, optional calories/notes, timestamp
- Show recent workout history from DB
- Files likely touched:
  - client/src/pages/Workouts.tsx
  - server/routers.ts
  - drizzle/schema.ts and migration (if needed)
  - server/db.ts

3. Open Food Facts API food search
- Add Open Food Facts API-backed search for quick food lookup in manual meal logging
- Normalize response fields to app macros model (calories, protein, carbs, fat, serving size)
- Include sugar nutrition import for scanned/search foods (grams of sugar per serving)
- Add fallback behavior for no-match and rate-limit/error cases
- Files likely touched:
  - server/routers.ts
  - server/foodSearch or barcode integration files
  - client/src/components/FoodLogger.tsx
  - client/src/components/AddFoodModal.tsx

4. Diabetes type in profile
- Add diabetesType field to user profile schema + migration
- Add zod validation and profile upsert/read support
- Add profile form field (Type 1, Type 2, Prediabetes, Gestational, Other)
- Files likely touched:
  - drizzle/schema.ts
  - drizzle/migrations/*.sql
  - server/routers.ts
  - server/db.ts
  - client/src/pages/Profile.tsx

5. Basic reminders (2 reminders)
- Add reminder preferences (meal reminder, post-meal glucose reminder)
- Add lightweight scheduled notifier path (start with in-app prompt/toast)
- Keep configurable and easy to disable
- Files likely touched:
  - client/src/pages/Profile.tsx (preferences)
  - server/routers.ts
  - server/backgroundSync.ts or dedicated reminder job

6. Stable auth hardening and regression checks
- Keep email/password as default MVP path
- Add test coverage for signup/login fallback path on Azure SQL
- Files likely touched:
  - server/auth.ts
  - server/routers.ts
  - server/*.test.ts

### P1 (Week 3): MVP Alignment

6. Dashboard meal/glucose correlation card
- Add simple rule-based metric: high-carb meal followed by elevated glucose window
- Render one basic chart/card on dashboard
- Files likely touched:
  - server/db.ts
  - server/routers.ts
  - client/src/pages/Dashboard.tsx

7. Rule-based insights first
- Implement deterministic rules for 3 MVP insights:
  - spikes after meals > 60g carbs
  - morning workouts improve stability
  - late-night eating correlates with higher fasting glucose
- Keep LLM insights optional behind feature flag
- Files likely touched:
  - server/insights.ts
  - server/routers.ts
  - client/src/components/CGMSection.tsx

8. Goal taxonomy alignment
- Support MVP terms: fat loss, control, performance
- Map to current internal enums where needed
- Files likely touched:
  - client/src/pages/Profile.tsx
  - server/routers.ts
  - drizzle/schema.ts (if enum update required)

### P2 (Week 4): Scope Reduction and Launch Readiness

9. 4-screen MVP shell
- Keep only: Login/Signup, Dashboard, Add Entry, Insights
- Move other routes behind non-MVP flag
- Files likely touched:
  - client/src/App.tsx
  - client/src/components/DashboardLayout.tsx

10. Hide non-MVP integrations/features
- De-emphasize source integrations, advanced assistant, and extra pages
- Keep manual-first user journey front-and-center
- Files likely touched:
  - client/src/pages/Monitoring.tsx
  - client/src/pages/Sources.tsx
  - client/src/pages/Assistant.tsx

11. UAT and release checklist
- Signup/login, data entry, dashboard, insights, reminders
- Error handling and empty states
- Minimal smoke test script for production endpoints

## Tracking Checklist
- [x] Live signup/login fixed in production
- [ ] Manual glucose entry end-to-end
- [ ] Exercise persistence end-to-end
- [ ] Open Food Facts API food search integration
- [ ] Sugar nutrition import for food scan/search
- [ ] Diabetes type profile field
- [ ] Basic reminders
- [ ] Dashboard meal/glucose correlation
- [ ] Rule-first insights
- [ ] Goal taxonomy alignment
- [ ] 4-screen MVP shell
- [ ] Non-MVP feature gating

## Deployment Notes
- Continue using scripts/azure-deploy.ps1 for deployment
- Validate /api/healthz and /api/healthz/auth after each release
- Keep direct tRPC signup/login smoke tests in release checklist
