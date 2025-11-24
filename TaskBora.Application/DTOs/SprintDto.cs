namespace TaskBora.Application.DTOs;

public record SprintDto
(
    Guid Id,
    Guid ProjectId,
    string Name,
    DateTime? StartsAt,
    DateTime? EndsAt,
    bool IsClosed
);
