using System.Text.RegularExpressions;

namespace TaskBora.Domain.ValueObjects;

public readonly record struct Email
{
    private static readonly Regex EmailRegex = new("^[^@\s]+@[^@\s]+\\.[^@\s]+$", RegexOptions.Compiled);

    public string Value { get; }

    public Email(string value)
    {
        if (string.IsNullOrWhiteSpace(value) || !EmailRegex.IsMatch(value))
        {
            throw new ArgumentException("Email is invalid", nameof(value));
        }

        Value = value.Trim();
    }

    public override string ToString() => Value;
}
