using TaskBora.Domain.Abstractions;

namespace TaskBora.Domain.Entities;

public class Sprint : Entity
{
    public Guid ProjectId { get; private set; }
    public string Name { get; private set; }
    public DateTime? StartsAt { get; private set; }
    public DateTime? EndsAt { get; private set; }
    public bool IsClosed { get; private set; }

    public Sprint(string name, Guid projectId, DateTime? startsAt, DateTime? endsAt)
    {
        Name = name;
        ProjectId = projectId;
        StartsAt = startsAt;
        EndsAt = endsAt;
    }

    public void Update(string name, DateTime? startsAt, DateTime? endsAt)
    {
        Name = name;
        StartsAt = startsAt;
        EndsAt = endsAt;
        Touch();
    }

    public void Close()
    {
        IsClosed = true;
        Touch();
    }
}
