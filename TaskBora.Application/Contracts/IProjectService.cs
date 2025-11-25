using TaskBora.Application.DTOs;

namespace TaskBora.Application.Contracts;

public interface IProjectService
{
    Task<ProjectDto> CreateAsync(string name, string? description, CancellationToken cancellationToken = default);
    Task<ProjectDto?> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<ProjectDto>> GetForUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, string name, string? description, CancellationToken cancellationToken = default);
}
