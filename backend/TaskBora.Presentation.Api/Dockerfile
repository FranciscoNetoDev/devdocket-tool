# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY TaskBora.sln ./
COPY backend/TaskBora.Domain/TaskBora.Domain.csproj backend/TaskBora.Domain/
COPY backend/TaskBora.Application/TaskBora.Application.csproj backend/TaskBora.Application/
COPY backend/TaskBora.Infrastructure/TaskBora.Infrastructure.csproj backend/TaskBora.Infrastructure/
COPY backend/TaskBora.CrossCutting/TaskBora.CrossCutting.csproj backend/TaskBora.CrossCutting/
COPY backend/TaskBora.Presentation.Api/TaskBora.Presentation.Api.csproj backend/TaskBora.Presentation.Api/

# Restore
RUN dotnet restore TaskBora.sln

# Copy the rest of the source
COPY backend/ ./backend/

# Build and publish
WORKDIR /src/backend/TaskBora.Presentation.Api
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "TaskBora.Presentation.Api.dll"]
