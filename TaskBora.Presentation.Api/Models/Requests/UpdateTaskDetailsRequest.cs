using System.ComponentModel.DataAnnotations;

namespace TaskBora.Presentation.Api.Models.Requests;

public class UpdateTaskDetailsRequest
{
    [Required]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public IEnumerable<Guid> AssigneeIds { get; set; } = Array.Empty<Guid>();
}
