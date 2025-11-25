# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY TaskBora.sln ./
COPY TaskBora.Domain/TaskBora.Domain.csproj TaskBora.Domain/
COPY TaskBora.Application/TaskBora.Application.csproj TaskBora.Application/
COPY TaskBora.Infrastructure/TaskBora.Infrastructure.csproj TaskBora.Infrastructure/
COPY TaskBora.CrossCutting/TaskBora.CrossCutting.csproj TaskBora.CrossCutting/
COPY TaskBora.Presentation.Api/TaskBora.Presentation.Api.csproj TaskBora.Presentation.Api/

# Restore
RUN dotnet restore TaskBora.sln

# Copy the rest of the source
COPY . .

# Build and publish
WORKDIR /src/TaskBora.Presentation.Api
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "TaskBora.Presentation.Api.dll"]
