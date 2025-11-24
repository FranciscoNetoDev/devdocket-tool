using Microsoft.EntityFrameworkCore;
using TaskBora.Domain.Entities;
using TaskBora.Domain.Repositories;
using TaskBora.Infrastructure.Persistence;

namespace TaskBora.Infrastructure.Repositories;

public class SprintRepository : ISprintRepository
{
    private readonly TaskBoraDbContext _dbContext;

    public SprintRepository(TaskBoraDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(Sprint sprint, CancellationToken cancellationToken = default)
    {
        _dbContext.Sprints.Add(sprint);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Sprint?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Sprints.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<Sprint>> GetByProjectAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Sprints.Where(s => s.ProjectId == projectId).OrderBy(s => s.StartsAt).ToListAsync(cancellationToken);
    }

    public async Task UpdateAsync(Sprint sprint, CancellationToken cancellationToken = default)
    {
        _dbContext.Sprints.Update(sprint);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
