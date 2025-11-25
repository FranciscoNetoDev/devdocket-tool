using TaskBora.Domain.Entities;

namespace TaskBora.Domain.Repositories;

public interface IProjectRepository
{
    Task<Project?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<Project>> GetByUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task AddAsync(Project project, CancellationToken cancellationToken = default);
    Task DeleteAsync(Project project, CancellationToken cancellationToken = default);
    Task UpdateAsync(Project project, CancellationToken cancellationToken = default);
}
