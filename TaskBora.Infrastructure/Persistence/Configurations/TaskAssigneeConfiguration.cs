using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskBora.Domain.Entities;

namespace TaskBora.Infrastructure.Persistence.Configurations;

public class TaskAssigneeConfiguration : IEntityTypeConfiguration<TaskAssignee>
{
    public void Configure(EntityTypeBuilder<TaskAssignee> builder)
    {
        builder.ToTable("task_assignees");
        builder.HasKey(a => a.Id);
        builder.HasIndex(a => new { a.TaskId, a.UserId }).IsUnique();
    }
}
