using TaskBora.Application.DTOs;
using TaskBora.Domain.Enums;

namespace TaskBora.Application.Contracts;

public interface ITaskService
{
    Task<TaskDto> CreateAsync(Guid projectId, string title, string? description, int order, IEnumerable<Guid> assigneeIds, CancellationToken cancellationToken = default);
    Task<TaskDto?> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<TaskDto>> GetBacklogAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<TaskDto>> GetBySprintAsync(Guid sprintId, CancellationToken cancellationToken = default);
    Task AssignToSprintAsync(Guid taskId, Guid? sprintId, CancellationToken cancellationToken = default);
    Task UpdateStatusAsync(Guid taskId, TaskStatus status, CancellationToken cancellationToken = default);
    Task UpdateOrderAsync(Guid taskId, int order, CancellationToken cancellationToken = default);
    Task UpdateDetailsAsync(Guid taskId, string title, string? description, IEnumerable<Guid> assigneeIds, CancellationToken cancellationToken = default);
}
