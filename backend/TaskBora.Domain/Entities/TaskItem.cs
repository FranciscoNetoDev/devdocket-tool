using TaskBora.Domain.Abstractions;
using TaskBora.Domain.DomainEvents;
using TaskBora.Domain.Enums;

namespace TaskBora.Domain.Entities;

public class TaskItem : Entity
{
    private readonly List<TaskAssignee> _assignees = new();

    public Guid ProjectId { get; private set; }
    public Guid? SprintId { get; private set; }
    public string Title { get; private set; }
    public string? Description { get; private set; }
    public TaskStatus Status { get; private set; } = TaskStatus.Backlog;
    public int Order { get; private set; }

    public IReadOnlyCollection<TaskAssignee> Assignees => _assignees.AsReadOnly();

    public TaskItem(Guid projectId, string title, string? description, int order)
    {
        ProjectId = projectId;
        Title = title;
        Description = description;
        Order = order;
    }

    public void UpdateDetails(string title, string? description)
    {
        Title = title;
        Description = description;
        Touch();
    }

    public void MoveToStatus(TaskStatus status)
    {
        if (Status == status)
        {
            return;
        }

        Status = status;
        Touch();
        // Domain event placeholder for integrations
        DomainEvents.Add(new TaskStatusChangedEvent(Id, status));
    }

    public void SetSprint(Guid? sprintId)
    {
        SprintId = sprintId;
        Touch();
    }

    public void SetOrder(int order)
    {
        Order = order;
        Touch();
    }

    public void AssignUser(Guid userId)
    {
        if (_assignees.Any(a => a.UserId == userId))
        {
            return;
        }

        _assignees.Add(new TaskAssignee(Id, userId));
        Touch();
    }

    public void SetAssignees(IEnumerable<Guid> userIds)
    {
        _assignees.Clear();
        foreach (var id in userIds.Distinct())
        {
            _assignees.Add(new TaskAssignee(Id, id));
        }

        Touch();
    }

    public List<DomainEvent> DomainEvents { get; } = new();
}

public class TaskAssignee : Entity
{
    public Guid TaskId { get; private set; }
    public Guid UserId { get; private set; }

    public TaskAssignee(Guid taskId, Guid userId)
    {
        TaskId = taskId;
        UserId = userId;
    }
}
