# TaskBora Backend (.NET 8, DDD)

This repository contains the .NET 8 solution replacing Supabase with a SQL Server-backed, domain-driven architecture.

## Solution layout
- Open the root `TaskBora.sln` to load all backend projects plus the `TaskBora.Web/` folder in the same solution view.

## Projects
- **TaskBora.Domain**: Entities, value objects, and repository interfaces for projects, tasks, sprints, and users.
- **TaskBora.Application**: Application services for tasks, projects, sprints, and user profiles. Dependency injection helpers live here so the composition root can stay in the API.
- **TaskBora.Infrastructure**: EF Core SQL Server persistence with repository implementations and its own DI extension for DbContext/repositories.
- **TaskBora.CrossCutting**: Shared options (e.g., `DatabaseOptions`) that can be reused without introducing circular references between layers.
- **TaskBora.Presentation.Api**: ASP.NET Core Web API exposing endpoints aligned with the former Supabase interactions and responsible for wiring the Application + Infrastructure layers together.

## Running locally
1. Install .NET 8 SDK and SQL Server (localdb or full SQL Server instance).
2. Update `TaskBora.Presentation.Api/appsettings.json` with your SQL Server connection string (or override via `Database__ConnectionString`).
3. From the repo root, run `dotnet restore`, then `dotnet run --project TaskBora.Presentation.Api`. The API applies pending EF Core migrations automatically at startup.

## Running with Docker Compose (no local SDK required)
1. Ensure Docker is available and run `docker-compose up --build` from the repository root.
2. After the containers start, migrations are applied automatically on API startup. If you need to run them manually, execute:
   - `docker-compose exec api dotnet ef database update --project TaskBora.Infrastructure --startup-project TaskBora.Presentation.Api`
3. The API will be reachable at `http://localhost:8080` and will use the bundled SQL Server container.

## Migration notes
- Supabase calls for tasks, sprints, projects, and profiles are now represented as repositories and Web API endpoints under `api/` routes.
- Authentication is expected to be implemented next using ASP.NET Identity or JWT aligned with the former Supabase session model.
- Angular services should replace direct Supabase queries by targeting these endpoints.
