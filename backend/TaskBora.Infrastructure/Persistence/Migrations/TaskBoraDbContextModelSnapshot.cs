using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using TaskBora.Infrastructure.Persistence;

namespace TaskBora.Infrastructure.Persistence.Migrations;

[DbContext(typeof(TaskBoraDbContext))]
partial class TaskBoraDbContextModelSnapshot : ModelSnapshot
{
    protected override void BuildModel(ModelBuilder modelBuilder)
    {
#pragma warning disable 612, 618
        modelBuilder
            .HasAnnotation("ProductVersion", "8.0.10")
            .HasAnnotation("Relational:MaxIdentifierLength", 128);

        SqlServerModelBuilderExtensions.UseIdentityColumns(modelBuilder);

        modelBuilder.Entity("TaskBora.Domain.Entities.Project", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uniqueidentifier");

            b.Property<DateTime>("CreatedAt")
                .HasColumnType("datetime2");

            b.Property<string>("Description")
                .HasMaxLength(1000)
                .HasColumnType("nvarchar(1000)");

            b.Property<string>("Name")
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnType("nvarchar(200)");

            b.Property<DateTime?>("UpdatedAt")
                .HasColumnType("datetime2");

            b.HasKey("Id");

            b.ToTable("projects", (string)null);
        });

        modelBuilder.Entity("TaskBora.Domain.Entities.Sprint", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uniqueidentifier");

            b.Property<DateTime>("CreatedAt")
                .HasColumnType("datetime2");

            b.Property<DateTime?>("EndsAt")
                .HasColumnType("datetime2");

            b.Property<bool>("IsClosed")
                .HasColumnType("bit");

            b.Property<string>("Name")
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnType("nvarchar(200)");

            b.Property<Guid>("ProjectId")
                .HasColumnType("uniqueidentifier");

            b.Property<DateTime?>("StartsAt")
                .HasColumnType("datetime2");

            b.Property<DateTime?>("UpdatedAt")
                .HasColumnType("datetime2");

            b.HasKey("Id");

            b.HasIndex("ProjectId");

            b.ToTable("sprints", (string)null);
        });

        modelBuilder.Entity("TaskBora.Domain.Entities.TaskAssignee", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uniqueidentifier");

            b.Property<DateTime>("CreatedAt")
                .HasColumnType("datetime2");

            b.Property<Guid>("TaskId")
                .HasColumnType("uniqueidentifier");

            b.Property<Guid>("UserId")
                .HasColumnType("uniqueidentifier");

            b.Property<DateTime?>("UpdatedAt")
                .HasColumnType("datetime2");

            b.HasKey("Id");

            b.HasIndex("TaskId");

            b.HasIndex("TaskId", "UserId")
                .IsUnique();

            b.ToTable("task_assignees", (string)null);
        });

        modelBuilder.Entity("TaskBora.Domain.Entities.TaskItem", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uniqueidentifier");

            b.Property<DateTime>("CreatedAt")
                .HasColumnType("datetime2");

            b.Property<string>("Description")
                .HasMaxLength(2000)
                .HasColumnType("nvarchar(2000)");

            b.Property<int>("Order")
                .HasColumnType("int");

            b.Property<Guid>("ProjectId")
                .HasColumnType("uniqueidentifier");

            b.Property<Guid?>("SprintId")
                .HasColumnType("uniqueidentifier");

            b.Property<int>("Status")
                .HasColumnType("int");

            b.Property<string>("Title")
                .IsRequired()
                .HasMaxLength(300)
                .HasColumnType("nvarchar(300)");

            b.Property<DateTime?>("UpdatedAt")
                .HasColumnType("datetime2");

            b.HasKey("Id");

            b.HasIndex("ProjectId");

            b.HasIndex("SprintId");

            b.HasIndex("ProjectId", "Order")
                .IsUnique();

            b.ToTable("tasks", (string)null);
        });

        modelBuilder.Entity("TaskBora.Domain.Entities.UserProfile", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uniqueidentifier");

            b.Property<DateTime>("CreatedAt")
                .HasColumnType("datetime2");

            b.Property<string>("DisplayName")
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnType("nvarchar(200)");

            b.Property<DateTime?>("UpdatedAt")
                .HasColumnType("datetime2");

            b.HasKey("Id");

            b.ToTable("user_profiles", (string)null);

            b.OwnsOne("TaskBora.Domain.ValueObjects.Email", "Email", b1 =>
            {
                b1.Property<Guid>("UserProfileId")
                    .HasColumnType("uniqueidentifier");

                b1.Property<string>("Value")
                    .HasColumnType("nvarchar(320)")
                    .HasMaxLength(320);

                b1.HasKey("UserProfileId");

                b1.ToTable("user_profiles");

                b1.WithOwner()
                    .HasForeignKey("UserProfileId");

                b1.HasIndex(new[] { "Value" }, "IX_user_profiles_Email")
                    .IsUnique();

                b1.Property<string>("Value")
                    .HasColumnName("Email")
                    .HasMaxLength(320)
                    .IsRequired();
            });
        });

        modelBuilder.Entity("TaskBora.Domain.Entities.TaskAssignee", b =>
        {
            b.HasOne("TaskBora.Domain.Entities.TaskItem", null)
                .WithMany("_assignees")
                .HasForeignKey("TaskId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();
        });

        modelBuilder.Entity("TaskBora.Domain.Entities.Sprint", b =>
        {
            b.HasOne("TaskBora.Domain.Entities.Project", null)
                .WithMany("_sprints")
                .HasForeignKey("ProjectId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();
        });

        modelBuilder.Entity("TaskBora.Domain.Entities.TaskItem", b =>
        {
            b.HasOne("TaskBora.Domain.Entities.Project", null)
                .WithMany("_tasks")
                .HasForeignKey("ProjectId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            b.HasOne("TaskBora.Domain.Entities.Sprint", null)
                .WithMany()
                .HasForeignKey("SprintId")
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity("TaskBora.Domain.Entities.Project", b =>
        {
            b.Navigation("_sprints");

            b.Navigation("_tasks");
        });

        modelBuilder.Entity("TaskBora.Domain.Entities.TaskItem", b =>
        {
            b.Navigation("_assignees");
        });
#pragma warning restore 612, 618
    }
}
