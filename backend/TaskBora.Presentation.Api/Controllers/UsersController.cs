using Microsoft.AspNetCore.Mvc;
using TaskBora.Application.Contracts;
using TaskBora.Application.DTOs;
using TaskBora.Presentation.Api.Models.Requests;

namespace TaskBora.Presentation.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserProfileService _userProfileService;

    public UsersController(IUserProfileService userProfileService)
    {
        _userProfileService = userProfileService;
    }

    [HttpPost]
    public async Task<ActionResult<UserProfileDto>> Register([FromBody] RegisterUserRequest request, CancellationToken cancellationToken)
    {
        var user = await _userProfileService.RegisterAsync(request.Email, request.DisplayName, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserProfileDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var user = await _userProfileService.GetAsync(id, cancellationToken);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpGet("by-email")]
    public async Task<ActionResult<UserProfileDto>> GetByEmail([FromQuery] string email, CancellationToken cancellationToken)
    {
        var user = await _userProfileService.FindByEmailAsync(email, cancellationToken);
        return user is null ? NotFound() : Ok(user);
    }
}
