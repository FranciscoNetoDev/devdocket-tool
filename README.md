# TaskBora

This repository hosts the backend (.NET) and the React frontend together at the solution root.

## Structure
- `TaskBora.Domain/`, `TaskBora.Application/`, `TaskBora.Infrastructure/`, `TaskBora.CrossCutting/`, `TaskBora.Presentation.Api/` — .NET backend projects.
- `TaskBora.Web/` — React client that now targets the .NET API directly for data flows.
- `TaskBora.sln` — solution file that opens all backend projects and the web client from one place.
- `docker-compose.yml` — spins up SQL Server and the Web API without installing the .NET SDK locally.

## Getting started
1. Open `TaskBora.sln` in Visual Studio or JetBrains Rider to work with the backend projects and the web client together.
2. React frontend (API-first):
   - `cd TaskBora.Web && npm install`
   - Create `.env` with `VITE_API_BASE_URL=http://localhost:8080`.
   - `npm run dev`
3. Backend API: `cd TaskBora.Presentation.Api && dotnet run` (or use Docker Compose below). The API automatically applies EF Core migrations on startup using the configured SQL Server connection string.

## Run the stack with Docker Compose
1. Ensure Docker is available on your machine.
2. From the repository root, run `docker-compose up --build`.
3. The API will be available on `http://localhost:8080` and will connect to the SQL Server container automatically.
4. Migrations are applied automatically on API startup. If you prefer to run them manually, you can still run:
   - `docker-compose exec api dotnet ef database update --project TaskBora.Infrastructure --startup-project TaskBora.Presentation.Api`

## Notes
- Frontend services now call the .NET API only; Supabase configuration is no longer needed for project/task data. Auth will remain on Supabase until it is replaced.
- Refer to `BACKEND.md` for backend setup and SQL Server migration details.
- If you prefer running locally without Docker, install the .NET 8 SDK and SQL Server, then update `TaskBora.Presentation.Api/appsettings.json` with your local connection string.
