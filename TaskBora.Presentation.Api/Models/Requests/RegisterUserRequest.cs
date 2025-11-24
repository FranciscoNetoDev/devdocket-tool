using System.ComponentModel.DataAnnotations;

namespace TaskBora.Presentation.Api.Models.Requests;

public class RegisterUserRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string DisplayName { get; set; } = string.Empty;
}
