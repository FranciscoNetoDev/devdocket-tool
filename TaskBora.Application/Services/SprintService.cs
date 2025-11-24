using TaskBora.Application.Contracts;
using TaskBora.Application.DTOs;
using TaskBora.Domain.Entities;
using TaskBora.Domain.Repositories;

namespace TaskBora.Application.Services;

public class SprintService : ISprintService
{
    private readonly ISprintRepository _sprintRepository;

    public SprintService(ISprintRepository sprintRepository)
    {
        _sprintRepository = sprintRepository;
    }

    public async Task<SprintDto> CreateAsync(Guid projectId, string name, DateTime? startsAt, DateTime? endsAt, CancellationToken cancellationToken = default)
    {
        var sprint = new Sprint(name, projectId, startsAt, endsAt);
        await _sprintRepository.AddAsync(sprint, cancellationToken);
        return ToDto(sprint);
    }

    public async Task<IReadOnlyCollection<SprintDto>> GetForProjectAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var sprints = await _sprintRepository.GetByProjectAsync(projectId, cancellationToken);
        return sprints.Select(ToDto).ToArray();
    }

    public async Task CloseAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var sprint = await _sprintRepository.GetByIdAsync(id, cancellationToken) ?? throw new InvalidOperationException("Sprint not found");
        sprint.Close();
        await _sprintRepository.UpdateAsync(sprint, cancellationToken);
    }

    private static SprintDto ToDto(Sprint sprint) => new(sprint.Id, sprint.ProjectId, sprint.Name, sprint.StartsAt, sprint.EndsAt, sprint.IsClosed);
}
