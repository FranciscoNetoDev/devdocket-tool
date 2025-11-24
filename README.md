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

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c4dcd739-3efb-41fd-ae68-ec2cbcf8df63) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

> Unified solution: open `TaskBora.sln` in the repo root to access the .NET backend projects (under the `backend` solution folder) alongside the frontend assets from one place.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/c4dcd739-3efb-41fd-ae68-ec2cbcf8df63) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
