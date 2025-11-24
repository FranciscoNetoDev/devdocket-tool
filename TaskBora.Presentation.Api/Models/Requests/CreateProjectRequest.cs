using System.ComponentModel.DataAnnotations;

namespace TaskBora.Presentation.Api.Models.Requests;

public class CreateProjectRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
}
