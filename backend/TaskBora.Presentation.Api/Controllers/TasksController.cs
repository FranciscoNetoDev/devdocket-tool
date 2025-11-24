using Microsoft.AspNetCore.Mvc;
using TaskBora.Application.Contracts;
using TaskBora.Application.DTOs;
using TaskBora.Domain.Enums;
using TaskBora.Presentation.Api.Models.Requests;

namespace TaskBora.Presentation.Api.Controllers;

[ApiController]
[Route("api/tasks")]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    [HttpGet("backlog/{projectId:guid}")]
    public async Task<ActionResult<IReadOnlyCollection<TaskDto>>> GetBacklog(Guid projectId, CancellationToken cancellationToken)
    {
        var tasks = await _taskService.GetBacklogAsync(projectId, cancellationToken);
        return Ok(tasks);
    }

    [HttpGet("sprint/{sprintId:guid}")]
    public async Task<ActionResult<IReadOnlyCollection<TaskDto>>> GetBySprint(Guid sprintId, CancellationToken cancellationToken)
    {
        var tasks = await _taskService.GetBySprintAsync(sprintId, cancellationToken);
        return Ok(tasks);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TaskDto>> GetTask(Guid id, CancellationToken cancellationToken)
    {
        var task = await _taskService.GetAsync(id, cancellationToken);
        return task is null ? NotFound() : Ok(task);
    }

    [HttpPost]
    public async Task<ActionResult<TaskDto>> Create([FromBody] CreateTaskRequest request, CancellationToken cancellationToken)
    {
        var task = await _taskService.CreateAsync(request.ProjectId, request.Title, request.Description, request.Order, request.AssigneeIds, cancellationToken);
        return CreatedAtAction(nameof(GetTask), new { id = task.Id }, task);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateTaskStatusRequest request, CancellationToken cancellationToken)
    {
        await _taskService.UpdateStatusAsync(id, request.Status, cancellationToken);
        return NoContent();
    }

    [HttpPatch("{id:guid}/details")]
    public async Task<IActionResult> UpdateDetails(Guid id, [FromBody] UpdateTaskDetailsRequest request, CancellationToken cancellationToken)
    {
        await _taskService.UpdateDetailsAsync(id, request.Title, request.Description, request.AssigneeIds, cancellationToken);
        return NoContent();
    }

    [HttpPatch("{id:guid}/order")]
    public async Task<IActionResult> UpdateOrder(Guid id, [FromQuery] int order, CancellationToken cancellationToken)
    {
        await _taskService.UpdateOrderAsync(id, order, cancellationToken);
        return NoContent();
    }

    [HttpPatch("{id:guid}/sprint")]
    public async Task<IActionResult> AssignSprint(Guid id, [FromBody] AssignSprintRequest request, CancellationToken cancellationToken)
    {
        await _taskService.AssignToSprintAsync(id, request.SprintId, cancellationToken);
        return NoContent();
    }
}
