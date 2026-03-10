# Superadmin Dashboard - Implementation Plan

## Overview
Develop a "bird's-eye view" dashboard for the Superadmin that surfaces key system metrics, recent activity, and provides quick actions for managing tenants.

## Project Type
WEB

## Success Criteria
- The Superadmin dashboard `/dashboard/superadmin` loads and displays aggregate system data.
- KPIs show total active schools, total users across schools, and active subscription stats.
- A "Recent Activity" feed displays critical system events.
- A visual chart displays growth (e.g., schools onboarded per month).
- A Quick Action section provides 1-click access to register a new school.

## Tech Stack
- Frontend: Next.js (App Router), Tailwind CSS, Recharts, Lucide React, Shadcn UI
- Backend: Laravel 11, Eloquent ORM

## File Structure
- `frontend/app/dashboard/superadmin/page.tsx`
- `frontend/components/superadmin/SystemKPIs.tsx`
- `frontend/components/superadmin/GrowthChart.tsx`
- `frontend/components/superadmin/RecentActivity.tsx`
- `frontend/components/superadmin/QuickActions.tsx`
- `backend/app/Http/Controllers/Dashboard/SuperadminDashboardController.php`
- `backend/routes/api.php`

## Task Breakdown

### 1. Backend: Dashboard Stats API
- **Agent**: `backend-specialist`
- **Skills**: `api-patterns`
- **Dependencies**: None
- **INPUT**: Superadmin request to `/api/superadmin/dashboard-stats`
- **OUTPUT**: JSON response with KPIs, chart dataseries, and activity feed using existing models (`Tenant`, `User`, `Subscription` if any).
- **VERIFY**: API returns 200 OK with correct data structure.

### 2. Frontend: Dashboard Layout & Quick Actions
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`, `clean-code`
- **Dependencies**: Task 1
- **INPUT**: Superadmin navigates to main dashboard page.
- **OUTPUT**: The main layout holding placeholders and the Quick Actions container (linking to existing `/dashboard/superadmin/registrasi`).
- **VERIFY**: Layout renders correctly, quick action buttons navigate properly.

### 3. Frontend: System KPIs & Chart
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`
- **Dependencies**: Task 1
- **INPUT**: Dashboard stats data.
- **OUTPUT**: Implementation of `SystemKPIs` (stat cards) and `GrowthChart` using Recharts.
- **VERIFY**: Cards show accurate numbers, chart visualizes data clearly and responsively.

### 4. Frontend: Recent Activity Feed
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`
- **Dependencies**: Task 1
- **INPUT**: Recent activity array.
- **OUTPUT**: A clean, scrollable activity feed component rendering logs/events.
- **VERIFY**: Feed displays chronologically and gracefully handles empty states.

### 5. Integration & Polish
- **Agent**: `frontend-specialist`
- **Skills**: `performance-profiling`
- **Dependencies**: Tasks 1-4
- **INPUT**: Assembled dashboard UI.
- **OUTPUT**: Data fetching logic, error handling, empty states, loading skeletons.
- **VERIFY**: Dashboard loads smoothly without console errors.

## Phase X: Verification
- [ ] No purple/violet hex codes
- [ ] No standard template layouts
- [ ] Socratic Gate was respected
- [ ] Lint: Pass
- [ ] Build: Success
