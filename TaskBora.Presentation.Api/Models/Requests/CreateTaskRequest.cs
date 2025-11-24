using System.ComponentModel.DataAnnotations;
using TaskBora.Domain.Enums;

namespace TaskBora.Presentation.Api.Models.Requests;

public class CreateTaskRequest
{
    [Required]
    public Guid ProjectId { get; set; }

    [Required]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int Order { get; set; }

    public IEnumerable<Guid> AssigneeIds { get; set; } = Array.Empty<Guid>();
}
