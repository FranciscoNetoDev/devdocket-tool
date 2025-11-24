namespace TaskBora.Domain.Abstractions;

public abstract class DomainEvent
{
    public DateTime OccurredOn { get; } = DateTime.UtcNow;
}
