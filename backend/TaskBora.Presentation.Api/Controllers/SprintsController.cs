using Microsoft.AspNetCore.Mvc;
using TaskBora.Application.Contracts;
using TaskBora.Application.DTOs;
using TaskBora.Presentation.Api.Models.Requests;

namespace TaskBora.Presentation.Api.Controllers;

[ApiController]
[Route("api/sprints")]
public class SprintsController : ControllerBase
{
    private readonly ISprintService _sprintService;

    public SprintsController(ISprintService sprintService)
    {
        _sprintService = sprintService;
    }

    [HttpGet("project/{projectId:guid}")]
    public async Task<ActionResult<IReadOnlyCollection<SprintDto>>> GetForProject(Guid projectId, CancellationToken cancellationToken)
    {
        var sprints = await _sprintService.GetForProjectAsync(projectId, cancellationToken);
        return Ok(sprints);
    }

    [HttpPost]
    public async Task<ActionResult<SprintDto>> Create([FromBody] CreateSprintRequest request, CancellationToken cancellationToken)
    {
        var sprint = await _sprintService.CreateAsync(request.ProjectId, request.Name, request.StartsAt, request.EndsAt, cancellationToken);
        return CreatedAtAction(nameof(GetForProject), new { projectId = request.ProjectId }, sprint);
    }

    [HttpPatch("{id:guid}/close")]
    public async Task<IActionResult> Close(Guid id, CancellationToken cancellationToken)
    {
        await _sprintService.CloseAsync(id, cancellationToken);
        return NoContent();
    }
}
