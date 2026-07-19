GreenMind Phase 1 — Codex Prompt Pack (Angular 21 + Bootstrap)

How to use this file:


Give Codex the project directory (F:\ITI-Graduation-Project\GreenMind).
Also give Codex the file GreenMind_Frontend_SRS_Phase1.md (and the backend SRS if you have it) as reference context — paste it in, or drop it in the repo as /docs/frontend-srs.md and tell Codex to read it first.
Run Prompt 0 first in every new session — it sets the ground rules Codex must not violate.
Run the remaining prompts in order. Each one builds on the previous. Don't skip ahead — later prompts assume earlier files exist.
After each prompt, actually run ng serve and sanity-check before moving to the next one.



Prompt 0 — Project ground rules (run first, every session)

You are working inside an existing Angular 21 project called GreenMind, generated with
`ng new GreenMind` (CSS stylesheets, standalone components, no NgModules).

Read /docs/frontend-srs.md fully before writing any code. It is the source of truth for
scope, routes, screens, and API contracts. Do not implement anything it lists under
"Explicitly Excluded" or "Out of Scope" — specifically: no AI chat, no disease detection,
no compliance engine/badges, no reports, no notifications, no manual task create/edit/delete
UI, no timeline regeneration button, no farm profile editing form, no SuperAdmin/tenant
screens beyond Platform Admin farm/crop/destination/statistics management.

