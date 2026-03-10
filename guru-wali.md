# Guru Wali Feature Plan

## Overview
Implement the "Guru Wali" assignment and dashboard based on the national curriculum. A Guru Wali acts as an academic advisor tracking student discipline, achievements, and developments across classes out of the standard Wali Kelas scope.

## Project Type
FULLSTACK (WEB + BACKEND)
- Agents needed: `backend-specialist`, `frontend-specialist`, `database-architect`

## Success Criteria
1. Superadmin/Admin can assign students to a Guru Wali (Teacher).
2. Assignments are cross-class cohorts attached to an academic year.
3. Guru Wali can view an aggregated dashboard (grades, attendance, behavioral points) for their assigned students.
4. Guru Wali can view specific student profiles and add subjective "Development Notes".
5. No report card editing permissions for Guru Wali (Read-Only on grades).

## Tech Stack
- **Backend:** Laravel PHP
- **Frontend:** Next.js, React Hook Form, Tailwind CSS, ShadCN UI

## File Structure
- `backend/app/Models/GuruWaliStudent.php`
- `backend/app/Models/StudentDevelopmentNote.php`
- `backend/database/migrations/..._create_guru_wali_students_table.php`
- `backend/database/migrations/..._create_student_development_notes_table.php`
- `backend/app/Http/Controllers/Api/GuruWaliController.php`
- `frontend/app/dashboard/guru/page.tsx` (Modified)
- `frontend/app/dashboard/guru-wali/dashboard/page.tsx`
- `frontend/app/dashboard/guru-wali/students/[id]/page.tsx`

## Task Breakdown
1. **[database-architect] Create Migrations & Models for Guru Wali**
   - INPUT: Schema requirements (assignments, notes).
   - OUTPUT: Migrations and Models running `php artisan migrate`.
   - VERIFY: DB tables exist and relationships (Student <-> Teacher) work.
2. **[backend-specialist] Build API Endpoints for Assignments & Dashboard**
   - INPUT: Models.
   - OUTPUT: `GuruWaliController` with GET/POST endpoints.
   - VERIFY: Postman/Tests return 200 OK with correct JSON shape.
3. **[frontend-specialist] Build Guru Wali Assignments UI**
   - INPUT: API endpoints for assignment and multi-select.
   - OUTPUT: Update Admin UI at `frontend/app/dashboard/guru/page.tsx` with a multi-select search for students.
   - VERIFY: Can successfully map students to a Guru Wali in the UI and see assignments in the dialog list.
4. **[frontend-specialist] Build Guru Wali Dashboard & Student Detail UI**
   - INPUT: API for aggregated data and notes.
   - OUTPUT: Teacher UI at `/dashboard/guru-wali/dashboard` and student detail view.
   - VERIFY: Teacher logs in, sees assigned students, can add development note.

## ✅ PHASE X COMPLETE
- Lint: [ ]
- Security: [ ]
- Build: [ ]
- Date: [ ]
