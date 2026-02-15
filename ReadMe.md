# ZohoHR - Employee Management System

A simplified, modern clone of Zoho People built with React, Convex, and Clerk. Provides a complete HR management solution with admin controls and an employee self-service portal featuring geolocation-based attendance, leave management with calendar views, and real-time time tracking.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Backend/Database:** Convex (real-time, serverless)
- **Authentication:** Clerk (role-based: admin / employee)
- **Styling:** Tailwind CSS 4 + custom shadcn/ui-style components
- **Calendar:** react-big-calendar + date-fns
- **Icons:** Lucide React

## Features

### Admin Dashboard
- Overview stats (total employees, present today, pending leaves)
- Employee CRUD (add, edit, deactivate)
- Attendance monitoring by date with geolocation data
- Leave request approval/rejection workflow

### Employee Portal
- **My Space** — Check-in/check-out with browser geolocation, leave balance summary, pending requests
- **Team** — View team members, see who's on leave this week
- **Organization** — Personal profile and reporting structure
- **Leave Tracker** — Apply for leave, view balances, team leave view, full calendar with color-coded leave types
- **Time Tracker** — Live timer, weekly/monthly hours, daily breakdown charts
- **Attendance** — Personal attendance history with date range filtering

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up Convex (will prompt for login)
npx convex dev

# 3. Configure environment variables in .env.local
#    VITE_CONVEX_URL=<auto-set by convex dev>
#    VITE_CLERK_PUBLISHABLE_KEY=<from Clerk dashboard>

# 4. Start the dev server
npm run dev
```

See [DOCS.md](DOCS.md) for full setup instructions, architecture details, and API reference.

## License

MIT
