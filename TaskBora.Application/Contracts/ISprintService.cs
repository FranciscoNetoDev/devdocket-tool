using TaskBora.Application.DTOs;

namespace TaskBora.Application.Contracts;

public interface ISprintService
{
    Task<SprintDto> CreateAsync(Guid projectId, string name, DateTime? startsAt, DateTime? endsAt, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<SprintDto>> GetForProjectAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task CloseAsync(Guid id, CancellationToken cancellationToken = default);
}
