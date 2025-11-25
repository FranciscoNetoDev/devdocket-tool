using Microsoft.EntityFrameworkCore;
using TaskBora.Domain.Entities;
using TaskBora.Domain.Repositories;
using TaskBora.Infrastructure.Persistence;

namespace TaskBora.Infrastructure.Repositories;

public class ProjectRepository : IProjectRepository
{
    private readonly TaskBoraDbContext _dbContext;

    public ProjectRepository(TaskBoraDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(Project project, CancellationToken cancellationToken = default)
    {
        _dbContext.Projects.Add(project);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Project project, CancellationToken cancellationToken = default)
    {
        _dbContext.Projects.Remove(project);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Project?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Projects.Include("_tasks").Include("_sprints").FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<Project>> GetByUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        // Placeholder: in Supabase the membership is on project_users, we would model this separately
        return await _dbContext.Projects.ToListAsync(cancellationToken);
    }

    public async Task UpdateAsync(Project project, CancellationToken cancellationToken = default)
    {
        _dbContext.Projects.Update(project);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
