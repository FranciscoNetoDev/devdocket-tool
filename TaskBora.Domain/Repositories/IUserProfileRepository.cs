using TaskBora.Domain.Entities;

namespace TaskBora.Domain.Repositories;

public interface IUserProfileRepository
{
    Task<UserProfile?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<UserProfile?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(UserProfile profile, CancellationToken cancellationToken = default);
    Task UpdateAsync(UserProfile profile, CancellationToken cancellationToken = default);
}
