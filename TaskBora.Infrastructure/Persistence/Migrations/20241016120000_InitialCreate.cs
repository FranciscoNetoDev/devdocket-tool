using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace TaskBora.Infrastructure.Persistence.Migrations;

public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "projects",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_projects", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "user_profiles",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Email = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: false),
                DisplayName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_user_profiles", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "sprints",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                ProjectId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                StartsAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                EndsAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsClosed = table.Column<bool>(type: "bit", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_sprints", x => x.Id);
                table.ForeignKey(
                    name: "FK_sprints_projects_ProjectId",
                    column: x => x.ProjectId,
                    principalTable: "projects",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "tasks",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                ProjectId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                SprintId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                Status = table.Column<int>(type: "int", nullable: false),
                Order = table.Column<int>(type: "int", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_tasks", x => x.Id);
                table.ForeignKey(
                    name: "FK_tasks_projects_ProjectId",
                    column: x => x.ProjectId,
                    principalTable: "projects",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_tasks_sprints_SprintId",
                    column: x => x.SprintId,
                    principalTable: "sprints",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateTable(
            name: "task_assignees",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                TaskId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_task_assignees", x => x.Id);
                table.ForeignKey(
                    name: "FK_task_assignees_tasks_TaskId",
                    column: x => x.TaskId,
                    principalTable: "tasks",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_sprints_ProjectId",
            table: "sprints",
            column: "ProjectId");

        migrationBuilder.CreateIndex(
            name: "IX_task_assignees_TaskId",
            table: "task_assignees",
            column: "TaskId");

        migrationBuilder.CreateIndex(
            name: "IX_task_assignees_TaskId_UserId",
            table: "task_assignees",
            columns: new[] { "TaskId", "UserId" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_tasks_ProjectId",
            table: "tasks",
            column: "ProjectId");

        migrationBuilder.CreateIndex(
            name: "IX_tasks_ProjectId_Order",
            table: "tasks",
            columns: new[] { "ProjectId", "Order" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_tasks_SprintId",
            table: "tasks",
            column: "SprintId");

        migrationBuilder.CreateIndex(
            name: "IX_user_profiles_Email",
            table: "user_profiles",
            column: "Email",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "task_assignees");

        migrationBuilder.DropTable(
            name: "user_profiles");

        migrationBuilder.DropTable(
            name: "tasks");

        migrationBuilder.DropTable(
            name: "sprints");

        migrationBuilder.DropTable(
            name: "projects");
    }
}
