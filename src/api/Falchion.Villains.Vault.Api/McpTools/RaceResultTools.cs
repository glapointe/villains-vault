using ModelContextProtocol.Server;
using System.ComponentModel;
using System.Text.Json;
using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Services;
using Falchion.Villains.Vault.Api.Utils;
using Microsoft.Extensions.Logging;
using static Falchion.Villains.Vault.Api.Services.McpCacheService;

namespace Falchion.Villains.Vault.Api.McpTools;

/// <summary>
/// MCP tools for querying race results.
/// Exposed to AI clients (Claude, VS Code, etc.) via the Model Context Protocol.
/// </summary>
[McpServerToolType]
public sealed class RaceResultTools
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    [McpServerTool, Description("Search for race results within a specific race by runner name, bib number, or hometown. Returns matching runners with placement, times, pace, kills (passes), and assassins (passers). Optionally filter by region (state code like 'FL' or country name like 'Brazil'). For deeper detail (breakdowns, runner type, start time), call get_result_details(resultId). For searching across ALL races by name, use search_runner_by_name instead.")]
    public static async Task<string> SearchResults(
        RaceDataService raceDataService,
        McpCacheService cache,
        [Description("The race ID to search within")] int raceId,
        [Description("Search term - matches against runner name, bib number, or hometown")] string searchTerm,
        [Description("Max results to return (default 10, max 50)")] int limit = 10,
        [Description("Optional region filter - a US state code (e.g., 'FL') or country name (e.g., 'Brazil'). Do NOT pass values like 'any' or 'all' — omit this parameter entirely to search all regions.")] string? region = null)
    {
        region = ToolArgSanitizer.Sanitize(region);
        limit = Math.Clamp(limit, 1, 50);

        return await cache.GetOrCreateAsync(
            CacheCategory.Search,
            ["SearchResults", raceId.ToString(), searchTerm.ToLowerInvariant(), limit.ToString(), region ?? "_"],
            async () =>
            {
                var race = await raceDataService.GetRaceByIdAsync(raceId);
                if (race == null)
                    return $"Race with ID {raceId} not found.";

                var (results, totalCount) = await raceDataService.SearchResultsAsync(raceId, searchTerm, pageSize: limit, region: region);

                if (totalCount == 0)
                {
                    var regionNote = !string.IsNullOrWhiteSpace(region) ? $" in region '{region}'" : "";
                    return $"No results found matching '{searchTerm}'{regionNote} in race {raceId}.";
                }

                return JsonSerializer.Serialize(new
                {
                    totalMatches = totalCount,
                    showing = results.Count,
                    region,
                    results = results.Select(FormatResult)
                }, JsonOptions);
            });
    }

    [McpServerTool, Description("Get FULL details for a single race result. This is the follow-up tool after search_runner_by_name or search_results. Returns everything: placements (overall, gender, division), net time, clock time, start time, pace, kills (passes = runners this person overtook), assassins (passers = runners who overtook this person), runner type, and breakdown data showing kills/assassins by division, gender, hometown, and region. Always call this after finding a result ID to give the user complete information.")]
    public static async Task<string> GetResultDetails(
        RaceDataService raceDataService,
        McpCacheService cache,
        [Description("The race result ID")] long raceResultId)
    {
        return await cache.GetOrCreateAsync(
            CacheCategory.ResultDetail,
            ["GetResultDetails", raceResultId.ToString()],
            async () =>
            {
                var dto = await raceDataService.GetRaceResultDetailedAsync(raceResultId);
                if (dto == null)
                    return $"Race result with ID {raceResultId} not found.";

                return JsonSerializer.Serialize(new
                {
                    dto.Id,
                    dto.BibNumber,
                    dto.Name,
                    dto.Age,
                    gender = dto.Gender.ToString(),
                    runnerType = dto.RunnerType.ToString(),
                    dto.OverallPlace,
                    dto.GenderPlace,
                    dto.DivisionPlace,
                    netTime = PaceHelpers.FormatTime(dto.NetTime),
                    clockTime = PaceHelpers.FormatTime(dto.ClockTime),
                    startTime = PaceHelpers.FormatTime(dto.StartTime),
                    pace = PaceHelpers.FormatPace(dto.OverallPace),
                    dto.Hometown,
                    stats = new
                    {
                        raceRunners = dto.RaceRunners,
                        divisionRunners = dto.DivisionRunners,
                    },
                    dto.Passes,
                    dto.Passers,
                    dto.ResultData,
                    url = ToolArgSanitizer.ResultUrl(dto.Id),
                    raceUrl = ToolArgSanitizer.RaceUrl(dto.RaceId)
                }, JsonOptions);
            });
    }

    [McpServerTool, Description("Get the last starter (known as the 'balloon lady' or course sweeper) for a race. This is the runner with the latest start time who maintains the 16 min/mile pace limit. Anyone behind them may be swept off the course.")]
    public static async Task<string> GetLastStarter(
        RaceDataService raceDataService,
        McpCacheService cache,
        [Description("The race ID")] int raceId)
    {
        return await cache.GetOrCreateAsync(
            CacheCategory.ResultDetail,
            ["GetLastStarter", raceId.ToString()],
            async () =>
            {
                var race = await raceDataService.GetRaceByIdAsync(raceId);
                if (race == null)
                    return $"Race with ID {raceId} not found.";

                var dto = await raceDataService.GetLastStarterAsync(raceId);
                if (dto == null)
                    return $"No last starter found for race {raceId}. The race may have no results.";

                return JsonSerializer.Serialize(new
                {
                    description = "The balloon lady / course sweeper \u2014 last person allowed on the course",
                    result = FormatResult(dto)
                }, JsonOptions);
            });
    }

    [McpServerTool, Description("Find runners who started or finished closest in time to a specific runner. Returns the nearest starters (similar start time) and nearest finishers (similar finish time). Useful for finding race-day neighbors or running buddies.")]
    public static async Task<string> GetClosestResults(
        RaceDataService raceDataService,
        McpCacheService cache,
        [Description("The race result ID to find neighbors for")] long raceResultId,
        [Description("Number of closest runners to return (default 10, max 20)")] int count = 10)
    {
        count = Math.Clamp(count, 1, 20);

        return await cache.GetOrCreateAsync(
            CacheCategory.Search,
            ["GetClosestResults", raceResultId.ToString(), count.ToString()],
            async () =>
            {
                var (target, starters, finishers) = await raceDataService.GetClosestResultsAsync(raceResultId, count);

                if (target == null)
                    return $"Race result with ID {raceResultId} not found.";

                return JsonSerializer.Serialize(new
                {
                    targetRunner = new { target.Name, target.BibNumber, netTime = PaceHelpers.FormatTime(target.NetTime), startTime = PaceHelpers.FormatTime(target.StartTime) },
                    closestStarters = starters.Select(r => new
                    {
                        r.Name,
                        r.BibNumber,
                        startTime = PaceHelpers.FormatTime(r.StartTime),
                        timeDifference = target.StartTime.HasValue && r.StartTime.HasValue
                            ? PaceHelpers.FormatTime(TimeSpan.FromSeconds(Math.Abs((r.StartTime.Value - target.StartTime.Value).TotalSeconds)))
                            : ""
                    }),
                    closestFinishers = finishers.Select(r => new
                    {
                        r.Name,
                        r.BibNumber,
                        netTime = PaceHelpers.FormatTime(r.NetTime),
                        timeDifference = target.NetTime.HasValue && r.NetTime.HasValue
                            ? PaceHelpers.FormatTime(TimeSpan.FromSeconds(Math.Abs((r.NetTime.Value - target.NetTime.Value).TotalSeconds)))
                            : ""
                    })
                }, JsonOptions);
            });
    }

    [McpServerTool, Description("Find all race results for a specific runner across different events and years. Matches by name, age (adjusted for year differences), and hometown. Pass a result ID from any race to find their other appearances. Use search_runner_by_name first to get a result ID.")]
    public static async Task<string> FindRunnerAcrossRaces(
        RaceDataService raceDataService,
        McpCacheService cache,
        [Description("A race result ID for this runner from any race")] long raceResultId)
    {
        return await cache.GetOrCreateAsync(
            CacheCategory.Search,
            ["FindRunnerAcrossRaces", raceResultId.ToString()],
            async () =>
            {
                var matched = await raceDataService.FindRunnerAcrossEventsAsync(raceResultId);

                if (matched.Count == 0)
                    return $"No other race results found for the runner in result {raceResultId}. They may have only participated in one race.";

                return JsonSerializer.Serialize(new
                {
                    totalMatches = matched.Count,
                    results = matched.Select(m => new
                    {
                        m.EventName,
                        m.EventSeries,
                        m.RaceName,
                        raceDate = m.RaceDate.ToString("yyyy-MM-dd"),
                        distance = m.Distance.ToString(),
                        m.ResultId,
                        m.OverallPlace,
                        netTime = PaceHelpers.FormatTime(m.NetTime),
                        pace = PaceHelpers.FormatPace(m.OverallPace),
                        url = ToolArgSanitizer.ResultUrl(m.ResultId)
                    })
                }, JsonOptions);
            });
    }

    [McpServerTool, Description("Search for a runner by name across ALL races in the database. This is the best first tool to use when the user asks about a specific runner. Returns SUMMARY data only: event name, race name, date, distance, placement, net time, pace, hometown, and result ID. Does NOT include kills, assassins, gender/division placement, clock time, or breakdown data. After finding the runner, ALWAYS call get_result_details(resultId) to get the full stats.")]
    public static async Task<string> SearchRunnerByName(
        RaceDataService raceDataService,
        McpCacheService cache,
        ILogger<RaceResultTools> logger,
        [Description("The runner's name to search for (supports partial match, e.g., 'Reynolds' or 'Matthew Reynolds')")] string name,
        [Description("Optional race ID to limit search to a single race")] int raceId = 0,
        [Description("Optional event ID to limit search to all races in an event (ignored if raceId is set)")] int eventId = 0,
        [Description("Optional event series filter: DisneylandHalloween, DisneylandHalfMarathon, DisneyWorldWineAndDine, DisneyWorldMarathon, DisneyWorldPrincess, DisneyWorldSpringtime")] string? eventSeries = null,
        [Description("Max results to return (default 20, max 50)")] int limit = 20)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(name) || name.Trim().Length < 2)
                return "Please provide a name with at least 2 characters.";

            limit = Math.Clamp(limit, 1, 50);
            eventSeries = ToolArgSanitizer.Sanitize(eventSeries);
            EventSeries? parsedEventSeries = null;
            if (!string.IsNullOrEmpty(eventSeries))
            {
                parsedEventSeries = Enum.TryParse<EventSeries>(eventSeries, true, out var eventSeriesResult) ? eventSeriesResult : null;
                if (parsedEventSeries == null)
                    return $"Invalid event series '{eventSeries}'. Valid values: DisneylandHalloween, DisneylandHalfMarathon, DisneyWorldWineAndDine, DisneyWorldMarathon, DisneyWorldPrincess, DisneyWorldSpringtime.";
            }

            return await cache.GetOrCreateAsync(
                CacheCategory.Search,
                ["SearchRunnerByName", name.ToLowerInvariant(), raceId.ToString(), eventId.ToString(), eventSeries ?? "_", limit.ToString()],
                async () =>
                {
                    int? raceIdParam = raceId > 0 ? raceId : null;
                    int? eventIdParam = eventId > 0 ? eventId : null;

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

                    var matched = await raceDataService.SearchRunnerByNameAsync(name, raceIdParam, eventIdParam, parsedEventSeries, limit);

                    if (matched.Count == 0)
                    {
                        var scope = raceIdParam.HasValue ? $" in race {raceId}" : eventIdParam.HasValue ? $" in event {eventId}" : " across all races";
                        return $"No runners found matching '{name}'{scope}.";
                    }

                    return JsonSerializer.Serialize(new
                    {
                        searchName = name,
                        scope = raceIdParam.HasValue ? "race" : eventIdParam.HasValue ? "event" : "all",
                        totalMatches = matched.Count,
                        hint = "These are summary results. Call get_result_details(resultId) for full stats including kills, assassins, gender/division placement, and breakdown data.",
                        results = matched.Select(m => new
                        {
                            m.EventName,
                            m.EventSeries,
                            m.RaceName,
                            raceDate = m.RaceDate.ToString("yyyy-MM-dd"),
                            distance = m.Distance.ToString(),
                            m.ResultId,
                            m.OverallPlace,
                            netTime = PaceHelpers.FormatTime(m.NetTime),
                            pace = PaceHelpers.FormatPace(m.OverallPace),
                            m.Hometown,
                            url = ToolArgSanitizer.ResultUrl(m.ResultId)
                        })
                    }, JsonOptions);
                });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "MCP SearchRunnerByName failed (name: {Name})", name);
            return $"Error searching for runner: {ex.Message}";
        }
    }

    [McpServerTool, Description("Query and sort race results with flexible filtering and sorting. Sort by ANY field: overall placement (default), kills (passes), assassins (passers), start time, age, pace, net time, clock time, name, bib number, gender/division placement, and more. Filter by gender, division, runner type, region, or search term. Use this for 'top finishers', 'most kills', 'who started last', 'oldest runners', 'sorted by pace', etc. Sort direction defaults to the natural order for the field (ascending for placement/time, descending for kills).")]
    public static async Task<string> QueryRaceResults(
        RaceDataService raceDataService,
        McpCacheService cache,
        ILogger<RaceResultTools> logger,
        [Description("The race ID")] int raceId,
        [Description("Field to sort by. Values: OverallPlace, GenderPlace, DivisionPlace, Age, NetTime, ClockTime, StartTime, OverallPace, Passes, Passers, Name, BibNumber, Hometown. Default: OverallPlace.")] string sortBy = "OverallPlace",
        [Description("Sort direction: 'asc' or 'desc'. Default depends on field — descending for Passes/Passers/Age, ascending for everything else.")] string? sortDirection = null,
        [Description("Max results to return (default 20, max 50)")] int limit = 20,
        [Description("Optional gender filter: exactly 'Male' or 'Female'. Do NOT pass 'any' or 'all' — omit this parameter entirely for all genders.")] string? gender = null,
        [Description("Optional division ID filter. Use get_divisions to find IDs. Omit for all divisions.")] int? divisionId = null,
        [Description("Optional runner type filter: 'Runner', 'PushRim', 'HandCycle', or 'Duo'. Omit for all types.")] string? runnerType = null,
        [Description("Optional search term to filter by name, bib number, or hometown before sorting.")] string? search = null,
        [Description("Optional region filter - a US state code (e.g., 'FL', 'NH') or country name (e.g., 'Brazil'). Do NOT pass 'any' or 'all' — omit this parameter entirely for all regions.")] string? region = null)
    {
        try
        {
            gender = ToolArgSanitizer.Sanitize(gender);
            region = ToolArgSanitizer.Sanitize(region);
            search = ToolArgSanitizer.Sanitize(search);
            runnerType = ToolArgSanitizer.Sanitize(runnerType);
            limit = Math.Clamp(limit, 1, 50);

            // Parse sortBy early so we can include it in the cache key
            if (!Enum.TryParse<RaceResultColumn>(sortBy, true, out var sortColumn))
                return $"Invalid sortBy value '{sortBy}'. Valid values: OverallPlace, GenderPlace, DivisionPlace, Age, NetTime, ClockTime, StartTime, OverallPace, Passes, Passers, Name, BibNumber, Hometown.";

            // Default sort direction: descending for Passes/Passers/Age, ascending for everything else
            var resolvedDirection = sortDirection?.Trim().ToLowerInvariant() switch
            {
                "asc" => "asc",
                "desc" => "desc",
                _ => sortColumn is RaceResultColumn.Passes or RaceResultColumn.Passers or RaceResultColumn.Age
                    ? "desc"
                    : "asc"
            };

            return await cache.GetOrCreateAsync(
                CacheCategory.Search,
                ["QueryRaceResults", raceId.ToString(), sortBy.ToLowerInvariant(), resolvedDirection,
                 limit.ToString(), gender ?? "_", divisionId?.ToString() ?? "_",
                 runnerType ?? "_", search ?? "_", region ?? "_"],
                async () =>
                {
                    var race = await raceDataService.GetRaceByIdAsync(raceId);
                    if (race == null)
                        return $"Race with ID {raceId} not found.";

                    Gender? genderFilter = gender?.ToLowerInvariant() switch
                    {
                        "male" => Gender.Male,
                        "female" => Gender.Female,
                        _ => null
                    };

                    RunnerType? runnerTypeFilter = runnerType?.Replace(" ", "") switch
                    {
                        var rt when string.Equals(rt, "Runner", StringComparison.OrdinalIgnoreCase) => Enums.RunnerType.Runner,
                        var rt when string.Equals(rt, "PushRim", StringComparison.OrdinalIgnoreCase) => Enums.RunnerType.PushRim,
                        var rt when string.Equals(rt, "HandCycle", StringComparison.OrdinalIgnoreCase) => Enums.RunnerType.HandCycle,
                        var rt when string.Equals(rt, "Duo", StringComparison.OrdinalIgnoreCase) => Enums.RunnerType.Duo,
                        _ => null
                    };

                    // Use the paged results service which supports search + region
                    if (!string.IsNullOrWhiteSpace(search) || !string.IsNullOrWhiteSpace(region))
                    {
                        var pagedResults = await raceDataService.GetPagedResultsAsync(
                            raceId, divisionId, genderFilter, search, sortColumn, resolvedDirection, page: 1, pageSize: limit, region: region);

                        if (pagedResults.TotalCount == 0)
                            return "No results found matching the specified filters.";

                        return FormatQueryResponse(raceId, race.Name, sortColumn, resolvedDirection, genderFilter, divisionId, runnerTypeFilter, search, region, pagedResults.TotalCount, pagedResults.Items);
                    }

                    // Use filtered results (no search/region needed)
                    var results = await raceDataService.GetFilteredResultsAsync(
                        raceId, divisionId, genderFilter, runnerTypeFilter, sortColumn, resolvedDirection, page: 1, pageSize: limit);

                    if (results.Count == 0)
                        return "No results found matching the specified filters.";

                    return FormatQueryResponse(raceId, race.Name, sortColumn, resolvedDirection, genderFilter, divisionId, runnerTypeFilter, search, region, results.Count, results);
                });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "MCP QueryRaceResults failed (raceId: {RaceId})", raceId);
            return $"Error querying race results: {ex.Message}";
        }
    }

    /// <summary>
    /// Formats the query results response with context about the applied filters and sort.
    /// </summary>
    private static string FormatQueryResponse(
        int raceId, string raceName,
        RaceResultColumn sortColumn, string sortDirection,
        Gender? gender, int? divisionId, RunnerType? runnerType,
        string? search, string? region,
        int totalMatches, IEnumerable<DTOs.RaceResultDto> results)
    {
        var filterDescription = new List<string>();
        if (gender.HasValue) filterDescription.Add($"gender: {gender}");
        if (divisionId.HasValue) filterDescription.Add($"division: {divisionId}");
        if (runnerType.HasValue) filterDescription.Add($"runnerType: {runnerType}");
        if (!string.IsNullOrWhiteSpace(search)) filterDescription.Add($"search: {search}");
        if (!string.IsNullOrWhiteSpace(region)) filterDescription.Add($"region: {region}");

        return JsonSerializer.Serialize(new
        {
            raceId,
            raceName,
            sortedBy = sortColumn.ToString(),
            sortDirection,
            filters = filterDescription.Count > 0 ? string.Join(", ", filterDescription) : "none",
            totalMatches,
            showing = results.Count(),
            results = results.Select(FormatResult)
        }, JsonOptions);
    }

    /// <summary>
    /// Formats a RaceResultDto into a compact anonymous object for JSON serialization.
    /// </summary>
    private static object FormatResult(DTOs.RaceResultDto r) => new
    {
        r.Id,
        r.BibNumber,
        r.Name,
        r.Age,
        gender = r.Gender.ToString(),
		runnerType = r.RunnerType.ToString(),
        r.OverallPlace,
        r.GenderPlace,
        r.DivisionPlace,
        netTime = PaceHelpers.FormatTime(r.NetTime),
        clockTime = PaceHelpers.FormatTime(r.ClockTime),
        pace = PaceHelpers.FormatPace(r.OverallPace),
        r.Hometown,
		resultBreakdown = r.ResultData,
        passes = r.Passes,
        passers = r.Passers,
        url = ToolArgSanitizer.ResultUrl(r.Id)
    };
}
