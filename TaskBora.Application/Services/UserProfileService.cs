using TaskBora.Application.Contracts;
using TaskBora.Application.DTOs;
using TaskBora.Domain.Entities;
using TaskBora.Domain.Repositories;
using TaskBora.Domain.ValueObjects;

namespace TaskBora.Application.Services;

public class UserProfileService : IUserProfileService
{
    private readonly IUserProfileRepository _repository;

    public UserProfileService(IUserProfileRepository repository)
    {
        _repository = repository;
    }

    public async Task<UserProfileDto> RegisterAsync(string email, string displayName, CancellationToken cancellationToken = default)
    {
        var profile = new UserProfile(new Email(email), displayName);
        await _repository.AddAsync(profile, cancellationToken);
        return ToDto(profile);
    }

    public async Task<UserProfileDto?> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var profile = await _repository.GetByIdAsync(id, cancellationToken);
        return profile is null ? null : ToDto(profile);
    }

    public async Task<UserProfileDto?> FindByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var profile = await _repository.GetByEmailAsync(email, cancellationToken);
        return profile is null ? null : ToDto(profile);
    }

    private static UserProfileDto ToDto(UserProfile profile) => new(profile.Id, profile.Email.Value, profile.DisplayName);
}
