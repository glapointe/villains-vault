namespace Falchion.Villains.Vault.Api.DTOs;

/// <summary>
/// A single event in the SSE chat stream.
/// Serialized as JSON in the <c>data:</c> field of a server-sent event.
/// </summary>
public sealed class ChatStreamEvent
{
	/// <summary>
	/// Event type:
	/// <list type="bullet">
	///   <item>"thinking" — a tool call is starting</item>
	///   <item>"tool_result" — a tool call completed</item>
	///   <item>"message_delta" — incremental text from the agent</item>
	///   <item>"message_complete" — the full message is done</item>
	///   <item>"error" — an error occurred</item>
	/// </list>
	/// </summary>
	public required string Type { get; init; }

	/// <summary>Name of the tool being called (for "thinking" / "tool_result" events).</summary>
	public string? ToolName { get; init; }

	/// <summary>Arguments passed to the tool, as JSON string.</summary>
	public string? Arguments { get; init; }

	/// <summary>Tool call ID for correlating thinking/result pairs.</summary>
	public string? ToolCallId { get; init; }

	/// <summary>Text content (for "message_delta" events) or error message (for "error" events).</summary>
	public string? Content { get; init; }

	/// <summary>Tool result content (for "tool_result" events).</summary>
	public string? Result { get; init; }
}
