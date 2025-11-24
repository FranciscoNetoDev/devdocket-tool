# TaskBora Backend (.NET 8, DDD)

This folder contains the new .NET 8 solution replacing Supabase with a SQL Server-backed, domain-driven architecture.

## Solution layout
- Open the root `TaskBora.sln` to load all backend projects plus the `frontend/` folder in the same solution view.
- Backend projects are grouped under a `backend` solution folder; the `frontend/` folder is listed separately so you can scaffold and manage the Angular client alongside the API.

## Projects
- **TaskBora.Domain**: Entities, value objects, and repository interfaces for projects, tasks, sprints, and users.
- **TaskBora.Application**: Application services for tasks, projects, sprints, and user profiles.
- **TaskBora.Infrastructure**: EF Core SQL Server persistence with repository implementations.
- **TaskBora.CrossCutting**: Dependency injection wiring and shared options.
- **TaskBora.Presentation.Api**: ASP.NET Core Web API exposing endpoints aligned with the former Supabase interactions.

## Running locally
1. Install .NET 8 SDK and SQL Server (localdb or full SQL Server instance).
2. Update `TaskBora.Presentation.Api/appsettings.json` with your SQL Server connection string (or override via `Database__ConnectionString`).
3. From `backend/`, run `dotnet restore`, `dotnet ef database update`, then `dotnet run --project TaskBora.Presentation.Api`.

## Running with Docker Compose (no local SDK required)
1. Ensure Docker is available and run `docker-compose up --build` from the repository root.
2. After the containers start, apply migrations in the API container:
   - `docker-compose exec api dotnet ef database update --project backend/TaskBora.Infrastructure --startup-project backend/TaskBora.Presentation.Api`
3. The API will be reachable at `http://localhost:8080` and will use the bundled SQL Server container.

## Migration notes
- Supabase calls for tasks, sprints, projects, and profiles are now represented as repositories and Web API endpoints under `api/` routes.
- Authentication is expected to be implemented next using ASP.NET Identity or JWT aligned with the former Supabase session model.
- Angular services should replace direct Supabase queries by targeting these endpoints.
