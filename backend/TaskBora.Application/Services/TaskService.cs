using TaskBora.Application.Contracts;
using TaskBora.Application.DTOs;
using TaskBora.Domain.Entities;
using TaskBora.Domain.Enums;
using TaskBora.Domain.Repositories;

namespace TaskBora.Application.Services;

public class TaskService : ITaskService
{
    private readonly ITaskRepository _taskRepository;

    public TaskService(ITaskRepository taskRepository)
    {
        _taskRepository = taskRepository;
    }

    public async Task<TaskDto> CreateAsync(Guid projectId, string title, string? description, int order, IEnumerable<Guid> assigneeIds, CancellationToken cancellationToken = default)
    {
        var task = new TaskItem(projectId, title, description, order);
        foreach (var userId in assigneeIds)
        {
            task.AssignUser(userId);
        }

        await _taskRepository.AddAsync(task, cancellationToken);
        return ToDto(task);
    }

    public async Task<TaskDto?> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var task = await _taskRepository.GetByIdAsync(id, cancellationToken);
        return task is null ? null : ToDto(task);
    }

    public async Task<IReadOnlyCollection<TaskDto>> GetBacklogAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var tasks = await _taskRepository.GetByProjectAsync(projectId, cancellationToken);
        return tasks.Select(ToDto).OrderBy(t => t.Order).ToArray();
    }

    public async Task<IReadOnlyCollection<TaskDto>> GetBySprintAsync(Guid sprintId, CancellationToken cancellationToken = default)
    {
        var tasks = await _taskRepository.GetBySprintAsync(sprintId, cancellationToken);
        return tasks.Select(ToDto).OrderBy(t => t.Order).ToArray();
    }

    public async Task AssignToSprintAsync(Guid taskId, Guid? sprintId, CancellationToken cancellationToken = default)
    {
        await _taskRepository.AssignToSprintAsync(taskId, sprintId, cancellationToken);
    }

    public async Task UpdateStatusAsync(Guid taskId, TaskStatus status, CancellationToken cancellationToken = default)
    {
        await _taskRepository.UpdateStatusAsync(taskId, status, cancellationToken);
    }

    public async Task UpdateOrderAsync(Guid taskId, int order, CancellationToken cancellationToken = default)
    {
        var task = await _taskRepository.GetByIdAsync(taskId, cancellationToken) ?? throw new InvalidOperationException("Task not found");
        task.SetOrder(order);
        await _taskRepository.UpdateAsync(task, cancellationToken);
    }

    public async Task UpdateDetailsAsync(Guid taskId, string title, string? description, IEnumerable<Guid> assigneeIds, CancellationToken cancellationToken = default)
    {
        var task = await _taskRepository.GetByIdAsync(taskId, cancellationToken) ?? throw new InvalidOperationException("Task not found");
        task.UpdateDetails(title, description);

        task.SetAssignees(assigneeIds);

        await _taskRepository.UpdateAsync(task, cancellationToken);
    }

    private static TaskDto ToDto(TaskItem task)
    {
        return new TaskDto(
            task.Id,
            task.ProjectId,
            task.SprintId,
            task.Title,
            task.Description,
            task.Status,
            task.Order,
            task.Assignees.Select(a => a.UserId).ToArray()
        );
    }
}
