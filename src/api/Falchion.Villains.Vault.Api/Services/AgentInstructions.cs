using Falchion.Villains.Vault.Api.DTOs;

namespace Falchion.Villains.Vault.Api.Services;

/// <summary>
/// Builds per-request context that is prepended to the user message before
/// sending it to the Foundry agent. The agent's base instructions are
/// configured directly in the Foundry portal — this class only provides
/// supplemental context such as user identity, current page, and any
/// hidden prompt-specific instructions.
/// </summary>
public sealed class AgentInstructions
{
	/// <summary>
	/// Builds the per-request context prefix (user identity + page context +
	/// supplemental instructions). This is prepended to the user message so the
	/// Foundry agent can personalise its response without modifying the agent's
	/// base instructions.
	/// Returns an empty string if there is no context to add.
	/// </summary>
	public string BuildContextPrefix(string? userName = null, ChatContext? context = null)
	{
		var parts = new List<string>();

		if (!string.IsNullOrWhiteSpace(userName))
		{
			parts.Add($"[Context: The user's name is **{userName}**. When they ask about \"my\" races or results, search for this name.]");
		}

		if (context is not null)
		{
			var contextLines = new List<string>();

			if (context.RaceId.HasValue)
				contextLines.Add($"- Currently viewing race ID **{context.RaceId}**.");
			if (context.ResultId.HasValue)
				contextLines.Add($"- Currently viewing result ID **{context.ResultId}**.");
			if (context.EventId.HasValue)
				contextLines.Add($"- Currently viewing event ID **{context.EventId}**.");
			if (!string.IsNullOrWhiteSpace(context.RunnerName))
				contextLines.Add($"- Currently viewing runner **{context.RunnerName}**.");
			if (!string.IsNullOrWhiteSpace(context.PageName))
				contextLines.Add($"- Page: **{context.PageName}**.");

			if (contextLines.Count > 0)
			{
				parts.Add("[Page context:\n" + string.Join("\n", contextLines)
					+ "\nUse this context to make your response more relevant. For example, if they're on a race page, you can reference that race directly without asking which race they mean.]");
			}

			if (!string.IsNullOrWhiteSpace(context.SupplementalInstructions))
			{
				parts.Add($"[Supplemental instructions: {context.SupplementalInstructions}]");
			}
		}

		return string.Join("\n", parts);
	}
}
