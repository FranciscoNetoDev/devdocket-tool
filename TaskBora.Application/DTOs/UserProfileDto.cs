namespace TaskBora.Application.DTOs;

public record UserProfileDto
(
    Guid Id,
    string Email,
    string DisplayName
);
