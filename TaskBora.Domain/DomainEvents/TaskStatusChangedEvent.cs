using TaskBora.Domain.Abstractions;
using TaskBora.Domain.Enums;

namespace TaskBora.Domain.DomainEvents;

public sealed class TaskStatusChangedEvent : DomainEvent
{
    public Guid TaskId { get; }
    public TaskStatus Status { get; }

    public TaskStatusChangedEvent(Guid taskId, TaskStatus status)
    {
        TaskId = taskId;
        Status = status;
    }
}
