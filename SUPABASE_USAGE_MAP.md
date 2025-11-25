# Supabase Usage Map and Migration Targets

This document enumerates the current Supabase entry points so the Angular + .NET rewrite can recreate equivalent APIs and business rules without missing flows.

## Auth & Session
- **Auth page (`src/pages/Auth.tsx`)** uses AuthContext helpers that wrap `supabase.auth` for email/password login and registration, including client-side validations for name and password length and redirects on success.
- **AuthContext (`src/contexts/AuthContext.tsx`)** persists the Supabase session, provides `signIn`, `signUp`, `signOut`, and `resetPassword` helpers, and guards routes via the provider; refresh and token handling mirror Supabase session events.

## Projects & Membership
- **Project creation (`src/pages/NewProject.tsx`)** inserts into `projects` and `project_members`, ensuring the creator is added as an admin and handling duplicate/project name errors.
- **Dashboard (`src/pages/Dashboard.tsx`)** reads `profiles` and `projects`, then joins `project_members` and `profiles` for membership and owner display.
- **Project detail boards (`src/pages/Project.tsx` + `src/components/project/*`)** fetch tasks, sprint membership, and backlog items scoped to the project with filters for deletion and sprint assignment; task updates (status, sprint assignment, soft delete/reactivate) now go through the shared task service backed by Supabase repositories.

## Tasks, User Stories, and Validation
- **Task creation (`src/pages/NewTask.tsx`)**
  - Validates inputs with `taskSchema` and extra rules (requires user story, enforces 8h/day cap, requires project membership or project creator).
  - Reads `user_stories` for the selected project, calculates daily load across `tasks` with `due_date` to enforce the 8-hour limit, and invokes the `create_task` RPC to insert tasks.
  - On success, optionally links to a `user_story`, inserts into `task_assignees`, and redirects.
- **Task editing dialogs and hooks (`src/components/project/TaskDialog.tsx`, `src/hooks/useTasks.ts`, `src/hooks/useTaskAssignees.ts`)** load task details, assignees, and status; updates propagate via the shared `taskService` abstraction to Supabase tables (`tasks`, `task_assignees`).

## Sprints and Boards
- **Sprints page/boards (`src/components/project/SprintBoard.tsx`, `src/pages/Sprints.tsx`)** read sprints and sprint-scoped tasks, allow drag-and-drop status updates, and reassign tasks to/from sprints through the task service.
- **Add-to-sprint dialog (`src/components/project/AddTasksToSprintDialog.tsx`)** queries backlog tasks without a sprint and batches `sprint_id` assignments.

## Invites & Access
- **Invite acceptance (`src/pages/AcceptInvite.tsx`)** calls `supabase.rpc('accept_invite_token')` to exchange a token for membership and redirects.
- **Route protection** relies on AuthContext user presence; backend rewrite should mirror membership checks currently done client-side (e.g., before task creation).

## Profiles & Media
- **Profile page (`src/pages/Profile.tsx`)** reads and updates `profiles` for user metadata and avatar URLs; avatar uploads go through Supabase storage (`avatars` bucket) and update the profile record.

## Data Model Reference
- Supabase types in `src/integrations/supabase/types.ts` define the tables (`tasks`, `user_stories`, `sprints`, `projects`, `project_members`, `task_assignees`, `labels`, `comments`, `profiles`, `organizations`, `user_roles`, `retrospectives`, etc.) plus `task_priority` and `task_status` enums. Use this as the canonical schema when modeling EF Core entities and Angular DTOs.

## Migration Pointers
- Replace every direct Supabase CRUD/RPC call with API endpoints in the .NET Presentation layer backed by Application commands/queries and EF Core repositories.
- Preserve validation currently enforced client-side (membership checks, 8h/day scheduling rule, required user stories, password length) by relocating them to Domain/Application services so the Angular client stays thin.
- Mirror storage needs (avatars) via API endpoints that issue pre-signed upload URLs or handle multipart uploads.