Tech constraints:
- Angular 21, standalone components only (no NgModules anywhere).
- Use the new built-in control flow syntax (@if, @for, @switch) instead of *ngIf/*ngFor.
- Use the `inject()` function instead of constructor injection where practical.
- Use Angular signals for local component state where it simplifies things; plain
  RxJS/Observables for HTTP calls via HttpClient.
- Styling: CSS + Bootstrap 5. Install with `npm install bootstrap` and import
  `bootstrap/dist/css/bootstrap.rtl.min.css` (the RTL build) globally in
  angular.json / styles.css — the whole app is Arabic RTL, so always use the RTL
  Bootstrap bundle, not the LTR one.
- Set `<html lang="ar" dir="rtl">` in index.html.
- All UI text is in Arabic. All code (variables, comments, file names) is in English.
- Routing: use a single top-level route config in app.routes.ts, with lazy-loaded
  standalone components via loadComponent, grouped by feature.
- HTTP: configure a base API URL in src/environments/environment.ts as `apiBaseUrl`.
  Every API service must build URLs from this, never hardcode http://localhost.

Folder structure to create (empty is fine for now, we'll fill it prompt by prompt):

src/app/
  core/
    auth/
    guards/
    interceptors/
    services/
    models/
  shared/
    components/
    validators/
  features/
    auth/
    farm/
    export-plans/
    admin/
  layout/

Do not generate any component, service, or route yet in this prompt — just confirm you've
read the SRS, set up the folder structure above, installed Bootstrap RTL, set index.html
lang/dir, and created environment.ts / environment.development.ts with an apiBaseUrl
placeholder (e.g. https://localhost:7000/api). Report back a short summary of what you
did, and list any ambiguity in the SRS you want me to resolve before continuing.


Prompt 1 — Core models, auth service, interceptors, guards

Implement the core authentication and HTTP plumbing for GreenMind, per /docs/frontend-srs.md
section 9 (API Integration Requirements) and section 7 (Routes).

1. In core/models/, create TypeScript interfaces matching the backend DTOs exactly:
   - user.model.ts: User { id: string; fullName: string; email: string; role: 'FarmOwner' | 'PlatformAdmin'; }
   - auth.model.ts: RegisterRequest { fullName, email, password, farmName }, LoginRequest { email, password },
     LoginResponse { token: string; user: User }

2. In core/services/auth.service.ts, create AuthService using inject(HttpClient):
   - register(payload: RegisterRequest): Observable<{ message: string }>
     POST `${apiBaseUrl}/auth/register`
   - login(payload: LoginRequest): Observable<LoginResponse> — on success, store the JWT
     and user in memory AND in a small wrapper around sessionStorage (not localStorage),
     expose a signal `currentUser` and a computed `isAuthenticated`.
   - logout(): calls POST `${apiBaseUrl}/auth/logout`, then clears stored token/user and
     navigates to /auth/login regardless of API result.
   - getCurrentUser(): Observable<User> — GET `${apiBaseUrl}/auth/me`, used on app bootstrap
     to rehydrate the signal if a token exists in storage.
   - token getter that reads from storage.

3. In core/interceptors/auth.interceptor.ts, create a functional HttpInterceptorFn that:
   - Attaches `Authorization: Bearer <token>` to every outgoing request if a token exists.
   - On a 401 response, clears stored auth state and redirects to /auth/login.
   Register it in app.config.ts via provideHttpClient(withInterceptors([authInterceptor])).

4. In core/guards/, create two functional guards (CanActivateFn):
   - auth.guard.ts: redirects to /auth/login if not authenticated.
   - role.guard.ts: factory function roleGuard(allowedRoles: Array<'FarmOwner'|'PlatformAdmin'>)
     that redirects to a shared "access denied" state (just navigate to /auth/login for now,
     we'll add a proper access-denied page in a later prompt) if the current user's role
     isn't in allowedRoles.

5. Do NOT build any login/register UI yet — that's the next prompt. Just the service layer,
   interceptor, and guards. Show me the files you created.


Prompt 2 — Auth screens (Register, Login)

Build the auth UI per SRS section 6.1, using Bootstrap RTL classes, standalone components,
lazy-loaded via loadComponent.

1. features/auth/register/register.component.ts (+html):
   - Reactive form: fullName, email, password, farmName — all required, email validator on
     email field.
   - On submit, call AuthService.register(). On success, don't log the user in — instead
     switch the component to a "pending approval" state showing:
     "تم إرسال طلب التسجيل بنجاح، بانتظار موافقة الإدارة" with a link back to /auth/login.
   - On error (e.g. duplicate email), show an inline Arabic error alert using the response's
     message field if present, otherwise a generic Arabic error.
   - Bootstrap card layout, centered, RTL-friendly (form-label, form-control, btn-primary,
     alert-danger for errors).

2. features/auth/login/login.component.ts (+html):
   - Reactive form: email, password.
   - On submit, call AuthService.login(). On success, redirect based on user.role:
     FarmOwner -> /export-plans, PlatformAdmin -> /admin/farms.
   - On error, distinguish (if the API error has errorCode === 'USER_INACTIVE' or similar)
     "حسابك بانتظار الموافقة" from a generic "بيانات الدخول غير صحيحة" — but degrade
     gracefully to a generic Arabic message if the errorCode isn't recognized.
   - Link to /auth/register.

3. Add both routes to app.routes.ts under path 'auth/register' and 'auth/login', both public
   (no guard).

4. Add a redirect: root path '' should redirect to /auth/login for now (we'll refine this
   once export-plans and admin routes exist).

Keep both components simple, no shared form component abstraction yet — just get them
working end to end against the interceptor/guard/service layer from Prompt 1.


Prompt 3 — Shared models, validators, and layout shells

Per SRS sections 8 (Component Requirements) and 13 (Accessibility), build the shared
building blocks the rest of the app depends on.

1. shared/models/ — create interfaces matching backend DTOs exactly:
   - farm.model.ts: Farm { id, ownerUserId, name, createdAt, isActive }
   - crop.model.ts: Crop { id, name, description, isActive }
   - destination.model.ts: Destination { id, name, description, isActive }
   - export-plan.model.ts:
     ExportPlanStatus = 'Draft' | 'Active' | 'Completed' | 'Cancelled'
     ExportPlan { id, farmId, cropId, destinationId, name, governorate, city, latitude,
       longitude, areaInFeddan, plantingDate, expectedHarvestDate, expectedExportDate,
       status: ExportPlanStatus, notes, createdAt }
     CreateExportPlanRequest — same shape minus id/farmId/status/createdAt.
     ExportPlanDashboard { cropName, destinationName, currentSeasonDay, seasonProgressPercent,
       growthStage, latestSoilMeasurement: SoilMeasurement | null, taskSummary: { pending,
       inProgress, completed, skipped }, upcomingTasks: Task[], completedTasks: Task[] }
   - task.model.ts:
     TaskStatus = 'Pending' | 'InProgress' | 'Completed' | 'Skipped'
     TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical'
     Task { id, exportPlanId, taskTypeId, taskTypeName, title, description, plannedDate,
       actualDate, status: TaskStatus, priority: TaskPriority, notes }
     UpdateTaskStatusRequest { status: TaskStatus, actualDate?: string, notes?: string }
   - soil-measurement.model.ts:
     SoilMeasurement { id, exportPlanId, measurementDate, ph, ec, nitrogen, phosphorus,
       potassium, moisture, notes }
     CreateSoilMeasurementRequest — same shape minus id/exportPlanId.

2. shared/validators/date-range.validator.ts — a reusable form-group validator
   dateAfterValidator(startControlName, endControlName) returning a validation error
   if end <= start. We'll use it for plantingDate/expectedHarvestDate/expectedExportDate.

3. shared/validators/numeric-range.validator.ts — rangeValidator(min, max) reusable
   Validator for PH (0-14) and non-negative fields.

4. shared/components/ — build these as small, presentational standalone components using
   Bootstrap badge classes, no business logic:
   - export-plan-status-badge.component.ts (maps status to Arabic label + bg-success/
     bg-secondary/bg-primary/bg-danger)
   - task-status-badge.component.ts (Arabic labels: قيد الانتظار / قيد التنفيذ / مكتملة / تم تخطيها)
   - task-priority-badge.component.ts (منخفضة / متوسطة / عالية / حرجة, with color coding
     that is NOT the only signal — always pair color with the Arabic text/icon per SRS
     accessibility rule)
   - growth-stage-badge.component.ts

5. layout/farm-owner-layout/ and layout/admin-layout/ — each a standalone component with
   an RTL Bootstrap navbar (using <router-outlet> for content):
   - Farm Owner navbar links: my farm read-only page, export plans list, logout.
   - Admin navbar links: farms, crops, destinations, statistics, logout.
   Both navbars show the current user's fullName and a logout button wired to
   AuthService.logout().

Don't wire these into routes yet beyond what's needed to preview them — just get them
building cleanly with `ng build`.


Prompt 4 — Farm (read-only) feature

Per SRS section 6.2, build the simplest feature first as a template for the API-service
pattern we'll repeat.

1. core/services/farm-api.service.ts:
   - getMyFarm(): Observable<Farm> — GET `${apiBaseUrl}/farm`

2. features/farm/farm-view/farm-view.component.ts (+html):
   - On init, calls FarmApiService.getMyFarm(), shows a Bootstrap card with farm name and
     created date. Show a loading spinner while fetching, and an Arabic error alert on
     failure ("تعذر تحميل بيانات المزرعة").
   - No edit/delete controls anywhere on this page — it is read-only, there is no backend
     endpoint for updating a farm in Phase 1.

3. Add route '/farm' under the FarmOwner layout, guarded by authGuard + roleGuard(['FarmOwner']).

4. Wire this route into the farm-owner-layout navbar from Prompt 3.


Prompt 5 — Export Plans: list + create

Per SRS sections 6.3 and 6.4, and API contracts in section 9/12.

1. core/services/crop-api.service.ts: listActiveCrops(): Observable<Crop[]> — GET
   `${apiBaseUrl}/crops`
   core/services/destination-api.service.ts: listActiveDestinations(): Observable<Destination[]>
   — GET `${apiBaseUrl}/destinations`
   core/services/export-plan-api.service.ts:
   - list(): Observable<ExportPlan[]> — GET `${apiBaseUrl}/export-plans`
   - create(payload: CreateExportPlanRequest): Observable<ExportPlan> — POST
     `${apiBaseUrl}/export-plans`
   - getById(exportPlanId: string): Observable<ExportPlan> — GET
     `${apiBaseUrl}/export-plans/${exportPlanId}`

2. features/export-plans/plan-list/plan-list.component.ts (+html):
   - Bootstrap table (RTL) with columns: plan name, crop, destination, planting date,
     expected harvest date, expected export date, status (use ExportPlanStatusBadge).
   - "إنشاء خطة تصدير جديدة" button navigating to /export-plans/new.
   - Clicking a row navigates to /export-plans/:id (the dashboard, built in Prompt 6).
   - If a plan's status is 'Draft', show a small warning note next to the badge:
     "لم يتم إنشاء المهام الأولية بنجاح" (per SRS 6.3 — surfacing failed initial planning).

3. features/export-plans/plan-create/plan-create.component.ts (+html):
   - Reactive form with fields exactly matching CreateExportPlanRequest (section 6.4 of SRS):
     name, cropId (select, populated from CropApiService), destinationId (select, populated
     from DestinationApiService), governorate, city, latitude, longitude, areaInFeddan,
     plantingDate, expectedHarvestDate, expectedExportDate, notes.
   - Apply dateAfterValidator twice: harvest after planting, export on/after harvest.
     Apply rangeValidator for areaInFeddan (> 0).
   - On submit, show a loading state with the exact Arabic copy:
     "جارٍ حفظ الخطة وتجهيز مهام الأسبوع الأول" (per SRS 6.4 — do not say "AI is planning").
   - On success, navigate to /export-plans/:id (the new plan's dashboard).
   - On a partial-failure response indicating initial planning failed, still navigate to
     the dashboard (the plan is saved) — the dashboard itself will show the failure banner,
     not this form.
   - Do NOT add any "regenerate" or "generate again" button anywhere in this component.

4. Add both routes under the FarmOwner layout, guarded by authGuard + roleGuard(['FarmOwner']):
   '/export-plans' -> plan-list, '/export-plans/new' -> plan-create.

5. Update root redirect: '' now redirects based on role — but since we don't have a role-aware
   redirect component yet, just make authGuard-protected '' redirect FarmOwners to
   /export-plans (we'll handle PlatformAdmin's default separately once admin routes exist
   in Prompt 9).


Prompt 6 — Export Plan workspace shell + Dashboard tab

Per SRS sections 6.5 and 6.6.

1. features/export-plans/plan-workspace/plan-workspace.component.ts (+html):
   - This is a shell component mounted at '/export-plans/:exportPlanId' with a nested
     <router-outlet> for the three tabs (dashboard/tasks/soil-measurements).
   - On init, reads exportPlanId from the route, calls ExportPlanApiService.getById() to
     get plan name/crop/destination/status, and calls ExportPlanApiService dashboard
     endpoint (add getDashboard(exportPlanId): Observable<ExportPlanDashboard> — GET
     `${apiBaseUrl}/export-plans/${exportPlanId}/dashboard` to export-plan-api.service.ts)
     to get currentSeasonDay for the persistent header.
   - Persistent header (Bootstrap card/banner) showing: plan name, crop, destination,
     ExportPlanStatusBadge, current season day.
   - Bootstrap nav-tabs linking to the three child routes (relative: dashboard, tasks,
     soil-measurements) using routerLink + routerLinkActive.
   - When the exportPlanId route param changes (switching plans), re-fetch everything —
     do not reuse stale state from a previous plan (per SRS section 10, state must clear
     on plan switch).

2. features/export-plans/plan-dashboard/plan-dashboard.component.ts (+html), mounted as the
   default child route (redirect '' -> 'dashboard' inside the workspace's child routes):
   - Displays everything from ExportPlanDashboard: crop/destination (can rely on parent
     header, or repeat lightly), season progress as a Bootstrap progress bar, growth stage
     badge, latest soil measurement mini-card (or "لا توجد قياسات بعد" if null), task
     summary as four count badges (Pending/InProgress/Completed/Skipped using
     TaskStatusBadge), upcoming tasks list (short, each linking into the tasks tab),
     completed tasks list (short, same).
   - If the parent plan's status is 'Draft' with a planning failure, show a prominent
     Arabic alert banner here: "تعذر إنشاء المهام الأولية لهذه الخطة" — with NO retry/
     regenerate button (not supported in Phase 1).
   - There must be no button anywhere on this page to generate, regenerate, or refresh
     planning — the rolling horizon is fully automatic server-side.

3. Nest the child routes (dashboard/tasks/soil-measurements) under
   '/export-plans/:exportPlanId' in app.routes.ts, all still guarded by
   authGuard + roleGuard(['FarmOwner']). Leave tasks/soil-measurements as placeholder
   components for now if not built yet — we'll fill them in Prompts 7 and 8.


Prompt 7 — Tasks tab

Per SRS section 6.7 and section 7 (Task Management) — this is the most constrained
screen in the app, read carefully.

1. Add to export-plan-api.service.ts or a new core/services/task-api.service.ts:
   - list(exportPlanId: string, filters?: { status?, priority?, taskTypeId?, from?, to? }):
     Observable<Task[]> — GET `${apiBaseUrl}/export-plans/${exportPlanId}/tasks` with query
     params for any provided filters.
   - getById(exportPlanId: string, taskId: string): Observable<Task> — GET .../tasks/${taskId}
   - updateStatus(exportPlanId: string, taskId: string, payload: UpdateTaskStatusRequest):
     Observable<Task> — PATCH .../tasks/${taskId}/status

2. features/export-plans/tasks/tasks.component.ts (+html):
   - Filter bar (Bootstrap form-select / date inputs) for status, priority, task type,
     planned date range — re-fetches the list on change.
   - Table or card list of tasks: title, description, task type, planned date, actual date,
     status badge, priority badge, notes (truncated with a "read more" if long).
   - For each task, a single action: "تحديث الحالة" opening a small modal/inline form with:
     a status select (Pending/InProgress/Completed/Skipped), an actualDate picker that
     becomes required and defaults to today when status is set to Completed, and a notes
     textarea. Submitting calls updateStatus() and refreshes the row in place.
   - CRITICAL: do not render any input, button, icon, or menu item for creating a task,
     editing title/description/plannedDate/taskType/priority, or deleting a task. These
     fields must be plain read-only text in the UI — there is no backend support and no
     UI affordance should imply otherwise.
   - After a successful status update, also refetch the plan dashboard's task summary if
     the user navigates back to the dashboard tab (simplest: just invalidate/refresh on
     tab switch, no need for real-time sync).

3. Wire this as the 'tasks' child route under the plan workspace.


Prompt 8 — Soil Measurements tab

Per SRS section 6.8.

1. core/services/soil-measurement-api.service.ts, all methods scoped by exportPlanId:
   - list(exportPlanId): Observable<SoilMeasurement[]> — GET .../soil-measurements
   - create(exportPlanId, payload: CreateSoilMeasurementRequest): Observable<SoilMeasurement>
     — POST .../soil-measurements
   - getById(exportPlanId, measurementId): Observable<SoilMeasurement> — GET .../{id}
   - update(exportPlanId, measurementId, payload): Observable<SoilMeasurement> — PUT .../{id}
   - delete(exportPlanId, measurementId): Observable<void> — DELETE .../{id}

2. features/export-plans/soil-measurements/soil-measurements.component.ts (+html):
   - History list/table, most recent measurementDate first: date, ph, ec, nitrogen,
     phosphorus, potassium, moisture, notes, edit/delete icon buttons per row.
   - "إضافة قياس جديد" button opening a reactive form (modal or inline) with all fields.
     Apply rangeValidator(0, 14) to ph, and a non-negative validator to ec/nitrogen/
     phosphorus/potassium/moisture.
   - Edit reuses the same form pre-filled, calling update() instead of create().
   - Delete opens a Bootstrap confirm modal before calling delete().
   - Do not add any AI-generated recommendation or suggestion text on this page — it's a
     pure data log per SRS 6.8 / FR-SOIL-007.
   - After any create/update/delete, the dashboard's "latest soil measurement" card should
     reflect it next time the user visits the dashboard tab (simple refetch-on-navigate is
     fine, no need for live sync across tabs).

3. Wire this as the 'soil-measurements' child route under the plan workspace.


Prompt 9 — Admin: Farms

Per SRS section 6.9.

1. core/services/admin-farm-api.service.ts:
   - listFarms(): Observable<Farm[]> — GET `${apiBaseUrl}/admin/farms`
   - getFarm(farmId): Observable<Farm> — GET `${apiBaseUrl}/admin/farms/${farmId}`
   - approveFarm(farmId): Observable<Farm> — PATCH `${apiBaseUrl}/admin/farms/${farmId}/approve`
   - activateFarm(farmId): Observable<Farm> — PATCH `${apiBaseUrl}/admin/farms/${farmId}/activate`
   - deactivateFarm(farmId): Observable<Farm> — PATCH `${apiBaseUrl}/admin/farms/${farmId}/deactivate`

2. features/admin/farms/farm-list/farm-list.component.ts (+html):
   - Bootstrap table: farm name, owner, created date, active/inactive badge, an "Approve"
     button shown only when the farm/owner is pending (inactive + never approved — if the
     API doesn't distinguish "pending" from "deactivated" explicitly, treat isActive===false
     as needing an Approve action AND keep an Activate/Deactivate toggle separately if the
     API response shape supports telling them apart; otherwise show both Approve and
     Activate/Deactivate and let the backend reject invalid transitions with a 409, surfaced
     as an Arabic toast).
   - Row click navigates to /admin/farms/:farmId detail view.

3. features/admin/farms/farm-detail/farm-detail.component.ts (+html):
   - Shows full farm details plus the same approve/activate/deactivate actions.

4. Add routes '/admin/farms' and '/admin/farms/:farmId' under the admin layout, guarded by
   authGuard + roleGuard(['PlatformAdmin']).

5. Update the root '' redirect logic so PlatformAdmin lands on /admin/farms by default
   (FarmOwner still lands on /export-plans, from Prompt 5).


Prompt 10 — Admin: Crops & Destinations

Per SRS sections 6.10 and 6.11. Build both together since they're structurally identical.

1. core/services/admin-crop-api.service.ts:
   - listAll / listActive (reuse CropApiService.listActiveCrops for the public list if the
     admin list endpoint is the same; if the backend has no separate admin listing endpoint,
     just reuse GET `${apiBaseUrl}/crops` for the table too)
   - create(payload: { name, description }): Observable<Crop> — POST `${apiBaseUrl}/admin/crops`
   - update(cropId, payload): Observable<Crop> — PUT `${apiBaseUrl}/admin/crops/${cropId}`
   - deactivate(cropId): Observable<Crop> — PATCH `${apiBaseUrl}/admin/crops/${cropId}/deactivate`

2. core/services/admin-destination-api.service.ts — identical shape against
   `${apiBaseUrl}/admin/destinations`.

3. features/admin/crops/crop-list/crop-list.component.ts (+html):
   - Table: name, description, active badge, edit button, deactivate button (only shown if
     active).
   - "إضافة محصول" button opens a small form (name, description) for create; edit reuses
     it prefilled for update.

4. features/admin/destinations/destination-list/destination-list.component.ts (+html):
   - Same pattern, for destinations.

5. Add routes '/admin/crops' and '/admin/destinations' under the admin layout, guarded by
   authGuard + roleGuard(['PlatformAdmin']). Add both to the admin navbar from Prompt 3.


Prompt 11 — Admin: Platform Statistics

Per SRS section 6.12.

1. core/services/admin-statistics-api.service.ts:
   - getStatistics(): Observable<{ totalFarms: number; activeFarms: number;
     inactiveFarms: number; totalExportPlans: number;
     plansByCrop: { cropName: string; count: number }[];
     plansByDestination: { destinationName: string; count: number }[]; }>
     — GET `${apiBaseUrl}/admin/statistics`
   (Adjust the exact response shape if the real backend DTO differs — treat this as the
   best-guess contract and keep the component's template driven off the service's return
   type so it's a one-place fix if the shape changes.)

2. features/admin/statistics/statistics.component.ts (+html):
   - Bootstrap cards/stat tiles: total farms, active farms, inactive farms, total export
     plans.
   - Two simple Bootstrap-styled bar/list breakdowns: plans by crop, plans by destination
     (a plain table is fine — no charting library needed for Phase 1).

3. Add route '/admin/statistics' under the admin layout, guarded by
   authGuard + roleGuard(['PlatformAdmin']). Add to admin navbar.


Prompt 12 — Final polish pass

Do a full pass over the app per SRS sections 12 (Validation and Error States), 13
(Accessibility and Localization), and 14 (Non-Functional Requirements). Specifically:

1. Add a global HTTP error handling layer: a small toast/alert service (Bootstrap toast
   component) that the interceptor or individual components can call on failed requests,
   with generic Arabic fallback messages ("حدث خطأ غير متوقع، حاول مرة أخرى") when the API
   doesn't provide a specific errorCode/message.

2. Audit every form (register, login, plan-create, task status update, soil measurement
   create/edit): confirm submit buttons disable while a request is in flight (no double
   submit), and every async action shows a Bootstrap spinner or disabled state.

3. Audit every table/badge for color-only meaning — status and priority badges must always
   pair color with Arabic text, never color alone.

4. Confirm `dir="rtl"` and Bootstrap's RTL bundle are applied everywhere, including inside
   any modals — check that icons/chevrons that imply direction (e.g. back arrows) are
   mirrored correctly.

5. Confirm route guards are wired on every single route from the SRS route table (section 7)
   — do a final diff against that table and flag any missing guard.

6. Confirm there is no leftover code, route, or menu item anywhere in the app referencing
   AI chat, disease detection, compliance, reports, notifications, manual task CRUD, or
   timeline regeneration — grep the codebase for these terms and remove any scaffolding
   Angular's schematics may have left behind.

Report back a checklist of what you verified and anything you had to fix.