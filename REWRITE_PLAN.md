# DevDocket Angular + .NET Rewrite Plan

This repository currently contains a React/Vite front-end backed by Supabase.
A full rewrite to an Angular front-end with a .NET (C#) backend using DDD and SOLID requires
fresh scaffolding. This document captures the proposed architecture and mapping of the
existing features so the implementation can start immediately.

## Goals
- Replace the React client with an Angular application (standalone components + Nx-like feature modules).
- Implement a .NET Web API that follows DDD (bounded contexts, domain layer, application layer, infrastructure layer).
- Preserve current user flows: authentication, projects, tasks, sprints, and profile management.
- Improve testability and separation of concerns with SOLID practices.

## High-Level Architecture
```
repo/
├─ angular-client/             # Angular workspace
│  ├─ projects/                # Feature libraries grouped by bounded context
│  │  ├─ identity/             # Auth, invitations, user profile UI
│  │  ├─ projects/             # Project listing, creation, details
│  │  ├─ tasks/                # Task creation, editing, lists
│  │  └─ sprints/              # Sprint planning/boards
│  ├─ shared/                  # UI kit, directives, guards, interceptors, state utils
│  └─ app/                     # Shell, routing, layout, top-level providers
├─ TaskBora.Domain/            # Domain layer (C#)
├─ TaskBora.Application/       # Application layer (C#)
├─ TaskBora.Infrastructure/    # Infrastructure layer (C#)
├─ TaskBora.CrossCutting/      # Cross-cutting concerns (C#)
└─ TaskBora.Presentation.Api/  # ASP.NET Core Web API
   ├─ DevDocket.sln
   ├─ src/
   │  ├─ Identity/             # Bounded context: auth, invites, profiles
   │  ├─ Projects/             # Bounded context: projects, members
   │  ├─ Tasks/                # Bounded context: tasks, statuses
   │  ├─ Sprints/              # Bounded context: sprints, planning
   │  └─ Shared/               # Cross-cutting: persistence, bus, notifications
   └─ tests/
```

## Angular Client Outline
- **Routing shell:** `app.routes.ts` defining lazy-loaded feature routes (`projects`, `tasks`, `sprints`, `auth`, `profile`).
- **State management:** NgRx signals/store or standalone signals services per feature to avoid tight coupling.
- **HTTP access:** Angular `HttpClient` with interceptors for auth tokens and error handling; interfaces mirror backend DTOs.
- **UI composition:** Standalone components for dashboards, project lists, task forms, and sprint boards; shared module hosts layout, button, input, and toast components.
- **Validation:** Angular forms (reactive) with domain-aligned validation rules.

## .NET Backend Outline
- **Solution layout:**
  - `Domain` projects per bounded context with entities, aggregates, value objects, and domain services.
  - `Application` layer per context exposing commands/queries via MediatR; DTOs for transport.
  - `Infrastructure` layer with EF Core persistence, migrations, and integrations (e.g., Supabase replacement or JWT provider).
  - `API` project hosting ASP.NET Core controllers/endpoints; uses minimal APIs where appropriate.
- **Cross-cutting:** FluentValidation for commands, global error handling middleware, logging/observability hooks.
- **Authentication:** Identity provider with JWT issuance; invitation acceptance flow mirrors current `AcceptInvite` page.

## Feature Mapping from React App
- `src/pages/Auth.tsx` -> Angular `identity` feature: login/register component, auth guard, token storage service.
- `src/pages/AcceptInvite.tsx` -> Angular route `/invites/:token` hitting backend invite acceptance endpoint.
- `src/pages/Dashboard.tsx` & `src/components/dashboard/*` -> Angular dashboard module showing project/task summaries.
- `src/pages/NewProject.tsx` & `src/pages/Project.tsx` -> Angular `projects` feature with list/detail components and member management.
- `src/pages/NewTask.tsx` & `src/services/tasks.ts` -> Angular `tasks` feature providing task forms and state.
- `src/pages/Sprints.tsx` -> Angular `sprints` feature with board UI and drag/drop interactions.
- `src/pages/Profile.tsx` -> Angular `identity` feature for user profile editing and avatar update.

## Initial Implementation Steps
1. **Create Angular workspace** using `npm create @angular` or `ng new angular-client --standalone --routing --style=scss`.
2. **Scaffold feature libraries** under `angular-client/projects/*` with standalone components and dedicated services for API access.
3. **Add shared UI kit** with layout components and Tailwind/SCSS utility styles to match current design.
4. **Introduce NgRx store** (or signals-based services) for auth/session state and for caching projects/tasks.
5. **Spin up .NET solution** via `dotnet new sln` + `dotnet new webapi` for the API host; add class library projects for each bounded context and Shared kernel.
6. **Model domain entities** (Project, Task, Sprint, Invite, User) with value objects for IDs, email, etc.; implement repositories and specifications.
7. **Expose REST endpoints** aligned to current front-end needs: auth, invites, projects, tasks, sprints, and profile.
8. **Enable CI/tests** for both Angular (`ng test`, `ng e2e`) and .NET (`dotnet test`).

## Execution references and current progress
- The .NET API now exposes project/task endpoints consumed by the React services through `VITE_API_BASE_URL`, with Supabase kept only as a fallback while Angular is built.
- `TaskBora.Web/src/lib/apiClient.ts` centralizes API calls so Angular services can reuse the same shape when ported.
- `TaskBora.Presentation.Api/Controllers/ProjectsController.cs` now has user-scoped list, delete, and placeholder member routes; `TasksController` already covers backlog/detail/status operations.

## Next migration steps
1. Move remaining Supabase-bound UI flows (memberships, invites, retros, storage uploads) onto dedicated API endpoints and domain models.
2. Replace React contexts/hooks with Angular services that call the new API client, maintaining the API-first + Supabase-fallback pattern until all flows are ported.
3. Delete Supabase dependencies once all services and components rely solely on the .NET API and PostgreSQL/SQL Server persistence.

This blueprint keeps the rewrite aligned to SOLID and DDD while mapping every current feature to the new stacks.
