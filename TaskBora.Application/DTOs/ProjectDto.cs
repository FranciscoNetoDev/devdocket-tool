namespace TaskBora.Application.DTOs;

public record ProjectDto
(
    Guid Id,
    string Name,
    string? Description
);
