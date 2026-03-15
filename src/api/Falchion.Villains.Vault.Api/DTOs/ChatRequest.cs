namespace Falchion.Villains.Vault.Api.DTOs;

/// <summary>
/// Request payload for the chat endpoint.
/// </summary>
public sealed class ChatRequest
{
	/// <summary>
	/// The user's message or prompt.
	/// </summary>
	public required string Message { get; init; }

	/// <summary>
	/// Optional context from the page the user is on.
	/// Helps the agent provide more relevant responses.
	/// </summary>
	public ChatContext? Context { get; init; }
}

/// <summary>
/// Context about what the user is currently viewing.
/// </summary>
public sealed class ChatContext
{
	/// <summary>Race ID if the user is on a race page.</summary>
	public int? RaceId { get; init; }

	/// <summary>Race result ID if the user is on a result page.</summary>
	public long? ResultId { get; init; }

	/// <summary>Event ID if the user is viewing an event.</summary>
	public int? EventId { get; init; }

	/// <summary>Name of the page the user is currently on (e.g., "race", "result", "home").</summary>
	public string? PageName { get; init; }

	/// <summary>Runner name shown on the current page, if applicable.</summary>
	public string? RunnerName { get; init; }

	/// <summary>
	/// Hidden supplemental instructions for the agent. Used by predefined prompts
	/// to refine agent behavior without showing implementation details to the user.
	/// </summary>
	public string? SupplementalInstructions { get; init; }
}
