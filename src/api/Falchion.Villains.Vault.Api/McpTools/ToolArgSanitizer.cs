namespace Falchion.Villains.Vault.Api.McpTools;

/// <summary>
/// Sanitizes MCP tool arguments to catch placeholder values that AI models
/// sometimes pass for optional/nullable parameters (e.g., "any", "all", "none").
/// </summary>
internal static class ToolArgSanitizer
{
	/// <summary>
	/// Base URL for the production Villains Vault web app.
	/// </summary>
	public const string BaseUrl = "https://vault.villains.run";

	/// <summary>
	/// Returns the full URL for a race page.
	/// </summary>
	public static string RaceUrl(int raceId) => $"{BaseUrl}/race/{raceId}";

	/// <summary>
	/// Returns the full URL for a result page.
	/// </summary>
	public static string ResultUrl(long resultId) => $"{BaseUrl}/results/{resultId}";
	/// <summary>
	/// Placeholder values that AI models commonly pass instead of omitting optional parameters.
	/// </summary>
	private static readonly HashSet<string> PlaceholderValues = new(StringComparer.OrdinalIgnoreCase)
	{
		"any", "all", "none", "empty", "null", "n/a", "na", "undefined",
		"*", "everything", "everybody", "everyone", "anything"
	};

	/// <summary>
	/// Returns null if the value is null, whitespace, or a known placeholder; otherwise returns the trimmed value.
	/// </summary>
	public static string? Sanitize(string? value)
	{
		if (string.IsNullOrWhiteSpace(value))
			return null;

		var trimmed = value.Trim();
		return PlaceholderValues.Contains(trimmed) ? null : trimmed;
	}
}
