using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.DTOs;
using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Models;
using Falchion.Villains.Vault.Api.Services;
using Falchion.Villains.Vault.Api.Utils;
using System.Text.Json;

namespace Falchion.Villains.Vault.Api.Controllers;

/// <summary>
/// Public controller for browsing race results.
/// No authentication required. Results are cached to reduce database load.
/// </summary>
[ApiController]
[ApiExplorerSettings(GroupName = "public")]
[Tags("Race Results")]
[Route("api/v1.0/races/{raceId}/results")]
public class RaceResultsController : ApiControllerBase
{
    private readonly RaceDataService _raceDataService;
    private readonly IMemoryCache _cache;
    private readonly ILogger<RaceResultsController> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    private const int MaxPageSize = 5000;
    private const int DefaultPageSize = 50;
    private const int CacheMinutes = 15; // Cache results for 15 minutes

    public RaceResultsController(
        RaceDataService raceDataService,
        IMemoryCache cache,
        ILogger<RaceResultsController> logger,
        IOptions<JsonOptions> jsonOptions)
    {
        _raceDataService = raceDataService;
        _cache = cache;
        _logger = logger;
        _jsonOptions = jsonOptions.Value.JsonSerializerOptions;
    }

    /// <summary>
    /// Gets a result result by ID.
    /// Public endpoint - no authentication required.
    /// Cached for 15 minutes.
    /// </summary>
    /// <param name="raceResultId">The race result ID</param>
    /// <returns>Race details including metadata</returns>
    /// <response code="200">Race result retrieved successfully</response>
    /// <response code="404">Race result not found</response>
    [HttpGet("~/api/v1.0/races/results/{raceResultId}")]
    [ResponseCache(Duration = 900)]
    public async Task<IActionResult> GetRaceResultById(int raceResultId)
    {
        try
        {
            // Check if cache should be bypassed
            var bypassCache = ShouldBypassCache();
            var cacheKey = $"race_result_{raceResultId}_details";
            RaceResultDetailedDto? cachedRaceResult = null;

            // Try to get from cache (unless bypassed)
            if (!bypassCache && _cache.TryGetValue(cacheKey, out cachedRaceResult))
            {
                _logger.LogDebug("Retrieved race result {RaceResultId} from cache", raceResultId);
            }
            else
            {
                cachedRaceResult = await _raceDataService.GetRaceResultDetailedAsync(raceResultId);
                if (cachedRaceResult == null)
                {
                    return NotFound(new { error = $"Race result with ID {raceResultId} not found" });
                }

                // Cache the race result (always update cache even if bypassed)
                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(CacheMinutes));
                _cache.Set(cacheKey, cachedRaceResult, cacheOptions);

                _logger.LogInformation("Fetched and cached race result details for race result {RaceResultId} (bypass: {Bypass})",
                    raceResultId, bypassCache);
            }

            return Ok(cachedRaceResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving race result {RaceResultId}", raceResultId);
            return StatusCode(500, new { error = "Failed to retrieve race result" });
        }
    }

