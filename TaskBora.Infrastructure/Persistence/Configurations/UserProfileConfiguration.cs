using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskBora.Domain.Entities;

namespace TaskBora.Infrastructure.Persistence.Configurations;

public class UserProfileConfiguration : IEntityTypeConfiguration<UserProfile>
{
    public void Configure(EntityTypeBuilder<UserProfile> builder)
    {
        builder.ToTable("user_profiles");
        builder.HasKey(u => u.Id);
        builder.OwnsOne(u => u.Email, email =>
        {
            email.Property(e => e.Value).HasColumnName("Email").HasMaxLength(320).IsRequired();
            email.HasIndex(e => e.Value).IsUnique();
        });

        builder.Property(u => u.DisplayName).HasMaxLength(200).IsRequired();
    }
}
