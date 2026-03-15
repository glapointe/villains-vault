using System.Text.RegularExpressions;

namespace Falchion.Villains.Vault.Api.Utils;

/// <summary>
/// Utility methods for parsing strings to common data types.
/// </summary>
public static class ParseHelpers
{
	/// <summary>
	/// Parses a string to an integer, removing all non-digit characters.
	/// Returns null if parsing fails or input is empty.
	/// </summary>
	/// <param name="text">The text to parse</param>
	/// <returns>Parsed integer or null</returns>
	public static int? ParseInt(string? text)
	{
		if (string.IsNullOrWhiteSpace(text))
			return null;

		var cleaned = Regex.Replace(text, @"[^\d]", "");
		return int.TryParse(cleaned, out var value) ? value : null;
	}

	/// <summary>
	/// Parses a string to a TimeSpan in format "HH:MM:SS" or "MM:SS".
	/// Returns null if parsing fails or input is empty.
	/// </summary>
	/// <param name="text">The text to parse (e.g., "3:16:23", "1:37:26", or "43:17")</param>
	/// <returns>Parsed TimeSpan or null</returns>
	public static TimeSpan? ParseTimeSpan(string? text)
	{
		if (string.IsNullOrWhiteSpace(text))
			return null;

		var trimmed = text.Trim();

		// If the time is in MM:SS format (only 2 parts), prepend "00:" to make it HH:MM:SS
		var parts = trimmed.Split(':');
		if (parts.Length == 2)
		{
			trimmed = $"00:{trimmed}";
		}

		// Parse time in format "HH:MM:SS"
		// Track Shack uses formats like "3:16:23" for finish times, "1:37:26" for splits,
		// and "43:17" for shorter splits
		if (TimeSpan.TryParse(trimmed, out var value))
		{
			return value;
		}
		return null;
	}
}
