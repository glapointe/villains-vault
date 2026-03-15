namespace Falchion.Villains.Vault.Api.DTOs;

/// <summary>
/// Non-streaming chat response (used as mobile fallback).
/// </summary>
public sealed class ChatResponse
{
	/// <summary>
	/// Tool call steps the agent performed while generating the response.
	/// </summary>
	public required List<ChatStep> Steps { get; init; }

	/// <summary>
	/// The final text response from the agent.
	/// </summary>
	public required string Message { get; init; }
}

/// <summary>
/// A single tool-call step performed by the agent.
/// </summary>
public sealed class ChatStep
{
	/// <summary>The event type: "thinking", "tool_result", "error".</summary>
	public required string Type { get; init; }

	/// <summary>Name of the tool being called (e.g., "SearchRunnerByName").</summary>
	public string? ToolName { get; init; }

	/// <summary>Arguments passed to the tool, as JSON string.</summary>
	public string? Arguments { get; init; }

	/// <summary>Result returned by the tool, as JSON string.</summary>
	public string? Result { get; init; }
}
