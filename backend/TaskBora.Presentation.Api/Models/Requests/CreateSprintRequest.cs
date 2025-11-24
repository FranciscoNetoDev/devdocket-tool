using System.ComponentModel.DataAnnotations;

namespace TaskBora.Presentation.Api.Models.Requests;

public class CreateSprintRequest
{
    [Required]
    public Guid ProjectId { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    public DateTime? StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }
}
