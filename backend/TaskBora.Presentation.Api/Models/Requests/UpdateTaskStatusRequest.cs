using System.ComponentModel.DataAnnotations;
using TaskBora.Domain.Enums;

namespace TaskBora.Presentation.Api.Models.Requests;

public class UpdateTaskStatusRequest
{
    [Required]
    public TaskStatus Status { get; set; }
}
