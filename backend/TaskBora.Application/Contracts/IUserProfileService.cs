using TaskBora.Application.DTOs;

namespace TaskBora.Application.Contracts;

public interface IUserProfileService
{
    Task<UserProfileDto> RegisterAsync(string email, string displayName, CancellationToken cancellationToken = default);
    Task<UserProfileDto?> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task<UserProfileDto?> FindByEmailAsync(string email, CancellationToken cancellationToken = default);
}
