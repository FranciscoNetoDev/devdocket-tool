using TaskBora.Domain.Abstractions;

namespace TaskBora.Domain.Entities;

public class Project : Entity, IAggregateRoot
{
    private readonly List<TaskItem> _tasks = new();
    private readonly List<Sprint> _sprints = new();

    public string Name { get; private set; }
    public string? Description { get; private set; }

    public IReadOnlyCollection<TaskItem> Tasks => _tasks.AsReadOnly();
    public IReadOnlyCollection<Sprint> Sprints => _sprints.AsReadOnly();

    public Project(string name, string? description = null)
    {
        Name = name;
        Description = description;
    }

    public TaskItem AddTask(TaskItem task)
    {
        _tasks.Add(task);
        Touch();
        return task;
    }

    public Sprint AddSprint(string name, DateTime? startAt, DateTime? endAt)
    {
        var sprint = new Sprint(name, Id, startAt, endAt);
        _sprints.Add(sprint);
        Touch();
        return sprint;
    }

    public void UpdateDetails(string name, string? description)
    {
        Name = name;
        Description = description;
        Touch();
    }
}
