using Microsoft.Extensions.DependencyInjection;
using TaskBora.Application.Contracts;
using TaskBora.Application.Services;

namespace TaskBora.Application.DependencyInjection;

public static class ApplicationServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<ITaskService, TaskService>();
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<ISprintService, SprintService>();
        services.AddScoped<IUserProfileService, UserProfileService>();

        return services;
    }
}
