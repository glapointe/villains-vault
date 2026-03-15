namespace Falchion.Villains.Vault.Api.Utils;

/// <summary>
/// Utility class for normalizing URLs to ensure consistent identification of events and races.
/// Normalizes URLs by converting to lowercase, removing query strings, fragments, and trailing slashes.
/// Also provides validation for Track Shack URLs.
/// </summary>
public static class UrlNormalizer
{
	/// <summary>
	/// Normalizes a URL for consistent comparison and storage.
	/// - Converts to absolute URL if base URL is provided
	/// - Converts to lowercase
	/// - Removes query string and fragment
	/// - Removes trailing slash
	/// </summary>
	/// <param name="url">The URL to normalize</param>
	/// <param name="baseUrl">Optional base URL to convert relative URLs to absolute</param>
	/// <returns>Normalized URL string</returns>
	public static string Normalize(string url, string? baseUrl = null)
	{
		if (string.IsNullOrWhiteSpace(url))
		{
			return string.Empty;
		}

		Uri uri;

		// Convert to absolute URL if base URL is provided and URL is relative
		if (!string.IsNullOrWhiteSpace(baseUrl) && !Uri.IsWellFormedUriString(url, UriKind.Absolute))
		{
			// Ensure base URL has trailing slash if it's a directory (not a file)
			var normalizedBaseUrl = EnsureDirectoryTrailingSlash(baseUrl);
			
			if (!Uri.TryCreate(new Uri(normalizedBaseUrl), url, out uri!))
			{
				return url.ToLowerInvariant();
			}
		}
		else
		{
			if (!Uri.TryCreate(url, UriKind.Absolute, out uri!))
			{
				return url.ToLowerInvariant();
			}
		}

		// Build normalized URL: scheme + host + path (lowercase, no query, no fragment, no trailing slash)
		var normalized = $"{uri.Scheme}://{uri.Host}{uri.AbsolutePath}";
		normalized = normalized.ToLowerInvariant();

		// Remove trailing slash
		if (normalized.EndsWith('/'))
		{
			normalized = normalized.TrimEnd('/');
		}

		return normalized;
	}

	/// <summary>
	/// Ensures a base URL has a trailing slash if it represents a directory (not a file).
	/// If the last segment has a file extension (e.g., .php, .html), it's considered a file.
	/// Otherwise, it's considered a directory and a trailing slash is appended if not present.
	/// </summary>
	/// <param name="baseUrl">The base URL to normalize</param>
	/// <returns>Base URL with trailing slash if it's a directory</returns>
	private static string EnsureDirectoryTrailingSlash(string baseUrl)
	{
		if (string.IsNullOrWhiteSpace(baseUrl))
		{
			return baseUrl;
		}

		// If already has trailing slash, return as-is
		if (baseUrl.EndsWith('/'))
		{
			return baseUrl;
		}

		// Parse the URL to get the path
		if (!Uri.TryCreate(baseUrl, UriKind.Absolute, out var uri))
		{
			// If not a valid absolute URL, just append slash
			return baseUrl + "/";
		}

		var path = uri.AbsolutePath;
		
		// Get the last segment of the path
		var lastSlashIndex = path.LastIndexOf('/');
		var lastSegment = lastSlashIndex >= 0 ? path.Substring(lastSlashIndex + 1) : path;

		// Check if the last segment has a file extension (contains a dot)
		// Common web file extensions: .php, .html, .htm, .asp, .aspx, etc.
		var hasFileExtension = lastSegment.Contains('.');

		// If it's a file (has extension), return as-is
		// If it's a directory (no extension), append trailing slash
		if (hasFileExtension)
		{
			return baseUrl;
		}
		else
		{
			return baseUrl + "/";
		}
	}

	/// <summary>
	/// Validates whether a URL is from the Track Shack domain.
	/// </summary>
	/// <param name="url">The URL to validate</param>
	/// <returns>True if the URL is from trackshackresults.com, false otherwise</returns>
	public static bool IsValidTrackShackUrl(string url)
	{
		if (string.IsNullOrWhiteSpace(url))
		{
			return false;
		}

		if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
		{
			return false;
		}

		return uri.Host.Equals("www.trackshackresults.com", StringComparison.OrdinalIgnoreCase)
			|| uri.Host.Equals("trackshackresults.com", StringComparison.OrdinalIgnoreCase);
	}
}
