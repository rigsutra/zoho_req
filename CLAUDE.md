# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (run both together in separate terminals)
npx convex dev          # Start Convex backend (watches convex/ folder)
npm run dev             # Start Vite frontend dev server

# Build
npm run build           # tsc -b && vite build

# Preview production build
npm run preview
```

There is no test runner configured in this project.

## Architecture Overview

This is a full-stack HR management app ("People of Podtech") with:
- **Frontend**: React 19 + Vite + Tailwind CSS v4 + React Router v7
- **Backend**: [Convex](https://convex.dev) — serverless real-time database + functions
- **Auth**: [Clerk](https://clerk.com) — handles sign-in/up; synced to Convex via webhook (`convex/http.ts`) and client-side `useStoreUser` hook

### Two Portals, Role-Based Routing

`src/App.tsx` defines the route tree. The root path redirects based on Clerk auth state + Convex user role:
- `/admin/*` — admin portal (role = `"admin"`)
- `/employee/*` — employee portal (role = `"employee"`)

`ProtectedRoute` enforces role access and blocks entry until the employee profile is created by an admin.

### Convex Backend (`convex/`)

All database access goes through Convex queries and mutations — there is no REST API. The schema defines 8 tables: `users`, `employees`, `attendance`, `attendanceLogs`, `leaveTypes`, `leaveBalances`, `leaveRequests`, `holidays`.

Key conventions:
- `convex/helpers.ts` exports `getCurrentUser`, `getCurrentEmployee`, and `requireAdmin` — always call the appropriate one at the top of each handler
- Dates are stored as ISO strings (`YYYY-MM-DD`); times as ISO datetime strings
- Holiday `location` field uses empty string `""` to mean "applies to all locations"
- `convex/crons.ts` resets leave balances on Jan 1st each year

When you add a new Convex function file, register its exports through `api` automatically — Convex codegen picks them up. The generated types live in `convex/_generated/` (do not edit manually).

### Frontend Data Fetching

Uses Convex's React hooks throughout — **no REST calls, no Redux**:
```ts
const data = useQuery(api.employees.list);           // real-time subscription
const mutate = useMutation(api.leaves.apply);        // server mutation
```
`useQuery` returns `undefined` while loading, `null` if no data. All queries auto-update across clients when data changes.

### Auth Sync Flow

1. Clerk authenticates the user
2. `useStoreUser` hook (`src/hooks/useStoreUser.ts`) calls `api.users.ensureMe` on mount with retry logic (5 attempts, exponential backoff) — handles the race between Clerk token availability and Convex auth
3. Clerk webhooks (`convex/http.ts`) keep the `users` table updated on profile changes

### UI Components

Custom shadcn/ui-style components live in `src/components/ui/`. They are **not** from an npm package — they're hand-written and can be edited directly. Use the `cn()` utility from `src/lib/utils.ts` for conditional class merging.

The `@` path alias maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).

### Leave Management Flow

Employee applies → status `"pending"` → admin approves/rejects → on approval, balance is deducted from `leaveBalances`. The leave type code `"LOP"` (Loss of Pay) skips balance validation. Approved leaves appear in the team calendar (`react-big-calendar`).

### Attendance / Geolocation

Check-in and check-out capture GPS coordinates via `useGeolocation` hook. Each event is logged to `attendanceLogs` with lat/long/accuracy. The `attendance` record tracks `firstCheckIn`, `lastCheckIn`, `lastCheckOut`, and computed `totalHours`. Status is `"present"` (≥4h) or `"half-day"` (<4h).

## Environment Variables

```
VITE_CONVEX_URL=          # Set automatically by `npx convex dev`
VITE_CLERK_PUBLISHABLE_KEY=  # From Clerk dashboard
```
