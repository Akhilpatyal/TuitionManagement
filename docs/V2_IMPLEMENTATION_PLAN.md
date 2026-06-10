# AcuMind V1 → V2 Implementation Plan

Turning the current single-institute portal into a multi-institute SaaS.

This document is the build order. Each phase lists **why**, **schema changes**, **backend**, **frontend**, **effort** (S = ~1 day, M = ~2–4 days, L = ~1 week+), and **dependencies**. Phases are ordered by dependency, not by roadmap number.

---

## Current state (V1 baseline)

- Roles: `ADMIN`, `STUDENT` only.
- Single tenant — no `Institute` concept; all data is global.
- "Batch" is a free-text string field (e.g. `Alpha Batch`) on `Student` and `Quiz`, not an entity.
- Already solid: Fees, Achievements (XP/badges/streaks), per-student AI reports, quizzes (AI + manual), attendance, materials, notifications.

**The hard truth:** ~6 of 8 roadmap sections depend on multi-tenancy + a real role system. That must come first.

---

## Phase 0 — Multi-Tenant Foundation  ⭐ blocking everything

**Why:** Every other SaaS feature needs "which institute does this row belong to?" Retrofitting this later is painful, so do it first.

**Schema**
- New `Institute` model: `id, name, slug, logoUrl?, primaryColor?, status, createdAt`.
- Expand `Role` enum → `SUPER_ADMIN | INSTITUTE_OWNER | TEACHER | STUDENT`.
- Add `instituteId` (FK → Institute) to every tenant-scoped table: `User`, `Student`, `Quiz`, `StudyMaterial`, `FeeHistory`, `Attendance`, `Notification`, `AIReport`.
- Migration: create one "Default Institute", backfill all existing rows' `instituteId` to it, map current `ADMIN` → `INSTITUTE_OWNER`.

**Backend**
- Put `instituteId` in the JWT (`signToken`/`TokenPayload`).
- Add a `getTenantScope(req)` helper and add `where: { instituteId }` to **every** Prisma query in `/api/*`. This is the bulk of the work and the highest-risk for data leaks if missed.
- `SUPER_ADMIN` bypasses the scope.

**Frontend**
- No new UI yet (foundation only); existing pages keep working under the default institute.

**Effort:** L · **Depends on:** nothing · **Risk:** high (every query must be scoped — needs careful review/tests).

---

## Phase 1 — Roles & Teacher Portal  (Roadmap #2)

**Why:** Lets owners delegate to teachers; first visible multi-role value.

**Schema**
- `User.role` already supports `TEACHER` after Phase 0.
- Optional `Teacher` profile fields or a `TeacherProfile` table (subjects taught, etc.).
- Link teachers ↔ batches (see Phase 2; can start with a simple `teacherId` on `Quiz`/`Attendance`).

**Backend**
- Owner-only endpoints to create/invite/disable teachers (reuse student-creation pattern).
- `requireAuth(['TEACHER','INSTITUTE_OWNER'])` on quiz/material/attendance/performance routes; teachers see only their assigned batches.

**Frontend**
- `/teacher/*` route group mirroring `/admin/*` (dashboard, quizzes, materials, attendance, student performance), scoped to the teacher.
- Owner page: "Manage Teachers".

**Effort:** M · **Depends on:** Phase 0.

---

## Phase 2 — Batch Management (real entity)  (Roadmap #3)

**Why:** Replaces fragile text "batch" with a managed entity; unlocks batch analytics and assignment.

**Schema**
- New `Batch` model: `id, instituteId, name, classLabel, timetable?(json), createdAt`.
- Many-to-many `Batch ↔ Teacher`, `Batch ↔ Student` (join tables).
- Replace string `batch` on `Quiz`/`Student` with `batchId` FK (migration maps existing strings → Batch rows).

**Backend**
- CRUD for batches; assign teachers/students; batch-scoped quiz assignment (extend existing `create_manual`/`generate_ai`).

**Frontend**
- Owner/teacher "Batches" page: create batch, assign people, view roster, timetable.

**Effort:** L · **Depends on:** Phase 0, 1 · **Risk:** medium (data migration from string → FK).

---

## Phase 3 — Super Admin + Subscriptions + White Label  (Roadmap #1, #8)

**Why:** The actual "sell it as SaaS" layer.

**Schema**
- `Subscription` model: `instituteId, plan, status, currentPeriodEnd, seats`.
- `Institute` branding fields (logoUrl, primaryColor, name) — already added in Phase 0; wire them in.

**Backend**
- Super Admin endpoints: create/suspend institutes, view all, manage subscriptions.
- Subscription gating middleware (block expired institutes).
- (Payments via Stripe — separate sub-task; can stub first.)

**Frontend**
- `/super-admin/*` panel: institute list, create institute, subscription status.
- White-label: load institute logo/colors/name dynamically (CSS variables from `Institute.primaryColor`); replace hardcoded "AcuMind".
- Custom domain = future (DNS + Vercel domains).

**Effort:** L · **Depends on:** Phase 0.

---

## Phase 4 — AI Batch Insights  (Roadmap #4)

**Why:** High-value differentiator for owners; mostly aggregation over existing data.

**Schema:** none (compute from existing attempts/attendance/fees), optional cached `BatchInsight` table.

**Backend**
- Aggregation endpoints: batch attendance trend, subject-wise accuracy, weak-topic rollup, at-risk students (low attendance/accuracy), Gemini-generated recommendations per batch.

**Frontend**
- Batch dashboard: trend cards + charts + "recommended actions".

**Effort:** M · **Depends on:** Phase 2 (needs real batches).

---

## Phase 5 — Admission & Inquiry CRM  (Roadmap #6)

**Why:** Independent module; doesn't block others. Good standalone selling point.

**Schema**
- `Inquiry` model: `instituteId, name, contact, status (INQUIRY→FOLLOWUP→DEMO→JOINED→REJECTED), notes(json), assignedTo, createdAt`.

**Backend:** CRUD + pipeline status transitions + convert-to-student.

**Frontend:** public inquiry form + internal Kanban/pipeline board + follow-up notes.

**Effort:** M · **Depends on:** Phase 0 only (can be built early/in parallel).

---

## Phase 6 — Achievement polish  (Roadmap #7)

**Why:** Mostly done; small additions.

**Schema:** add `level` derived from `xpPoints` (or a tiers table); optional `Title`.

**Backend:** compute level/title from XP on attempt submit.

**Frontend:** show level bar + titles on student dashboard/leaderboard.

**Effort:** S · **Depends on:** nothing.

---

## Recommended build order

```
Phase 0  (foundation)        ← must be first
   ├─ Phase 1  (teachers)
   │     └─ Phase 2  (batches)
   │            └─ Phase 4  (batch AI insights)
   ├─ Phase 3  (super admin / subscriptions / white-label)
   ├─ Phase 5  (CRM)         ← parallelizable after Phase 0
   └─ Phase 6  (achievements)← anytime, independent
```

## Cross-cutting must-dos

- **File storage:** move uploads to Vercel Blob / S3 before real customers (Vercel FS is read-only). Per-institute folders.
- **Tenant isolation tests:** automated checks that no endpoint leaks across `instituteId`.
- **HTML sanitization** for written notes once non-admins (teachers) can author content.
- **Seeding:** update `seed.ts` to create a demo institute + owner + teacher + students.

## Suggested first milestone (sellable)

Phase 0 + 1 + 2 + 3 = a real multi-institute platform with owners, teachers, batches, and branding. That's the minimum to onboard the first paying institute. Phases 4–6 are upsells/retention.
