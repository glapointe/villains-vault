using ModelContextProtocol.Server;
using System.ComponentModel;
using System.Text.Json;
using Falchion.Villains.Vault.Api.Models.Mcp;
using Falchion.Villains.Vault.Api.Services;
using Falchion.Villains.Vault.Api.Utils;
using Microsoft.Extensions.Logging;
using static Falchion.Villains.Vault.Api.Services.McpCacheService;

namespace Falchion.Villains.Vault.Api.McpTools;

/// <summary>
/// MCP tools for runner-level analysis and comparisons.
/// Exposed to AI clients (Claude, VS Code, etc.) via the Model Context Protocol.
/// </summary>
[McpServerToolType]
public sealed class RunnerTools
{
	private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

	[McpServerTool, Description("Analyze a runner's split times segment by segment. Shows pace per segment, cumulative times, and whether the runner ran a negative split (second half faster than first = strong pacing) or positive split (first half faster = faded). Use search_runner_by_name or search_results first to find a result ID.")]
	public static async Task<string> GetRunnerSplitAnalysis(
		RaceDataService raceDataService,
		McpCacheService cache,
		ILogger<RunnerTools> logger,
		[Description("The race result ID to analyze")] long raceResultId)
	{
		try
		{
			return await cache.GetOrCreateAsync(
				CacheCategory.ResultDetail,
				["GetRunnerSplitAnalysis", raceResultId.ToString()],
				async () =>
				{
					var analysis = await raceDataService.GetRunnerSplitAnalysisAsync(raceResultId);
					if (analysis == null)
						return $"Race result with ID {raceResultId} not found.";

					if (!analysis.HasSplitData)
						return $"No split time data available for this race. The race may not have had timing mats at intermediate points.";

					return JsonSerializer.Serialize(new
					{
						analysis.RaceResultId,
						url = ToolArgSanitizer.ResultUrl(analysis.RaceResultId),
						overallPace = PaceHelpers.FormatPace(analysis.OverallPace),
						isNegativeSplit = analysis.IsNegativeSplit,
						splitStrategy = analysis.IsNegativeSplit switch
						{
							true => "Negative split \u2014 finished faster than they started (strong pacing)",
							false => "Positive split \u2014 started faster than they finished",
							null => "Unable to determine split strategy"
						},
						segments = analysis.Segments.Select(s => new
						{
							s.Label,
							cumulativeTime = PaceHelpers.FormatTime(s.CumulativeTime),
							segmentTime = PaceHelpers.FormatTime(s.SegmentTime),
							s.SegmentDistanceMiles,
							segmentPace = PaceHelpers.FormatPace(s.SegmentPace)
						})
					}, JsonOptions);
				});
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "MCP GetRunnerSplitAnalysis failed (resultId: {ResultId})", raceResultId);
			return $"Error analyzing splits: {ex.Message}";
		}
	}

	[McpServerTool, Description("Compare two runners head-to-head in the same race. Shows each runner's placement, times, pace, and a split-by-split comparison showing who was ahead at each timing point and by how much. Both result IDs must be from the same race.")]
	public static async Task<string> CompareRunners(
		RaceDataService raceDataService,
		McpCacheService cache,
		ILogger<RunnerTools> logger,
		[Description("First runner's race result ID")] long resultId1,
		[Description("Second runner's race result ID")] long resultId2)
	{
		try
		{
			// Normalize key order so (A,B) and (B,A) hit the same cache entry
			var (lo, hi) = resultId1 < resultId2 ? (resultId1, resultId2) : (resultId2, resultId1);

			return await cache.GetOrCreateAsync(
				CacheCategory.ResultDetail,
				["CompareRunners", lo.ToString(), hi.ToString()],
				async () =>
				{
					var comparison = await raceDataService.CompareRunnersAsync(resultId1, resultId2);
					if (comparison == null)
						return "Could not compare runners. Verify both result IDs exist and are from the same race.";

					return JsonSerializer.Serialize(new
					{
						comparison.RaceId,
						comparison.RaceName,
						raceUrl = ToolArgSanitizer.RaceUrl(comparison.RaceId),
						runner1 = FormatComparisonRunner(comparison.Runner1),
						runner2 = FormatComparisonRunner(comparison.Runner2),
						netTimeDifference = comparison.NetTimeDifference.HasValue
							? new
							{
								formatted = PaceHelpers.FormatTime(TimeSpan.FromSeconds(Math.Abs(comparison.NetTimeDifference.Value.TotalSeconds))),
								fasterRunner = comparison.NetTimeDifference.Value.TotalSeconds < 0
									? comparison.Runner1.Name
									: comparison.Runner2.Name
							}
							: null,
						splits = comparison.SplitComparisons.Select(s => new
						{
							s.Label,
							runner1Time = PaceHelpers.FormatTime(s.Runner1Time),
							runner2Time = PaceHelpers.FormatTime(s.Runner2Time),
							difference = s.Difference.HasValue
								? PaceHelpers.FormatTime(TimeSpan.FromSeconds(Math.Abs(s.Difference.Value.TotalSeconds)))
								: "",
							leader = s.Difference.HasValue
								? (s.Difference.Value.TotalSeconds < 0 ? comparison.Runner1.Name : comparison.Runner2.Name)
								: ""
						})
					}, JsonOptions);
				});
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "MCP CompareRunners failed (result1: {Id1}, result2: {Id2})", resultId1, resultId2);
			return $"Error comparing runners: {ex.Message}";
		}
	}

	[McpServerTool, Description("Get the top (fastest) runners from a specific hometown or region within a race. Use 'hometown' for exact city matches like 'Orlando, FL'. Use 'region' for all runners from a state (e.g., 'FL') or country (e.g., 'Brazil'). Provide either hometown or region, not both.")]
	public static async Task<string> GetHometownLeaderboard(
		RaceDataService raceDataService,
		McpCacheService cache,
		ILogger<RunnerTools> logger,
		[Description("The race ID")] int raceId,
		[Description("The exact hometown to search for (e.g., 'Orlando, FL'). Use this OR region, not both. Do NOT pass 'any' or 'all' — omit to skip.")] string? hometown = null,
		[Description("A state code or country name to find all runners from that region (e.g., 'FL', 'NH', 'Brazil'). Use this OR hometown, not both. Do NOT pass 'any' or 'all' — omit to skip.")] string? region = null,
		[Description("Max results to return (default 20, max 100)")] int limit = 20)
	{
		try
		{
			hometown = ToolArgSanitizer.Sanitize(hometown);
			region = ToolArgSanitizer.Sanitize(region);

			if (string.IsNullOrWhiteSpace(hometown) && string.IsNullOrWhiteSpace(region))
				return "Please provide either a 'hometown' (e.g., 'Orlando, FL') or a 'region' (e.g., 'FL', 'Brazil').";

			limit = Math.Clamp(limit, 1, 100);

			return await cache.GetOrCreateAsync(
				CacheCategory.HometownAggregate,
				["GetHometownLeaderboard", raceId.ToString(), hometown ?? "_", region ?? "_", limit.ToString()],
				async () =>
				{
					var race = await raceDataService.GetRaceByIdAsync(raceId);
					if (race == null)
						return $"Race with ID {raceId} not found.";

					var results = await raceDataService.GetHometownLeaderboardAsync(raceId, hometown, limit, region);

					if (results.Count == 0)
					{
						var searchLabel = !string.IsNullOrWhiteSpace(region) ? $"region '{region}'" : $"'{hometown}'";
						return $"No runners found from {searchLabel} in this race.";
					}

					return JsonSerializer.Serialize(new
					{
						raceId,
						hometown = hometown ?? $"All cities in {region}",
						region,
						totalRunners = results.Count,
						runners = results.Select((r, index) => new
						{
							hometownRank = index + 1,
							r.Id,
							r.BibNumber,
							r.Name,
							r.Age,
							gender = r.Gender.ToString(),
							r.OverallPlace,
							r.GenderPlace,
							netTime = PaceHelpers.FormatTime(r.NetTime),
							pace = PaceHelpers.FormatPace(r.OverallPace),
							r.Hometown,
							url = ToolArgSanitizer.ResultUrl(r.Id)
						})
					}, JsonOptions);
				});
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "MCP GetHometownLeaderboard failed (raceId: {RaceId}, hometown: {Hometown}, region: {Region})", raceId, hometown, region);
			return $"Error retrieving hometown leaderboard: {ex.Message}";
		}
	}

	[McpServerTool, Description("Get a runner's percentile ranking: how they placed relative to all finishers (overall), same-gender finishers, and same-age-division finishers. A 90th percentile means they finished faster than 90% of runners in that group. Higher percentile = better performance.")]
	public static async Task<string> GetRunnerPercentile(
		RaceDataService raceDataService,
		McpCacheService cache,
		ILogger<RunnerTools> logger,
		[Description("The race result ID")] long raceResultId)
	{
		try
		{
			return await cache.GetOrCreateAsync(
				CacheCategory.ResultDetail,
				["GetRunnerPercentile", raceResultId.ToString()],
				async () =>
				{
					var percentiles = await raceDataService.GetRunnerPercentilesAsync(raceResultId);
					if (percentiles == null)
						return $"Race result with ID {raceResultId} not found.";

					return JsonSerializer.Serialize(new
					{
						percentiles.RaceResultId,
						url = ToolArgSanitizer.ResultUrl(percentiles.RaceResultId),
						overall = new
						{
							percentile = percentiles.OverallPercentile,
							place = percentiles.OverallPlace,
							outOf = percentiles.TotalRunners,
							summary = percentiles.OverallPercentile.HasValue
								? $"Faster than {percentiles.OverallPercentile:F1}% of all finishers"
								: "N/A"
						},
						gender = new
						{
							percentile = percentiles.GenderPercentile,
							place = percentiles.GenderPlace,
							outOf = percentiles.GenderRunners,
							summary = percentiles.GenderPercentile.HasValue
								? $"Faster than {percentiles.GenderPercentile:F1}% of same-gender finishers"
								: "N/A"
						},
						division = new
						{
							percentile = percentiles.DivisionPercentile,
							place = percentiles.DivisionPlace,
							outOf = percentiles.DivisionRunners,
							summary = percentiles.DivisionPercentile.HasValue
								? $"Faster than {percentiles.DivisionPercentile:F1}% of age division"
								: "N/A"
						}
					}, JsonOptions);
				});
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "MCP GetRunnerPercentile failed (resultId: {ResultId})", raceResultId);
			return $"Error calculating percentiles: {ex.Message}";
		}
	}

	[McpServerTool, Description("Get all states and countries represented by runners, with counts broken down by runner type (standard runners, push rim, hand cycle, duo). Each region shows how many distinct cities are represented and total runner count. Scope to a single race (raceId), all races in an event (eventId), or omit both for all data. US state codes (like 'FL') are grouped under 'United States'.")]
	public static async Task<string> GetHometownRegions(
		RaceDataService raceDataService,
		McpCacheService cache,
		ILogger<RunnerTools> logger,
		[Description("Optional race ID to scope results to a single race")] int raceId = 0,
		[Description("Optional event ID to scope results to all races in an event (ignored if raceId is set)")] int eventId = 0)
	{
		try
		{
			int? raceIdParam = raceId > 0 ? raceId : null;
			int? eventIdParam = eventId > 0 ? eventId : null;

			return await cache.GetOrCreateAsync(
				CacheCategory.HometownAggregate,
				["GetHometownRegions", raceId.ToString(), eventId.ToString()],
				async () =>
				{
					if (raceIdParam.HasValue)
					{
						var race = await raceDataService.GetRaceByIdAsync(raceIdParam.Value);
						if (race == null)
							return $"Race with ID {raceId} not found.";
					}
					else if (eventIdParam.HasValue)
					{
						var evt = await raceDataService.GetEventByIdAsync(eventIdParam.Value);
						if (evt == null)
							return $"Event with ID {eventId} not found.";
					}

					var regions = await raceDataService.GetHometownRegionsAsync(raceIdParam, eventIdParam);

					if (regions.Count == 0)
						return "No hometown data available for the specified scope.";

					var usStates = regions.Where(r => r.IsUsState).ToList();
					var countries = regions.Where(r => !r.IsUsState).ToList();

					return JsonSerializer.Serialize(new
					{
						raceId = raceIdParam,
						eventId = eventIdParam,
						scope = raceIdParam.HasValue ? "race" : eventIdParam.HasValue ? "event" : "all",
						totalRunners = regions.Sum(r => r.RunnerCount),
						totalRegions = regions.Count,
						usStates = new
						{
							count = usStates.Count,
							totalRunners = usStates.Sum(r => r.RunnerCount),
							states = usStates.Select(r => new { r.Region, r.CityCount, r.RunnerCount, r.Runners, r.PushRim, r.HandCycle, r.Duo })
						},
						otherCountries = new
						{
							count = countries.Count,
							totalRunners = countries.Sum(r => r.RunnerCount),
							countries = countries.Select(r => new { r.Country, r.CityCount, r.RunnerCount, r.Runners, r.PushRim, r.HandCycle, r.Duo })
						}
					}, JsonOptions);
				});
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "MCP GetHometownRegions failed (raceId: {RaceId}, eventId: {EventId})", raceId, eventId);
			return $"Error retrieving hometown regions: {ex.Message}";
		}
	}

	[McpServerTool, Description("Get all cities within a state or country that have runners, with counts by runner type. Pass a US state code (e.g., 'FL') or country name (e.g., 'Brazil'). Use get_hometown_regions first to see which regions are available. Scope to a race, event, or all data.")]
	public static async Task<string> GetHometownCities(
		RaceDataService raceDataService,
		McpCacheService cache,
		ILogger<RunnerTools> logger,
		[Description("The region to list cities for - a 2-character US state code (e.g., 'FL', 'NY') or country name (e.g., 'Brazil', 'Canada')")] string region,
		[Description("Optional race ID to scope results to a single race")] int raceId = 0,
		[Description("Optional event ID to scope results to all races in an event (ignored if raceId is set)")] int eventId = 0)
	{
		try
		{
			int? raceIdParam = raceId > 0 ? raceId : null;
			int? eventIdParam = eventId > 0 ? eventId : null;

			return await cache.GetOrCreateAsync(
				CacheCategory.HometownAggregate,
				["GetHometownCities", region.ToLowerInvariant(), raceId.ToString(), eventId.ToString()],
				async () =>
				{
					if (raceIdParam.HasValue)
					{
						var race = await raceDataService.GetRaceByIdAsync(raceIdParam.Value);
						if (race == null)
							return $"Race with ID {raceId} not found.";
					}
					else if (eventIdParam.HasValue)
					{
						var evt = await raceDataService.GetEventByIdAsync(eventIdParam.Value);
						if (evt == null)
							return $"Event with ID {eventId} not found.";
					}

					var cities = await raceDataService.GetHometownCitiesAsync(region, raceIdParam, eventIdParam);

					if (cities.Count == 0)
						return $"No runners found from region '{region}' in the specified scope. Use get_hometown_regions to see available regions.";

					return JsonSerializer.Serialize(new
					{
						raceId = raceIdParam,
						eventId = eventIdParam,
						scope = raceIdParam.HasValue ? "race" : eventIdParam.HasValue ? "event" : "all",
						region,
						totalCities = cities.Count,
						totalRunners = cities.Sum(c => c.RunnerCount),
						cities = cities.Select(c => new { c.City, c.FullHometown, c.RunnerCount, c.Runners, c.PushRim, c.HandCycle, c.Duo })
					}, JsonOptions);
				});
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "MCP GetHometownCities failed (raceId: {RaceId}, eventId: {EventId}, region: {Region})", raceId, eventId, region);
			return $"Error retrieving hometown cities: {ex.Message}";
		}
	}

	private static object FormatComparisonRunner(ComparisonRunner r) => new
	{
		r.ResultId,
		r.Name,
		r.BibNumber,
		r.Age,
		gender = r.Gender.ToString(),
		r.OverallPlace,
		r.GenderPlace,
		r.DivisionPlace,
		netTime = PaceHelpers.FormatTime(r.NetTime),
		clockTime = PaceHelpers.FormatTime(r.ClockTime),
		pace = PaceHelpers.FormatPace(r.OverallPace),
		r.Hometown,
		url = ToolArgSanitizer.ResultUrl(r.ResultId)
	};
}
