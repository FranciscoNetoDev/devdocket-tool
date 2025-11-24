using Microsoft.EntityFrameworkCore;
using TaskBora.Domain.Entities;
using TaskBora.Domain.Repositories;
using TaskBora.Infrastructure.Persistence;

namespace TaskBora.Infrastructure.Repositories;

public class UserProfileRepository : IUserProfileRepository
{
    private readonly TaskBoraDbContext _dbContext;

    public UserProfileRepository(TaskBoraDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(UserProfile profile, CancellationToken cancellationToken = default)
    {
        _dbContext.Users.Add(profile);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<UserProfile?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Users.FirstOrDefaultAsync(u => u.Email.Value == email, cancellationToken);
    }

    public async Task<UserProfile?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    public async Task UpdateAsync(UserProfile profile, CancellationToken cancellationToken = default)
    {
        _dbContext.Users.Update(profile);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
