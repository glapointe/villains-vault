using Falchion.Villains.Vault.Api.DTOs;
using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Models;
using Falchion.Villains.Vault.Api.Services;
using Microsoft.Extensions.Logging;
using ModelContextProtocol.Server;
using System.ComponentModel;
using System.Text.Json;
using static Falchion.Villains.Vault.Api.Services.McpCacheService;

namespace Falchion.Villains.Vault.Api.McpTools;

/// <summary>
/// MCP tools for querying events and races.
/// Exposed to AI clients (Claude, VS Code, etc.) via the Model Context Protocol.
/// </summary>
[McpServerToolType]
public sealed class EventTools
{
	private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

	[McpServerTool, Description("List all runDisney events and their races. Each event (e.g., 'Walt Disney World Marathon Weekend 2024') contains multiple races (5K, 10K, Half Marathon, Marathon). Returns event IDs, names, and each race's ID, name, date, and distance. Use the year parameter to filter. IMPORTANT: Call get_available_years first to know which years have data before calling this.")]
	public static async Task<string> ListEvents(
		RaceDataService raceDataService,
		McpCacheService cache,
		ILogger<EventTools> logger,
		[Description("Optional year to filter events (e.g. 2024). Omit or pass 0 for all years.")] int year = 0,
        [Description("Optional event series filter: DisneylandHalloween, DisneylandHalfMarathon, DisneyWorldWineAndDine, DisneyWorldMarathon, DisneyWorldPrincess, DisneyWorldSpringtime")] string? eventSeries = null)
	{
		try
		{
            eventSeries = ToolArgSanitizer.Sanitize(eventSeries);
            EventSeries? parsedEventSeries = null;
            if (!string.IsNullOrEmpty(eventSeries))
            {
                parsedEventSeries = Enum.TryParse<EventSeries>(eventSeries, true, out var eventSeriesResult) ? eventSeriesResult : null;
                if (parsedEventSeries == null)
                    return $"Invalid event series '{eventSeries}'. Valid values: DisneylandHalloween, DisneylandHalfMarathon, DisneyWorldWineAndDine, DisneyWorldMarathon, DisneyWorldPrincess, DisneyWorldSpringtime.";
            }

			return await cache.GetOrCreateAsync(
				CacheCategory.EventMetadata,
				["ListEvents", year.ToString(), eventSeries ?? "_"],
				async () =>
				{
					var events = await raceDataService.GetEventsAsync(year > 0 ? year : null, parsedEventSeries);

					if (events.Count == 0)
						return year > 0
							? $"No events found for year {year}."
							: "No events found in the database.";

					return JsonSerializer.Serialize(new
					{
						totalEvents = events.Count,
						events = events.Select(e => new
						{
							e.Id,
							e.Name,
							EventSeries = e.EventSeries.ToString(),
							races = e.Races.Select(r => new
							{
								r.Id,
								r.Name,
								EventSeries = e.EventSeries.ToString(),
								raceDate = r.RaceDate.ToString("yyyy-MM-dd"),
								distance = r.Distance.ToString(),
								url = ToolArgSanitizer.RaceUrl(r.Id)
							})
						})
					}, JsonOptions);
				});
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "MCP ListEvents failed (year: {Year})", year);
			return $"Error retrieving events: {ex.Message}";
		}
	}

	[McpServerTool, Description("Get which years have runDisney data in the database. ALWAYS call this FIRST when the user asks about 'latest', 'most recent', or 'newest' results. Call list_events with a specific year to see events for that year. Never call this tool more than once for a given parameter set as the results will always be the same. Never assume a year \u2014 always check.")]
	public static async Task<string> GetAvailableYears(
		RaceDataService raceDataService,
		McpCacheService cache,
		[Description("Optional event series to filter years: DisneylandHalloween, DisneylandHalfMarathon, DisneyWorldWineAndDine, DisneyWorldMarathon, DisneyWorldPrincess, DisneyWorldSpringtime")] string? eventSeries = null)
	{
		eventSeries = ToolArgSanitizer.Sanitize(eventSeries);
		EventSeries? parsedEventSeries = null;
		if (!string.IsNullOrEmpty(eventSeries)) 
		{
			parsedEventSeries = Enum.TryParse<EventSeries>(eventSeries, true, out var eventSeriesResult) ? eventSeriesResult : null;
			if (parsedEventSeries == null)
				return $"Invalid event series '{eventSeries}'. Valid values: DisneylandHalloween, DisneylandHalfMarathon, DisneyWorldWineAndDine, DisneyWorldMarathon, DisneyWorldPrincess, DisneyWorldSpringtime.";
        }

		return await cache.GetOrCreateAsync(
			CacheCategory.EventMetadata,
			["GetAvailableYears", eventSeries ?? "_"],
			async () =>
			{
				var years = await raceDataService.GetAvailableYearsAsync(parsedEventSeries);

				if (years.Count == 0)
					return "No event data available yet.";

				return JsonSerializer.Serialize(new { years }, JsonOptions);
			});
	}

	[McpServerTool, Description("Get details about a specific race: total runners (male/female), DNF (Did Not Finish) count, race date, distance, and parent event name. Use list_events first to find race IDs.")]
	public static async Task<string> GetRaceDetails(
		RaceDataService raceDataService,
		McpCacheService cache,
		[Description("The race ID")] int raceId)
	{
		return await cache.GetOrCreateAsync(
			CacheCategory.EventMetadata,
			["GetRaceDetails", raceId.ToString()],
			async () =>
			{
				var race = await raceDataService.GetRaceByIdAsync(raceId);
				if (race == null)
					return $"Race with ID {raceId} not found.";

				var stats = RaceStats.FromJson(race.StatisticsJson) ?? await raceDataService.BuildRaceStatsAsync(raceId);

				return JsonSerializer.Serialize(new
				{
					race.Id,
					race.Name,
					EventSeries = race.EventSeries.ToString(),
					raceDate = race.RaceDate.ToString("yyyy-MM-dd"),
					distance = race.Distance.ToString(),
					race.Notes,
					url = ToolArgSanitizer.RaceUrl(race.Id),
					stats,
					dnfCount = stats.DNFCount,
					eventName = race.Event?.Name
				}, JsonOptions);
			});
	}

	[McpServerTool, Description("Get all age group divisions for a specific race. Returns division IDs and labels (e.g., 'MEN -- 25 THROUGH 29', 'FEMALE -- 50 THROUGH 54'). Useful for filtering race results by division.")]
	public static async Task<string> GetDivisions(
		RaceDataService raceDataService,
		McpCacheService cache,
		[Description("The race ID")] int raceId)
	{
		return await cache.GetOrCreateAsync(
			CacheCategory.EventMetadata,
			["GetDivisions", raceId.ToString()],
			async () =>
			{
				var race = await raceDataService.GetRaceByIdAsync(raceId);
				if (race == null)
					return $"Race with ID {raceId} not found.";

				var divisions = await raceDataService.GetDivisionsAsync(raceId);

				return JsonSerializer.Serialize(new
				{
					raceId,
					totalDivisions = divisions.Count,
					divisions = divisions.Select(d => new { d.Id, d.Name })
				}, JsonOptions);
			});
	}

	[McpServerTool, Description("Get deep race statistics: runner type breakdowns (standard, push rim, hand cycle, duo), male/female age group averages and medians, per-segment split time stats, start line congestion (launch time/factor), and finish line congestion (landing time/factor). Returns pre-calculated data.")]
	public static async Task<string> GetRaceStatistics(
		RaceDataService raceDataService,
		McpCacheService cache,
		[Description("The race ID")] int raceId)
	{
		return await cache.GetOrCreateAsync(
			CacheCategory.EventMetadata,
			["GetRaceStatistics", raceId.ToString()],
			async () =>
			{
				var race = await raceDataService.GetRaceByIdAsync(raceId);
				if (race == null)
					return $"Race with ID {raceId} not found.";

				// Return cached stats if available
				if (!string.IsNullOrEmpty(race.StatisticsJson))
					return race.StatisticsJson;

				var stats = await raceDataService.BuildRaceStatsAsync(raceId);
				return stats.ToJson();
			});
	}

    [McpServerTool, Description("Get hourly weather conditions on race day: temperature, humidity, wind speed, and precipitation from Open-Meteo historical data. Useful for explaining why a race was unusually fast or slow.")]
	public static async Task<string> GetRaceWeather(
		RaceDataService raceDataService,
		McpCacheService cache,
		ILogger<EventTools> logger,
		[Description("The race ID")] int raceId)
	{
		try
		{
			return await cache.GetOrCreateAsync(
				CacheCategory.EventMetadata,
				["GetRaceWeather", raceId.ToString()],
				async () =>
				{
					var race = await raceDataService.GetRaceByIdAsync(raceId);
					if (race == null)
						return $"Race with ID {raceId} not found.";

					var weatherJson = await raceDataService.GetRaceWeatherJsonAsync(raceId);
					if (string.IsNullOrEmpty(weatherJson))
						return $"No weather data available for this race. Weather data may not have been fetched yet.";

					return JsonSerializer.Serialize(new
					{
						raceId,
						raceName = race.Name,
						raceDate = race.RaceDate.ToString("yyyy-MM-dd"),
						weather = JsonSerializer.Deserialize<JsonElement>(weatherJson)
					}, JsonOptions);
				});
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "MCP GetRaceWeather failed (raceId: {RaceId})", raceId);
			return $"Error retrieving weather data: {ex.Message}";
		}
	}

	[McpServerTool, Description("Get summary race statistics for ALL races across multiple events in a single call. Returns runner counts (total, male, female), runner type breakdowns (standard, push rim, hand cycle, duo), and DNF counts for each race. Use this instead of calling get_race_statistics repeatedly when you need to compare stats across events or track trends over time. Filter by year range, event, or race distance. IMPORTANT: Call get_available_years first to find valid year ranges.")]
	public static async Task<string> GetBulkRaceStatistics(
		RaceDataService raceDataService,
		McpCacheService cache,
		ILogger<EventTools> logger,
		[Description("Start year (inclusive). Omit or 0 for no lower bound.")] int startYear = 0,
		[Description("End year (inclusive). Omit or 0 for no upper bound.")] int endYear = 0,
		[Description("Optional event ID to limit results to a single event's races.")] int eventId = 0,
        [Description("Optional event series filter: DisneylandHalloween, DisneylandHalfMarathon, DisneyWorldWineAndDine, DisneyWorldMarathon, DisneyWorldPrincess, DisneyWorldSpringtime")] string? eventSeries = null,
        [Description("Optional race distance filter: FiveK, TenK, TenMile, HalfMarathon, FullMarathon. Omit for all distances.")] string? distance = null)
	{
		try
		{
			var sanitizedDistance = ToolArgSanitizer.Sanitize(distance);
			RaceDistance? parsedDistance = null;
			if (!string.IsNullOrEmpty(sanitizedDistance))
			{
				parsedDistance = RaceDistanceExtensions.ParseDistance(sanitizedDistance);
				if (parsedDistance == null)
					return $"Invalid distance '{distance}'. Valid values: FiveK, TenK, TenMile, HalfMarathon, FullMarathon.";
			}
            eventSeries = ToolArgSanitizer.Sanitize(eventSeries);
            EventSeries? parsedEventSeries = null;
            if (!string.IsNullOrEmpty(eventSeries))
            {
                parsedEventSeries = Enum.TryParse<EventSeries>(eventSeries, true, out var eventSeriesResult) ? eventSeriesResult : null;
                if (parsedEventSeries == null)
                    return $"Invalid event series '{eventSeries}'. Valid values: DisneylandHalloween, DisneylandHalfMarathon, DisneyWorldWineAndDine, DisneyWorldMarathon, DisneyWorldPrincess, DisneyWorldSpringtime.";
            }

			return await cache.GetOrCreateAsync(
				CacheCategory.EventMetadata,
				["GetBulkRaceStatistics", startYear.ToString(), endYear.ToString(), eventId.ToString(), eventSeries ?? "_", sanitizedDistance ?? "_"],
				async () =>
				{
					var results = await raceDataService.GetBulkRaceStatsAsync(
						startYear > 0 ? startYear : null,
						endYear > 0 ? endYear : null,
						eventId > 0 ? eventId : null,
						parsedDistance,
						parsedEventSeries);

					if (results.Count == 0)
						return "No races found matching the specified filters.";

					return JsonSerializer.Serialize(new
					{
						totalRaces = results.Count,
						races = results.Select(r => new
						{
							r.EventId,
							r.EventName,
							r.EventSeries,
							r.RaceId,
							r.RaceName,
							raceDate = r.RaceDate.ToString("yyyy-MM-dd"),
							distance = r.Distance.ToString(),
							distanceDisplay = r.Distance.ToDisplayName(),
							r.TotalRunners,
							r.MaleRunners,
							r.FemaleRunners,
							r.RunnerTypeRunner,
							r.RunnerTypePushRim,
							r.RunnerTypeHandCycle,
							r.RunnerTypeDuo,
							r.DNFCount,
							r.RunnersOver16minPace,
							url = ToolArgSanitizer.RaceUrl(r.RaceId)
						})
					}, JsonOptions);
				});
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "MCP GetBulkRaceStatistics failed");
			return $"Error retrieving bulk race statistics: {ex.Message}";
		}
	}
}
