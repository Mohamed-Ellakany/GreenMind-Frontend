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

