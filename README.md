# TaskBora

This repository hosts the backend (.NET) and the upcoming Angular frontend side by side, without any Supabase or Lovable dependencies.

## Structure
- `backend/` — ASP.NET Core solution with Domain, Application, Infrastructure, CrossCutting, and API projects.
- `frontend/` — placeholder for the Angular client that will consume the backend API.
- `TaskBora.sln` — solution file that opens all backend projects and the frontend folder from one place.
- `docker-compose.yml` — spins up SQL Server and the Web API without installing the .NET SDK locally.

## Getting started
1. Open `TaskBora.sln` in Visual Studio or JetBrains Rider to work with the backend projects.
2. When you scaffold the Angular client, place it inside `frontend/` so it remains alongside the backend.
3. Configure the Angular HTTP services to target the API hosted by `TaskBora.Presentation.Api`.

## Run the stack with Docker Compose
1. Ensure Docker is available on your machine.
2. From the repository root, run `docker-compose up --build`.
3. The API will be available on `http://localhost:8080` and will connect to the SQL Server container automatically.
4. Apply EF Core migrations inside the `api` container (after it starts) with:
   - `docker-compose exec api dotnet ef database update --project backend/TaskBora.Infrastructure --startup-project backend/TaskBora.Presentation.Api`

## Notes
- All Supabase assets and Lovable tooling have been removed to prepare for the Angular + .NET stack.
- Refer to `backend/README.md` for backend setup and SQL Server migration details.
- If you prefer running locally without Docker, install the .NET 8 SDK and SQL Server, then update `backend/TaskBora.Presentation.Api/appsettings.json` with your local connection string.
