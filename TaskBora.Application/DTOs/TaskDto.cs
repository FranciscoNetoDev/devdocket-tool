using TaskBora.Domain.Enums;

namespace TaskBora.Application.DTOs;

public record TaskDto
(
    Guid Id,
    Guid ProjectId,
    Guid? SprintId,
    string Title,
    string? Description,
    TaskStatus Status,
    int Order,
    IReadOnlyCollection<Guid> AssigneeIds
);
