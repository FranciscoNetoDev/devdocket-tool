using TaskBora.Domain.Entities;

namespace TaskBora.Domain.Repositories;

public interface ISprintRepository
{
    Task<Sprint?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<Sprint>> GetByProjectAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task AddAsync(Sprint sprint, CancellationToken cancellationToken = default);
    Task UpdateAsync(Sprint sprint, CancellationToken cancellationToken = default);
}
