using Microsoft.EntityFrameworkCore;
using TaskBora.Domain.Entities;
using TaskBora.Domain.Enums;
using TaskBora.Domain.Repositories;
using TaskBora.Infrastructure.Persistence;

namespace TaskBora.Infrastructure.Repositories;

public class TaskRepository : ITaskRepository
{
    private readonly TaskBoraDbContext _dbContext;

    public TaskRepository(TaskBoraDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(TaskItem task, CancellationToken cancellationToken = default)
    {
        _dbContext.Tasks.Add(task);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task AssignToSprintAsync(Guid taskId, Guid? sprintId, CancellationToken cancellationToken = default)
    {
        var task = await GetByIdAsync(taskId, cancellationToken) ?? throw new InvalidOperationException("Task not found");
        task.SetSprint(sprintId);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<TaskItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Tasks
            .Include(t => t.Assignees)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<TaskItem>> GetByProjectAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Tasks
            .Include(t => t.Assignees)
            .Where(t => t.ProjectId == projectId && t.SprintId == null)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<TaskItem>> GetBySprintAsync(Guid sprintId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Tasks
            .Include(t => t.Assignees)
            .Where(t => t.SprintId == sprintId)
            .ToListAsync(cancellationToken);
    }

    public async Task UpdateAsync(TaskItem task, CancellationToken cancellationToken = default)
    {
        _dbContext.Tasks.Update(task);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateStatusAsync(Guid taskId, TaskStatus status, CancellationToken cancellationToken = default)
    {
        var task = await GetByIdAsync(taskId, cancellationToken) ?? throw new InvalidOperationException("Task not found");
        task.MoveToStatus(status);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
