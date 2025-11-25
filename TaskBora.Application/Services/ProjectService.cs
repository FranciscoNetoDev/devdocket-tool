using TaskBora.Application.Contracts;
using TaskBora.Application.DTOs;
using TaskBora.Domain.Entities;
using TaskBora.Domain.Repositories;

namespace TaskBora.Application.Services;

public class ProjectService : IProjectService
{
    private readonly IProjectRepository _projectRepository;

    public ProjectService(IProjectRepository projectRepository)
    {
        _projectRepository = projectRepository;
    }

    public async Task<ProjectDto> CreateAsync(string name, string? description, CancellationToken cancellationToken = default)
    {
        var project = new Project(name, description);
        await _projectRepository.AddAsync(project, cancellationToken);
        return ToDto(project);
    }

    public async Task<ProjectDto?> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var project = await _projectRepository.GetByIdAsync(id, cancellationToken);
        return project is null ? null : ToDto(project);
    }

    public async Task<IReadOnlyCollection<ProjectDto>> GetForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var projects = await _projectRepository.GetByUserAsync(userId, cancellationToken);
        return projects.Select(ToDto).ToArray();
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var project = await _projectRepository.GetByIdAsync(id, cancellationToken) ?? throw new InvalidOperationException("Project not found");
        await _projectRepository.DeleteAsync(project, cancellationToken);
    }

    public async Task UpdateAsync(Guid id, string name, string? description, CancellationToken cancellationToken = default)
    {
        var project = await _projectRepository.GetByIdAsync(id, cancellationToken) ?? throw new InvalidOperationException("Project not found");
        project.UpdateDetails(name, description);
        await _projectRepository.UpdateAsync(project, cancellationToken);
    }

    private static ProjectDto ToDto(Project project) => new(project.Id, project.Name, project.Description);
}