    /// <summary>
    /// Gets all results for a race (no paging).
    /// Supports filtering by division, gender, and runner type.
    /// Cached for 15 minutes to reduce database load.
    /// </summary>
    /// <param name="raceId">The race ID</param>
    /// <param name="divisionId">Optional division ID filter</param>
    /// <param name="gender">Optional gender filter (Male or Female - Unknown genders always included)</param>
    /// <param name="runnerType">Optional runner type filter (Runner, PushRim, HandCycle, Duo)</param>
    /// <param name="sortBy">Field to sort by (default: OverallPlace)</param>
    /// <param name="sortDirection">Sort direction: asc or desc (default: asc)</param>
    /// <returns>List of all race results</returns>
    /// <response code="200">Results retrieved successfully</response>
    /// <response code="404">Race not found</response>
    [HttpGet]
    [ResponseCache(Duration = 900, VaryByQueryKeys = new[] { "divisionId", "gender", "runnerType", "sortBy", "sortDirection" })]
    public async Task<IActionResult> GetAllResults(
        int raceId,
        [FromQuery] int? divisionId = null,
        [FromQuery] Gender? gender = null,
        [FromQuery] RunnerType? runnerType = null,
        [FromQuery] RaceResultColumn sortBy = RaceResultColumn.OverallPlace,
        [FromQuery] string sortDirection = "asc")
    {
        try
        {
            // Check if race exists
            var race = await _raceDataService.GetRaceByIdAsync(raceId);
            if (race == null)
            {
                return NotFound(new { error = $"Race with ID {raceId} not found" });
            }

            // Check if cache should be bypassed
            var bypassCache = ShouldBypassCache();
            var cacheKey = $"race_{raceId}_all_results_div_{divisionId?.ToString() ?? "all"}_gender_{gender?.ToString() ?? "all"}_type_{runnerType?.ToString() ?? "all"}_sort_{sortBy}_{sortDirection}".ToLower();
            List<RaceResultDto>? cachedResults = null;

            // Try to get results from cache (unless bypassed)
            if (!bypassCache && _cache.TryGetValue(cacheKey, out cachedResults))
            {
                _logger.LogDebug("Retrieved {Count} results from cache for race {RaceId}", cachedResults!.Count, raceId);
            }
            else
            {
				// Not in cache or bypassed, fetch from database
				cachedResults = await _raceDataService.GetFilteredResultsAsync(
					raceId, divisionId, gender, runnerType, sortBy, sortDirection, page: 1, pageSize: 50000);

                // Cache the results (always update cache even if bypassed)
                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(CacheMinutes));
                _cache.Set(cacheKey, cachedResults, cacheOptions);

                _logger.LogInformation("Fetched and cached {Count} results for race {RaceId} (filters: division={Division}, gender={Gender}, runnerType={RunnerType}, bypass: {Bypass})",
                    cachedResults?.Count ?? 0, raceId, divisionId, gender, runnerType, bypassCache);
            }

            return Ok(cachedResults);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all results for race {RaceId}", raceId);
            return StatusCode(500, new { error = "Failed to retrieve race results" });
        }
    }

    /// <summary>
    /// Gets filtered and paged results for a race.
    /// Supports filtering by division ID, gender, and searching across BibNumber, Name, and Hometown.
    /// Cached for 15 minutes to reduce database load.
    /// </summary>
    /// <param name="raceId">The race ID</param>
    /// <param name="divisionId">Optional division ID filter</param>
    /// <param name="gender">Optional gender filter (Male or Female - Unknown genders always included)</param>
    /// <param name="search">Optional search term to filter by BibNumber, Name, or Hometown</param>
    /// <param name="sortBy">Field to sort by (default: OverallPlace)</param>
    /// <param name="sortDirection">Sort direction: asc or desc (default: asc)</param>
    /// <param name="page">Page number (1-indexed, default: 1)</param>
    /// <param name="pageSize">Number of items per page (default: 50, max: 5000)</param>
    /// <param name="region">Optional region filter — a state code (e.g., 'FL') or country name to filter by runner hometown region</param>
    /// <returns>Paged results with metadata</returns>
    /// <response code="200">Results retrieved successfully</response>
    /// <response code="400">Invalid parameters</response>
    /// <response code="404">Race not found</response>
    [HttpGet("paged")]
    [ResponseCache(Duration = 900, VaryByQueryKeys = new[] { "divisionId", "gender", "search", "sortBy", "sortDirection", "page", "pageSize", "region" })]
    public async Task<IActionResult> GetPagedResults(
        int raceId,
        [FromQuery] int? divisionId = null,
        [FromQuery] Gender? gender = null,
        [FromQuery] string? search = null,
        [FromQuery] RaceResultColumn sortBy = RaceResultColumn.OverallPlace,
        [FromQuery] string sortDirection = "asc",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = DefaultPageSize,
        [FromQuery] string? region = null)
    {
        try
        {
            // Validate parameters
            if (page < 1)
            {
                return BadRequest(new { error = "Page must be greater than 0" });
            }

            if (pageSize < 1 || pageSize > MaxPageSize)
            {
                return BadRequest(new { error = $"Page size must be between 1 and {MaxPageSize}" });
            }

            // Check if race exists
            var race = await _raceDataService.GetRaceByIdAsync(raceId);
            if (race == null)
            {
                return NotFound(new { error = $"Race with ID {raceId} not found" });
            }

            // Check if cache should be bypassed
            var bypassCache = ShouldBypassCache();
            var cacheKey = $"race_{raceId}_results_page_{page}_size_{pageSize}_div_{divisionId?.ToString() ?? "all"}_gender_{gender?.ToString() ?? "all"}_search_{search ?? "none"}_region_{region ?? "all"}_sort_{sortBy}_{sortDirection}".ToLower();
            PagedResultsDto<RaceResultDto>? cachedPagedResults = null;

            // Try to get results from cache (unless bypassed)
            if (!bypassCache && _cache.TryGetValue(cacheKey, out cachedPagedResults))
            {
                _logger.LogDebug("Retrieved page {Page} from cache for race {RaceId}", page, raceId);
            }
            else
            {
                // Not in cache or bypassed, fetch from database
                cachedPagedResults = await _raceDataService.GetPagedResultsAsync(
                    raceId, divisionId, gender, search, sortBy, sortDirection, page, pageSize, region);

                // Cache the paged results (always update cache even if bypassed)
                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(CacheMinutes));
                _cache.Set(cacheKey, cachedPagedResults, cacheOptions);

                _logger.LogInformation(
                    "Fetched and cached page {Page} of results for race {RaceId} (divisionId: {DivisionId}, gender: {Gender}, search: {Search}, region: {Region}, bypass: {Bypass})",
                    page, raceId, divisionId?.ToString() ?? "all", gender?.ToString() ?? "all", search ?? "none", region ?? "all", bypassCache);
            }

            return Ok(cachedPagedResults);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving paged results for race {RaceId}", raceId);
            return StatusCode(500, new { error = "Failed to retrieve race results" });
        }
    }

    /// <summary>
    /// Exports filtered race results as CSV.
    /// Fetches data in chunks to avoid large queries and table locks.
    /// Supports filtering by division ID, gender, and searching across BibNumber, Name, and Hometown.
    /// Returns CSV file for download.
    /// </summary>
    /// <param name="raceId">The race ID</param>
    /// <param name="divisionId">Optional division ID filter</param>
    /// <param name="gender">Optional gender filter (Male or Female - Unknown genders always included)</param>
    /// <param name="search">Optional search term to filter by BibNumber, Name, or Hometown</param>
    /// <param name="sortBy">Field to sort by (default: OverallPlace)</param>
    /// <param name="sortDirection">Sort direction: asc or desc (default: asc)</param>
    /// <returns>CSV file with race results</returns>
    /// <response code="200">CSV file generated successfully</response>
    /// <response code="404">Race not found</response>
    [HttpGet("export")]
    public async Task<IActionResult> ExportResults(
        int raceId,
        [FromQuery] int? divisionId = null,
        [FromQuery] Gender? gender = null,
        [FromQuery] string? search = null,
        [FromQuery] RaceResultColumn sortBy = RaceResultColumn.OverallPlace,
        [FromQuery] string sortDirection = "asc")
    {
        try
        {
            // Check if race exists
            var race = await _raceDataService.GetRaceByIdAsync(raceId);
            if (race == null)
            {
                return NotFound(new { error = $"Race with ID {raceId} not found" });
            }

            // Parse race metadata for split information
            var metadata = RaceMetadata.FromJson(race.MetadataJson);
            var splitLabels = metadata.SplitTimes?.Select(s => s.Label).ToList() ?? new List<string>();

            // Fetch results in chunks to avoid large queries
            const int chunkSize = 1000;
            var allResults = new List<RaceResult>();
            var page = 1;
            var hasMoreResults = true;

            while (hasMoreResults)
            {
                var results = await _raceDataService.GetFilteredPagedResultsRawAsync(
                    raceId, divisionId, gender, search, sortBy, sortDirection, page, chunkSize);

                allResults.AddRange(results);
                hasMoreResults = results.Count == chunkSize;
                page++;
            }

            // Build CSV content
            var csv = new System.Text.StringBuilder();
            
            // Build CSV header with dynamic split columns
            var headerParts = new List<string>
            {
                "Bib Number", "Name", "Age", "Gender", "Division",
                "Overall Place", "Division Place", "Gender Place"
            };
            
            // Add split time headers
            headerParts.AddRange(splitLabels);
            
            // Add remaining headers
            headerParts.AddRange(new[] { "Net Time", "Clock Time", "Start Time", "Overall Pace", "Passes (Kills)", "Passers (Assassins)", "Hometown" });
            
            csv.AppendLine(string.Join(",", headerParts));

            // CSV rows
            foreach (var result in allResults)
            {
                var rowParts = new List<string>
                {
                    EscapeCsvValue(result.BibNumber.ToString()),
                    EscapeCsvValue(result.Name),
                    result.Age.ToString(),
                    result.Gender.ToString(),
                    EscapeCsvValue(result.Division?.DivisionLabel ?? ""),
                    result.OverallPlace?.ToString() ?? "",
                    result.DivisionPlace?.ToString() ?? "",
                    result.GenderPlace?.ToString() ?? ""
                };
                
                // Add split times
                var splitTimes = new[] 
                { 
                    result.Split1, result.Split2, result.Split3, result.Split4, result.Split5,
                    result.Split6, result.Split7, result.Split8, result.Split9, result.Split10 
                };
                
                for (int i = 0; i < splitLabels.Count && i < splitTimes.Length; i++)
                {
                    rowParts.Add(PaceHelpers.FormatTime(splitTimes[i]));
                }
                
                // Add remaining fields
                rowParts.AddRange(new[]
                {
                    PaceHelpers.FormatTime(result.NetTime),
                    PaceHelpers.FormatTime(result.ClockTime),
                    PaceHelpers.FormatTime(result.StartTime),
                    PaceHelpers.FormatPace(result.OverallPace),
                    result.Passes?.ToString() ?? "",
                    result.Passers?.ToString() ?? "",
                    EscapeCsvValue(result.Hometown ?? "")
                });
                
                csv.AppendLine(string.Join(",", rowParts));
            }

            // Return CSV file
            var bytes = System.Text.Encoding.UTF8.GetBytes(csv.ToString());
            var fileName = $"race_{raceId}_results_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
            
            _logger.LogInformation(
                "Exported {Count} results for race {RaceId} (divisionId: {DivisionId}, gender: {Gender}, search: {Search})",
                allResults.Count, raceId, divisionId?.ToString() ?? "all", gender?.ToString() ?? "all", search ?? "none");

            return File(bytes, "text/csv", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting results for race {RaceId}", raceId);
            return StatusCode(500, new { error = "Failed to export race results" });
        }
    }

    /// <summary>
    /// Escapes CSV values to handle commas, quotes, and newlines
    /// </summary>
    private string EscapeCsvValue(string value)
    {
        if (string.IsNullOrEmpty(value))
            return "";

        // If the value contains comma, quote, or newline, wrap in quotes and escape existing quotes
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n') || value.Contains('\r'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }

        return value;
    }

    /// <summary>
    /// Gets the last starter (balloon lady) for a race.
    /// Returns the runner with the latest start time who finished the race with a pace close to 16 min/mile.
    /// Cached for 15 minutes to reduce database load.
    /// </summary>
    /// <param name="raceId">The race ID</param>
    /// <returns>Last starter race result</returns>
    /// <response code="200">Last starter retrieved successfully</response>
    /// <response code="404">Race not found or no balloon lady found</response>
    [HttpGet("last-starter")]
    [ResponseCache(Duration = 900)]
    public async Task<IActionResult> GetLastStarter(int raceId)
    {
        try
        {
            var race = await _raceDataService.GetRaceByIdAsync(raceId);
            if (race == null)
            {
                return NotFound(new { error = "Race not found" });
            }

            var dto = await _raceDataService.GetLastStarterAsync(raceId);
            if (dto == null)
            {
                return NotFound(new { error = "No results found for this race" });
            }

            return Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving last starter for race {RaceId}", raceId);
            return StatusCode(500, new { error = "Failed to retrieve last starter" });
        }
    }

    /// <summary>
    /// Gets the 20 closest starters and finishers to a target race result.
    /// Returns runners who started/finished both before and after the target runner, sorted by proximity.
    /// Public endpoint - no authentication required.
    /// Cached for 15 minutes.
    /// </summary>
    /// <param name="raceResultId">The race result ID to find closest results for</param>
    /// <returns>Object containing closest starters and finishers</returns>
    /// <response code="200">Closest results retrieved successfully</response>
    /// <response code="404">Race result not found</response>
    [HttpGet("~/api/v1.0/races/results/{raceResultId}/closest")]
    [ResponseCache(Duration = 900)]
    public async Task<IActionResult> GetClosestResults(long raceResultId, [FromQuery] int fieldSize)
    {
        try
        {
            // Check if cache should be bypassed
            var bypassCache = ShouldBypassCache();
            var cacheKey = $"race_result_{raceResultId}_closest_{fieldSize}";
            ClosestResultsDto? cachedResponse = null;

            // Try to get from cache (unless bypassed)
            if (!bypassCache && _cache.TryGetValue(cacheKey, out cachedResponse))
            {
                _logger.LogDebug("Retrieved closest results for race result {RaceResultId} from cache", raceResultId);
                return Ok(cachedResponse);
            }

            // Not in cache or bypassed, fetch from database
            var response = await _raceDataService.GetClosestResultsDtoAsync(raceResultId, fieldSize);
            if (response == null)
            {
                return NotFound(new { error = $"Race result with ID {raceResultId} not found" });
            }

            // Cache the response (always update cache even if bypassed)
            var cacheOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromMinutes(CacheMinutes));
            _cache.Set(cacheKey, response, cacheOptions);

            _logger.LogInformation("Fetched and cached closest results for race result {RaceResultId} ({StarterCount} starters, {FinisherCount} finishers, bypass: {Bypass})",
                raceResultId, response.ClosestStarters.Count, response.ClosestFinishers.Count, bypassCache);

            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation when retrieving closest results for race result {RaceResultId}", raceResultId);
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving closest results for race result {RaceResultId}", raceResultId);
            return StatusCode(500, new { error = "Failed to retrieve closest results" });
        }
    }

    /// <summary>
    /// Gets related race results for the same runner across races.
    /// Matches by runner name and age (with year-based offset), using hometown and bib as tiebreakers.
    /// If an optional eventId is provided, limits the search to races within that specific event.
    /// Public endpoint - no authentication required.
    /// Cached for 15 minutes.
    /// </summary>
    /// <param name="raceResultId">The source race result ID to find related results for</param>
    /// <param name="eventId">Optional event ID to limit the search to a specific event</param>
    /// <returns>Related race results grouped by event</returns>
    /// <response code="200">Related results retrieved successfully</response>
    /// <response code="404">Race result not found</response>
    [HttpGet("~/api/v1.0/races/results/{raceResultId}/related")]
    [ResponseCache(Duration = 900, VaryByQueryKeys = new[] { "eventId" })]
    public async Task<IActionResult> GetRelatedResults(long raceResultId, [FromQuery] int? eventId = null)
    {
        try
        {
            // Check if cache should be bypassed
            var bypassCache = ShouldBypassCache();
            var cacheKey = $"race_result_{raceResultId}_related_{eventId?.ToString() ?? "all"}";
            RelatedRaceResultsDto? cachedResponse = null;

            // Try to get from cache (unless bypassed)
            if (!bypassCache && _cache.TryGetValue(cacheKey, out cachedResponse))
            {
                _logger.LogDebug("Retrieved related results for race result {RaceResultId} from cache", raceResultId);
                return Ok(cachedResponse);
            }

            var response = await _raceDataService.GetRelatedResultsAsync(raceResultId, eventId);
            if (response == null)
            {
                return NotFound(new { error = $"Race result with ID {raceResultId} not found" });
            }

            // Cache the response
            var cacheOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromMinutes(CacheMinutes));
            _cache.Set(cacheKey, response, cacheOptions);

            _logger.LogInformation(
                "Fetched and cached related results for race result {RaceResultId} (eventId: {EventId}, events: {EventCount}, bypass: {Bypass})",
                raceResultId, eventId, response.Events.Count, bypassCache);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving related results for race result {RaceResultId}", raceResultId);
            return StatusCode(500, new { error = "Failed to retrieve related results" });
        }
    }

    /// <summary>
    /// Gets all divisions for a race.
    /// Cached for 15 minutes to reduce database load.
    /// </summary>
    /// <param name="raceId">The race ID</param>
    /// <returns>List of divisions</returns>
    /// <response code="200">Divisions retrieved successfully</response>
    /// <response code="404">Race not found</response>
    [HttpGet("~/api/v1.0/races/{raceId}/divisions")]
    [ResponseCache(Duration = 900)]
    public async Task<IActionResult> GetDivisions(int raceId)
    {
        try
        {
            // Check if race exists
            var race = await _raceDataService.GetRaceByIdAsync(raceId);
            if (race == null)
            {
                return NotFound(new { error = $"Race with ID {raceId} not found" });
            }

            // Check if cache should be bypassed
            var bypassCache = ShouldBypassCache();
            var cacheKey = $"race_{raceId}_divisions";
            List<DivisionDto>? cachedDivisions = null;

            // Try to get divisions from cache (unless bypassed)
            if (!bypassCache && _cache.TryGetValue(cacheKey, out cachedDivisions))
            {
                _logger.LogDebug("Retrieved {Count} divisions from cache for race {RaceId}", cachedDivisions!.Count, raceId);
            }
            else
            {
                // Not in cache or bypassed, fetch from database
                cachedDivisions = await _raceDataService.GetDivisionsAsync(raceId);

                // Cache the divisions (always update cache even if bypassed)
                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(CacheMinutes));
                _cache.Set(cacheKey, cachedDivisions, cacheOptions);

                _logger.LogInformation("Fetched and cached {Count} divisions for race {RaceId} (bypass: {Bypass})",
                    cachedDivisions.Count, raceId, bypassCache);
            }

            return Ok(cachedDivisions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving divisions for race {RaceId}", raceId);
            return StatusCode(500, new { error = "Failed to retrieve divisions" });
        }
    }

    /// <summary>
    /// Streams all results for a race in chunks.
    /// Returns newline-delimited JSON for progressive rendering.
    /// Supports filtering by division, gender, and runner type.
    /// </summary>
    /// <param name="raceId">The race ID</param>
    /// <param name="divisionId">Optional division ID filter</param>
    /// <param name="gender">Optional gender filter (Male or Female - Unknown genders always included)</param>
    /// <param name="runnerType">Optional runner type filter (Runner, PushRim, HandCycle, Duo)</param>
    /// <param name="sortBy">Field to sort by (default: OverallPlace)</param>
    /// <param name="sortDirection">Sort direction: asc or desc (default: asc)</param>
    /// <param name="chunkSize">Number of results per chunk (default: 500, min: 100, max: 1000)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Streamed results as newline-delimited JSON</returns>
    /// <response code="200">Results streaming started</response>
    /// <response code="400">Invalid parameters</response>
    /// <response code="404">Race not found</response>
    [HttpGet("stream")]
    public async Task StreamResults(
        int raceId,
        [FromQuery] int? divisionId = null,
        [FromQuery] Gender? gender = null,
        [FromQuery] RunnerType? runnerType = null,
        [FromQuery] RaceResultColumn sortBy = RaceResultColumn.OverallPlace,
        [FromQuery] string sortDirection = "asc",
        [FromQuery] int chunkSize = 500,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Validate chunk size
            if (chunkSize < 100 || chunkSize > 1000)
            {
                Response.StatusCode = 400;
                await Response.WriteAsJsonAsync(new { error = "Chunk size must be between 100 and 1000" }, cancellationToken);
                return;
            }

            // Check if race exists
            var race = await _raceDataService.GetRaceByIdAsync(raceId);
            if (race == null)
            {
                Response.StatusCode = 404;
                await Response.WriteAsJsonAsync(new { error = $"Race with ID {raceId} not found" }, cancellationToken);
                return;
            }

            // Set response headers for streaming
            Response.ContentType = "application/x-ndjson"; // Newline-delimited JSON
            Response.Headers.Append("Cache-Control", "no-cache");
            Response.Headers.Append("X-Content-Type-Options", "nosniff");

            // Get total count with filters
            var totalCount = await _raceDataService.GetRaceResultsCountAsync(raceId, divisionId, gender, runnerType);
            
            // Send metadata as first chunk
            await Response.WriteAsync(JsonSerializer.Serialize(new
            {
                type = "metadata",
                totalCount = totalCount,
                chunkSize = chunkSize,
                filters = new
                {
                    divisionId = divisionId,
                    gender = gender,
                    runnerType = runnerType
                }
            }, _jsonOptions) + "\n", cancellationToken);
            await Response.Body.FlushAsync(cancellationToken);

            // Stream results in chunks
            var page = 1;
            var totalPages = totalCount > 0 ? (int)Math.Ceiling(totalCount / (double)chunkSize) : 0;

            while (page <= totalPages && !cancellationToken.IsCancellationRequested)
            {
				var resultDtos = await _raceDataService.GetFilteredResultsAsync(
					raceId,
					divisionId,
                    gender,
                    runnerType,
                    sortBy,
                    sortDirection,
                    page,
                    chunkSize);

                // Send chunk
                await Response.WriteAsync(JsonSerializer.Serialize(new
                {
                    type = "chunk",
                    page = page,
                    totalPages = totalPages,
                    data = resultDtos
                }, _jsonOptions) + "\n", cancellationToken);
                await Response.Body.FlushAsync(cancellationToken);

                _logger.LogDebug("Streamed chunk {Page}/{TotalPages} ({Count} results) for race {RaceId}", 
                    page, totalPages, resultDtos.Count, raceId);

                page++;
            }

            // Send completion marker
            await Response.WriteAsync(JsonSerializer.Serialize(new
            {
                type = "complete"
            }, _jsonOptions) + "\n", cancellationToken);
            await Response.Body.FlushAsync(cancellationToken);

            _logger.LogInformation("Completed streaming {Count} results for race {RaceId} (filters: division={Division}, gender={Gender}, runnerType={RunnerType})", 
                totalCount, raceId, divisionId, gender, runnerType);
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Stream cancelled for race {RaceId}", raceId);
            // Client disconnected - this is expected, don't log as error
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error streaming results for race {RaceId}", raceId);
            
            // Send error chunk if stream hasn't completed and response hasn't started
            try
            {
                if (!Response.HasStarted)
                {
                    Response.StatusCode = 500;
                    await Response.WriteAsJsonAsync(new { error = "Failed to stream race results" }, cancellationToken);
                }
                else
                {
                    await Response.WriteAsync(JsonSerializer.Serialize(new
                    {
                        type = "error",
                        error = "Stream interrupted"
                    }, _jsonOptions) + "\n", cancellationToken);
                }
            }
            catch
            {
                // Ignore errors when trying to send error response
            }
        }
    }

    /// <summary>
    /// Gets a single race result by bib number.
    /// Public endpoint - no authentication required.
    /// </summary>
    /// <param name="raceId">The race ID</param>
    /// <param name="bibNumber">The bib number to look up</param>
    /// <returns>The matching race result, or 404 if not found</returns>
    /// <response code="200">Race result retrieved successfully</response>
    /// <response code="404">No result found for the given bib number</response>
    [HttpGet("bib/{bibNumber}")]
    [ResponseCache(Duration = 900, VaryByQueryKeys = new[] { "bibNumber" })]
    public async Task<IActionResult> GetResultByBibNumber(int raceId, int bibNumber)
    {
        try
        {
            var bypassCache = ShouldBypassCache();
            var cacheKey = $"race_{raceId}_bib_{bibNumber}";

            if (!bypassCache && _cache.TryGetValue(cacheKey, out RaceResultDto? cached) && cached != null)
            {
                return Ok(cached);
            }

            var result = await _raceDataService.GetResultByBibNumberAsync(raceId, bibNumber);
            if (result == null)
            {
                return NotFound(new { error = $"No result found for bib {bibNumber} in race {raceId}" });
            }

            _cache.Set(cacheKey, result, new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromMinutes(CacheMinutes)));

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving result for bib {BibNumber} in race {RaceId}", bibNumber, raceId);
            return StatusCode(500, new { error = "Failed to retrieve race result" });
        }
    }

    /// <summary>
    /// Gets race results for multiple bib numbers.
    /// Public endpoint - no authentication required.
    /// Accepts a JSON array of bib numbers in the request body.
    /// </summary>
    /// <param name="raceId">The race ID</param>
    /// <param name="bibNumbers">Array of bib numbers to look up</param>
    /// <returns>List of matching race results (bibs not found are omitted)</returns>
    /// <response code="200">Race results retrieved successfully</response>
    /// <response code="400">Invalid request (empty array or too many bibs)</response>
    [HttpPost("bibs")]
    public async Task<IActionResult> GetResultsByBibNumbers(int raceId, [FromBody] int[] bibNumbers)
    {
        try
        {
            if (bibNumbers == null || bibNumbers.Length == 0)
            {
                return BadRequest(new { error = "At least one bib number is required" });
            }

            if (bibNumbers.Length > 100)
            {
                return BadRequest(new { error = "Maximum of 100 bib numbers allowed per request" });
            }

            // Deduplicate
            var uniqueBibs = bibNumbers.Distinct().ToArray();

            var results = await _raceDataService.GetResultsByBibNumbersAsync(raceId, uniqueBibs);
            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving results for {Count} bibs in race {RaceId}", bibNumbers?.Length ?? 0, raceId);
            return StatusCode(500, new { error = "Failed to retrieve race results" });
        }
    }
}
