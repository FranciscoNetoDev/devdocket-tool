using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskBora.Domain.Entities;

namespace TaskBora.Infrastructure.Persistence.Configurations;

public class TaskItemConfiguration : IEntityTypeConfiguration<TaskItem>
{
    public void Configure(EntityTypeBuilder<TaskItem> builder)
    {
        builder.ToTable("tasks");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Title).IsRequired().HasMaxLength(300);
        builder.Property(t => t.Description).HasMaxLength(2000);
        builder.Property(t => t.Status).IsRequired();

        builder.HasMany<TaskAssignee>("_assignees").WithOne().HasForeignKey(a => a.TaskId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(t => new { t.ProjectId, t.Order }).IsUnique();
    }
}
