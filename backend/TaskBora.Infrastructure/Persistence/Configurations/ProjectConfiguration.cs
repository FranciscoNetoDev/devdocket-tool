using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskBora.Domain.Entities;

namespace TaskBora.Infrastructure.Persistence.Configurations;

public class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        builder.ToTable("projects");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Name).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Description).HasMaxLength(1000);

        builder.HasMany<TaskItem>("_tasks").WithOne().HasForeignKey(t => t.ProjectId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany<Sprint>("_sprints").WithOne().HasForeignKey(s => s.ProjectId).OnDelete(DeleteBehavior.Cascade);
    }
}
