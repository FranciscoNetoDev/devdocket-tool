# TaskBora Backend (.NET 8, DDD)

This folder contains the new .NET 8 solution replacing Supabase with a PostgreSQL-backed, domain-driven architecture.

## Projects
- **TaskBora.Domain**: Entities, value objects, and repository interfaces for projects, tasks, sprints, and users.
- **TaskBora.Application**: Application services for tasks, projects, sprints, and user profiles.
- **TaskBora.Infrastructure**: EF Core PostgreSQL persistence with repository implementations.
- **TaskBora.CrossCutting**: Dependency injection wiring and shared options.
- **TaskBora.Presentation.Api**: ASP.NET Core Web API exposing endpoints aligned with the former Supabase interactions.

## Running locally
1. Install .NET 8 SDK and PostgreSQL.
2. Update `TaskBora.Presentation.Api/appsettings.json` with your connection string.
3. From `backend/`, run `dotnet restore`, `dotnet ef database update`, then `dotnet run --project TaskBora.Presentation.Api`.

## Migration notes
- Supabase calls for tasks, sprints, projects, and profiles are now represented as repositories and Web API endpoints under `api/` routes.
- Authentication is expected to be implemented next using ASP.NET Identity or JWT aligned with the former Supabase session model.
- Angular services should replace direct Supabase queries by targeting these endpoints.
