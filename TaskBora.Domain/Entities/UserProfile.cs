using TaskBora.Domain.Abstractions;
using TaskBora.Domain.ValueObjects;

namespace TaskBora.Domain.Entities;

public class UserProfile : Entity, IAggregateRoot
{
    public Email Email { get; private set; }
    public string DisplayName { get; private set; }

    public UserProfile(Email email, string displayName)
    {
        Email = email;
        DisplayName = displayName;
    }

    public void UpdateDisplayName(string displayName)
    {
        DisplayName = displayName;
        Touch();
    }
}
