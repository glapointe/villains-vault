using Microsoft.Extensions.Caching.Memory;

namespace Falchion.Villains.Vault.Api.Services;

/// <summary>
/// Caching layer for MCP tool responses.
/// Groups cache entries by category with different TTLs:
/// <list type="bullet">
///   <item><term>EventMetadata</term><description>1 hour — events, races, divisions, statistics, weather (rarely changes)</description></item>
///   <item><term>ResultDetail</term><description>15 minutes — individual result details, split analysis, percentiles</description></item>
///   <item><term>Search</term><description>5 minutes — search/query results with many parameter combinations</description></item>
///   <item><term>HometownAggregate</term><description>30 minutes — region/city aggregations</description></item>
/// </list>
/// </summary>
public sealed class McpCacheService
{
	private readonly IMemoryCache _cache;
	private readonly ILogger<McpCacheService> _logger;

	private const string Prefix = "mcp:";

	public McpCacheService(IMemoryCache cache, ILogger<McpCacheService> logger)
	{
		_cache = cache;
		_logger = logger;
	}

	/// <summary>
	/// Cache duration categories for MCP tool responses.
	/// </summary>
	public enum CacheCategory
	{
		/// <summary>Events, races, divisions, statistics, weather — 1 hour.</summary>
		EventMetadata,

		/// <summary>Individual result details, split analysis, comparisons, percentiles — 15 minutes.</summary>
		ResultDetail,

		/// <summary>Search and query results — 5 minutes.</summary>
		Search,

		/// <summary>Hometown region/city aggregations — 30 minutes.</summary>
		HometownAggregate
	}

	/// <summary>
	/// Gets or creates a cached MCP tool response.
	/// </summary>
	/// <param name="category">The cache duration category.</param>
	/// <param name="keyParts">Parts that uniquely identify this request (tool name + parameters).</param>
	/// <param name="factory">Async factory to produce the value on cache miss.</param>
	/// <returns>The cached or freshly computed result.</returns>
	public async Task<string> GetOrCreateAsync(
		CacheCategory category,
		string[] keyParts,
		Func<Task<string>> factory)
	{
		var cacheKey = BuildKey(keyParts);

		if (_cache.TryGetValue(cacheKey, out string? cached) && cached != null)
		{
			_logger.LogDebug("MCP cache hit: {CacheKey}", cacheKey);
			return cached;
		}

		_logger.LogDebug("MCP cache miss: {CacheKey}", cacheKey);
		var result = await factory();

		// Only cache successful responses (not error messages)
		if (!IsErrorResponse(result))
		{
			var options = new MemoryCacheEntryOptions()
				.SetAbsoluteExpiration(GetDuration(category))
				.SetSize(result.Length); // Track approximate memory usage

			_cache.Set(cacheKey, result, options);
		}

		return result;
	}

	private static string BuildKey(string[] parts) =>
		Prefix + string.Join(":", parts.Select(p => p?.ToString()?.ToLowerInvariant() ?? "_"));

	private static TimeSpan GetDuration(CacheCategory category) => category switch
	{
		CacheCategory.EventMetadata => TimeSpan.FromHours(1),
		CacheCategory.ResultDetail => TimeSpan.FromMinutes(15),
		CacheCategory.Search => TimeSpan.FromMinutes(5),
		CacheCategory.HometownAggregate => TimeSpan.FromMinutes(30),
		_ => TimeSpan.FromMinutes(5)
	};

	/// <summary>
	/// Heuristic to avoid caching error/not-found responses.
	/// </summary>
	private static bool IsErrorResponse(string response) =>
		response.StartsWith("Error ", StringComparison.Ordinal) ||
		response.StartsWith("No ", StringComparison.Ordinal) ||
		response.StartsWith("Race with ID", StringComparison.Ordinal) ||
		response.StartsWith("Invalid ", StringComparison.Ordinal) ||
		response.StartsWith("Please ", StringComparison.Ordinal) ||
		response.StartsWith("Could not ", StringComparison.Ordinal) ||
		response.Contains("not found", StringComparison.OrdinalIgnoreCase);
}
