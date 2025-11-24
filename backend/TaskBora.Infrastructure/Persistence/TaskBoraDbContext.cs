using Microsoft.EntityFrameworkCore;
using TaskBora.Domain.Entities;

namespace TaskBora.Infrastructure.Persistence;

public class TaskBoraDbContext : DbContext
{
    public TaskBoraDbContext(DbContextOptions<TaskBoraDbContext> options) : base(options)
    {
    }

    public DbSet<Project> Projects => Set<Project>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<TaskAssignee> TaskAssignees => Set<TaskAssignee>();
    public DbSet<Sprint> Sprints => Set<Sprint>();
    public DbSet<UserProfile> Users => Set<UserProfile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TaskBoraDbContext).Assembly);
    }
}
