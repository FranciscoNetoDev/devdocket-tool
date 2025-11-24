using TaskBora.Domain.Entities;
using TaskBora.Domain.Enums;

namespace TaskBora.Domain.Repositories;

public interface ITaskRepository
{
    Task<TaskItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<TaskItem>> GetByProjectAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<TaskItem>> GetBySprintAsync(Guid sprintId, CancellationToken cancellationToken = default);
    Task AddAsync(TaskItem task, CancellationToken cancellationToken = default);
    Task UpdateAsync(TaskItem task, CancellationToken cancellationToken = default);
    Task UpdateStatusAsync(Guid taskId, TaskStatus status, CancellationToken cancellationToken = default);
    Task AssignToSprintAsync(Guid taskId, Guid? sprintId, CancellationToken cancellationToken = default);
}
