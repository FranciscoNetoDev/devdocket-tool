# Migration Analysis and Plan (React/Supabase → Angular + .NET DDD)

## Current Project Overview
- **Framework & setup:** Vite + React + TypeScript with React Router, TanStack Query, shadcn-ui, Tailwind, and Supabase client integration. Routing covers auth, dashboard, profile, project, task creation, invites, and sprints behind an auth provider and protected project routes.
- **State/auth:** AuthContext wraps the app, storing Supabase user/session, handling sign-up/sign-in/sign-out via `supabase.auth` and clearing local storage tokens on logout. Navigation redirects to the auth page when signing out.
- **Data layer:** Supabase is consumed directly inside pages/components/hooks for CRUD. Supabase types file shows the main tables/relationships driving the app (e.g., tasks with status/priority enums, user stories, sprints, labels, audit logs, comments, organizations, profiles, user roles, project membership, retrospectives).

## Main Domains / Business Areas
- **Projects & membership:** Projects, organizations, user profiles/roles, and project membership checks for authorization.
- **Tasks & workflow:** Tasks linked to projects, sprints, and user stories with status/priority enums; labels, comments, audit logs, and assignees.
- **Sprints & boards:** Sprint planning/boards, backlog, and user-story associations (sprint_user_stories).
- **Retrospectives:** Retrospective sessions and items tied to sprints/projects.
- **Auth & invites:** Email/password auth with Supabase, invite token flows for joining projects/organizations.

## Where Business Rules Live Today
- **React pages/components:** Task creation, scheduling, and validation live in pages like `NewTask` (validation, daily hour limits, membership checks, Supabase writes). Backlog/board/sprint views query Supabase directly for state transitions and assignments.
- **Hooks/services:** Custom hooks encapsulate some queries, but most orchestration (e.g., sprint assignment, status updates) remains inside UI components.
- **Supabase client usage:** Direct PostgREST CRUD and auth calls from the UI; no dedicated backend API layer.

## Database Footprint (from Supabase Types)
- **Core entities:** `projects`, `user_stories`, `tasks`, `sprints`, `retrospectives`, `labels`, `comments`, `task_labels`, `project_members`, `user_roles`, `profiles`, `organizations`.
- **Key relationships:** Tasks reference projects, sprints, and user stories; labels map via `task_labels`; audit logs reference tasks; user roles/organization membership support authorization.
- **Enums:** Task priority/status enums used throughout task workflows.

## Proposed Target Architecture
### .NET Solution (DDD + Clean Architecture)
- **TaskBora.Domain:** Aggregates/entities (Project, Task, Sprint, UserStory, Retrospective, Label, Comment, Membership, Organization, UserProfile), value objects (TaskStatus, TaskPriority, StoryPoints, Hours, DueDate), domain events, repository interfaces.
- **TaskBora.Application:** Use cases (commands/queries) for auth, projects, invites, sprint planning, backlog/board moves, task lifecycle, retrospectives; DTOs/view models; validators; handlers; mediators.
- **TaskBora.Infrastructure:** EF Core PostgreSQL DbContext, entity configurations, repository implementations, migrations, Supabase schema parity mappings, integration for file/storage if needed.
- **TaskBora.CrossCutting:** DI bootstrapping, logging, caching, options, JWT/token helpers, email, notifications.
- **TaskBora.Presentation.Api:** ASP.NET Core minimal/controllers with Swagger; auth endpoints (login/refresh/logout/signup/invite acceptance), project/task/sprint/retro endpoints aligned to use cases; mapping profiles; exception/validation middleware.

### Angular Frontend (TaskBora-web)
- **Structure:** Feature modules for auth, dashboard, projects, tasks, sprints/boards, retrospectives, settings/profile; core module (auth guard/interceptors, api client, layout), shared UI module.
- **Routing:** Mirrors current React routes (auth, dashboard, sprints, project detail, task create/edit, invite acceptance, profile, not-found) with lazy-loaded feature modules.
- **Services:** HttpClient-based services calling the .NET API for auth, projects, tasks, sprints, retrospectives; token storage via interceptors; models/interfaces aligned with API DTOs.
- **UI/state:** Components lean on services and resolvers; form validation preserved; leverage Angular forms and CDK components as needed.

## Immediate Next Steps
1. Extract full Supabase usage map (per screen/hook) to enumerate required API endpoints and domain aggregates.
2. Design Postgres schema and EF Core mappings mirroring Supabase tables/enums, introducing value objects and aggregates where appropriate.
3. Scaffold .NET solution structure and Angular workspace with placeholder modules/services, then iteratively port use cases.
4. Replace Supabase client calls in UI with Angular service calls to the new API, keeping UX/validation flows intact.
