using System;
using Microsoft.AspNetCore.Mvc;
using TaskBora.Application.Contracts;
using TaskBora.Application.DTOs;
using TaskBora.Presentation.Api.Models.Requests;

namespace TaskBora.Presentation.Api.Controllers;

[ApiController]
[Route("api/projects")]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;
    private readonly ISprintService _sprintService;
    private readonly ITaskService _taskService;

    public ProjectsController(IProjectService projectService, ISprintService sprintService, ITaskService taskService)
    {
        _projectService = projectService;
        _sprintService = sprintService;
        _taskService = taskService;
    }

    [HttpGet("user/{userId:guid}")]
    public async Task<ActionResult<IReadOnlyCollection<ProjectDto>>> GetForUser(Guid userId, CancellationToken cancellationToken)
    {
        var projects = await _projectService.GetForUserAsync(userId, cancellationToken);
        return Ok(projects);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProjectDto>> Get(Guid id, CancellationToken cancellationToken)
    {
        var project = await _projectService.GetAsync(id, cancellationToken);
        return project is null ? NotFound() : Ok(project);
    }

    [HttpPost]
    public async Task<ActionResult<ProjectDto>> Create([FromBody] CreateProjectRequest request, CancellationToken cancellationToken)
    {
        var project = await _projectService.CreateAsync(request.Name, request.Description, cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = project.Id }, project);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProjectRequest request, CancellationToken cancellationToken)
    {
        await _projectService.UpdateAsync(id, request.Name, request.Description, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _projectService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpGet("{projectId:guid}/sprints")]
    public async Task<ActionResult<IReadOnlyCollection<SprintDto>>> GetSprints(Guid projectId, CancellationToken cancellationToken)
    {
        var sprints = await _sprintService.GetForProjectAsync(projectId, cancellationToken);
        return Ok(sprints);
    }

    [HttpGet("{projectId:guid}/members")]
    public ActionResult<IReadOnlyCollection<object>> GetMembers(Guid projectId)
    {
        // Memberships are still modeled on the frontend via Supabase; the DDD model will be expanded in the next iteration.
        return Ok(Array.Empty<object>());
    }

    [HttpPost("{projectId:guid}/sprints")]
    public async Task<ActionResult<SprintDto>> CreateSprint(Guid projectId, [FromBody] CreateSprintRequest request, CancellationToken cancellationToken)
    {
        var sprint = await _sprintService.CreateAsync(projectId, request.Name, request.StartsAt, request.EndsAt, cancellationToken);
        return CreatedAtAction(nameof(GetSprints), new { projectId }, sprint);
    }

    [HttpGet("{projectId:guid}/backlog")]
    public async Task<ActionResult<IReadOnlyCollection<TaskDto>>> GetBacklog(Guid projectId, CancellationToken cancellationToken)
    {
        var tasks = await _taskService.GetBacklogAsync(projectId, cancellationToken);
        return Ok(tasks);
    }
}
