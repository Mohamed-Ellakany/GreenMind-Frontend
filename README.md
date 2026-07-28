# GreenMind frontend

Angular frontend for the GreenMind API. Authentication, farmer export plans/tasks/dashboards, planning progress, and administrator master-data screens use the backend API through the development proxy.

## Prerequisites

- Node.js 22.12 or newer in the supported 22.x line (verified with 22.22.3)
- npm 11
- The backend running at `https://localhost:7132`

## Install and run

Run these commands from `GreenMind-Frontend`:

```powershell
npm ci
npm start
```

Open `http://localhost:4200`. Requests beginning with `/api` are proxied to the HTTPS backend configured in `proxy.conf.json`, so no browser CORS configuration is needed during local development.

## Test the full flow

1. Register a new farm owner in the frontend.
2. Log in as `admin@local` with `ChangeMe!P@ssw0rd` and approve the new farm in Accounts.
3. Log out, then log in as the farm owner.
4. Open Export Plans and create a plan whose expected export date is in the future.
5. The plan appears immediately. Its AI planning badge moves through Pending and In Progress to Succeeded.
6. Open Dashboard or Activities to view and complete the generated tasks.
7. If external AI or weather configuration fails, the plan shows Failed and exposes a Retry action.

## Build and test

```powershell
npm run build
npm test -- --watch=false
```
