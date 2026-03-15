using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.DTOs;
using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Repositories;
using Falchion.Villains.Vault.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using System.Diagnostics;

namespace Falchion.Villains.Vault.Api.Controllers;

/// <summary>
/// Public controller for browsing race information.
/// No authentication required. Results are cached to reduce database load.
/// </summary>
[ApiController]
[ApiExplorerSettings(GroupName = "public")]
[Tags("Races")]
[Route("api/v1.0/races")]
public class RacesController : ApiControllerBase
{
	private readonly IRaceRepository _raceRepository;
	private readonly IMemoryCache _cache;
	private readonly ILogger<RacesController> _logger;
    private readonly IResultRepository _resultRepository;
    private readonly IEventRepository _eventRepository;
    private readonly WeatherService _weatherService;
    private readonly RaceDataService _raceDataService;
    private readonly CourseMapImageService _courseMapImageService;

    private const int CacheMinutes = 15; // Cache results for 15 minutes

	public RacesController(
		IRaceRepository raceRepository,
        IResultRepository resultRepository,
        IEventRepository eventRepository,
        IMemoryCache cache,
        WeatherService weatherService,
        RaceDataService raceDataService,
        CourseMapImageService courseMapImageService,
        ILogger<RacesController> logger)
	{
		_raceRepository = raceRepository;
        _resultRepository = resultRepository;
        _eventRepository = eventRepository;
        _cache = cache;
        _weatherService = weatherService;
        _raceDataService = raceDataService;
        _courseMapImageService = courseMapImageService;
        _logger = logger;
	}

	/// <summary>
	/// Gets race details by ID.
	/// Public endpoint - no authentication required.
	/// Cached for 15 minutes.
	/// </summary>
	/// <param name="raceId">The race ID</param>
	/// <returns>Race details including metadata</returns>
	/// <response code="200">Race retrieved successfully</response>
	/// <response code="404">Race not found</response>
	[HttpGet("{raceId}")]
	[ResponseCache(Duration = 900)]
	public async Task<IActionResult> GetRaceById(int raceId)
	{
		try
		{
			// Check if cache should be bypassed
			var bypassCache = ShouldBypassCache();
			var cacheKey = $"race_{raceId}_details";
			RaceDto? cachedRace = null;

			// Try to get from cache (unless bypassed)
			if (!bypassCache && _cache.TryGetValue(cacheKey, out cachedRace))
			{
				_logger.LogDebug("Retrieved race {RaceId} from cache", raceId);
			}
			else
			{
				// Not in cache or bypassed, fetch from database
				var race = await _raceRepository.GetByIdAsync(raceId);
				if (race == null)
				{
					return NotFound(new { error = $"Race with ID {raceId} not found" });
				}

				cachedRace = RaceDto.FromEntity<RaceDto>(race);

				// Cache the race (always update cache even if bypassed)
				var cacheOptions = new MemoryCacheEntryOptions()
					.SetAbsoluteExpiration(TimeSpan.FromMinutes(CacheMinutes));
				_cache.Set(cacheKey, cachedRace, cacheOptions);

				_logger.LogInformation("Fetched and cached race details for race {RaceId} (bypass: {Bypass})", 
					raceId, bypassCache);
			}

			return Ok(cachedRace);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error retrieving race {RaceId}", raceId);
			return StatusCode(500, new { error = "Failed to retrieve race" });
		}
	}

    /// <summary>
    /// Gets the count of DNF (Did Not Finish) runners for a specific race.
    /// This count is used in kill chart calculations where DNF runners are added to all kill counts.
    /// </summary>
    /// <param name="raceId">The ID of the race</param>
    /// <response code="200">DNF count retrieved successfully</response>
    /// <response code="401">Unauthorized</response>
    /// <response code="404">Race not found</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("{raceId}/dnf-count")]
    public async Task<IActionResult> GetDnfCount(int raceId)
    {
        try
        {
            var race = await _raceRepository.GetByIdAsync(raceId);
            if (race == null)
            {
                return NotFound(new { error = "Race not found" });
            }

            var dnfCount = await _raceRepository.GetDnfCountAsync(raceId);
            return Ok(new { raceId, dnfCount });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting DNF count for race {RaceId}", raceId);
            return StatusCode(500, new { error = "Failed to get DNF count: " + ex.Message });
        }
    }

    /// <summary>
    /// Gets weather data for a specific race.
    /// If weather data is not already stored, fetches it from Open-Meteo API and saves it.
    /// </summary>
    /// <param name="raceId">The ID of the race</param>
    /// <returns>Weather data as a JSON object</returns>
    /// <response code="200">Weather data retrieved successfully</response>
    /// <response code="404">Race not found</response>
    /// <response code="500">Failed to fetch weather data</response>
    [HttpGet("{raceId}/weather")]
    public async Task<IActionResult> GetWeatherData(int raceId)
    {
        try
        {
            var race = await _raceRepository.GetByIdAsync(raceId);
            if (race == null)
            {
                return NotFound(new { error = "Race not found" });
            }
            // If the race was last modified on the day of the race then we need to do a force refresh of the weather data to ensure that it gets accurate data and not forecasted data.
            bool forceRefresh = false;
            if (race.ModifiedAt.Date == race.RaceDate.Date && race.RaceDate.Date < DateTime.UtcNow.Date)
            {
                forceRefresh = true;
            }

            // If weather data is already stored and forceRefresh is not requested, return it
            if (!string.IsNullOrEmpty(race.WeatherDataJson) && !forceRefresh)
            {
                _logger.LogInformation("Returning cached weather data for race {RaceId}", raceId);
                return Content(race.WeatherDataJson, "application/json");
            }

            // Otherwise, fetch from API
            _logger.LogInformation("Fetching weather data from Open-Meteo API for race {RaceId}", raceId);
            var weatherData = await _weatherService.FetchWeatherDataAsync(race);

            if (weatherData == null)
            {
                return StatusCode(500, new { error = "Failed to fetch weather data from Open-Meteo API" });
            }

            // Save the weather data to the database
            race.WeatherDataJson = weatherData;
            await _raceRepository.UpdateAsync(race);

            _logger.LogInformation("Weather data fetched and saved for race {RaceId}", raceId);
            return Content(weatherData, "application/json");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving weather data for race {RaceId}", raceId);
            return StatusCode(500, new { error = "Failed to retrieve weather data: " + ex.Message });
        }
    }

    /// <summary>
    /// Retrieves statistical data for the specified race.
    /// </summary>
    /// <remarks>If statistics have been previously calculated and cached for the race, the cached data is
    /// returned. Otherwise, statistics are recalculated, saved, and then returned. This endpoint is intended for use by
    /// clients needing aggregated or summary data about a specific race.</remarks>
    /// <param name="raceId">The unique identifier of the race for which to retrieve statistics.</param>
    /// <returns>An <see cref="IActionResult"/> containing the race statistics in JSON format if found; returns a 404 response if
    /// the race does not exist, or a 500 response if an error occurs.</returns>
    [HttpGet("{raceId}/stats")]
    public async Task<IActionResult> GetRaceStats(int raceId)
    {
        try
        {
            var race = await _raceRepository.GetByIdAsync(raceId);
            if (race == null)
            {
                return NotFound(new { error = "Race not found" });
            }

            // If stats data is already stored, return it
            if (!string.IsNullOrEmpty(race.StatisticsJson))
            {
                _logger.LogInformation("Returning cached statistics for race {RaceId}", raceId);
                return Content(race.StatisticsJson, "application/json");
            }

            // Otherwise, recalculate.
            _logger.LogInformation("Fetching race statistics for race {RaceId}", raceId);

            var stats = await _raceRepository.BuildRaceStats(raceId);

            // Serialize and save the statistics to the database
            race.StatisticsJson = stats.ToJson();
            await _raceRepository.UpdateAsync(race);

            _logger.LogInformation("Race statistics fetched and saved for race {RaceId}", raceId);
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving race stats for race {RaceId}", raceId);
            return StatusCode(500, new { error = "Failed to retrieve race stats: " + ex.Message });
        }
    }



    /// <summary>
    /// Retrieves statistical data for the specified race series based on the race provided.
    /// </summary>
    /// <remarks>If statistics have been previously calculated and cached for the race, the cached data is
    /// returned. Otherwise, statistics are recalculated, saved, and then returned. This endpoint is intended for use by
    /// clients needing aggregated or summary data about a specific race.</remarks>
    /// <param name="eventSeries">The event series to retrieve results for.</param>
    /// <param name="raceDistance">The race distance to retrieve the results for.</param>
    /// <returns>An <see cref="IActionResult"/> containing the race statistics for all races in the same event series in JSON format; returns 500 response if an error occurs.</returns>
    [HttpGet("series-stats")]
    public async Task<IActionResult> GetRaceSeriesStats([FromQuery] EventSeries eventSeries, [FromQuery] RaceDistance raceDistance)
    {
        try
        {
            _logger.LogInformation("Fetching race statistics for all races in series {EventSeries} for distance {RaceDistance}", eventSeries, raceDistance);
            var events = await _eventRepository.GetAllWithRacesAsync();
            if (eventSeries != EventSeries.Unknown)
            {
                events = events.Where(e => e.EventSeries == eventSeries).ToList();
            }
            var races = new List<RaceWithStatsDto>();
            foreach (var e in events)
            {
                // If it's the EventSeries.DisneyWorldSpringtime then the distance can be either HalfMarathon or TenMile
                var race = e.Races.FirstOrDefault(e => e.Distance == raceDistance || 
                    (e.EventSeries == EventSeries.DisneyWorldSpringtime && (e.Distance == RaceDistance.HalfMarathon || e.Distance == RaceDistance.TenMile)));
                if (race != null)
                {
                    if (race.StatisticsJson == null)
                    {
                        race.StatisticsJson = (await _raceRepository.BuildRaceStats(race.Id)).ToJson();
                        await _raceRepository.UpdateAsync(race);
                    }
                    if (race.Event == null) { race.Event = e; }
                    races.Add(RaceWithStatsDto.FromEntity(race));
                }
            }

            return Ok(races);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving race stats for event series {EventSeries}", eventSeries);
            return StatusCode(500, new { error = "Failed to retrieve race stats: " + ex.Message });
        }
    }

    /// <summary>
    /// Retrieves the course map image for a specific race.
    /// </summary>
    /// <param name="raceId">The unique identifier of the race.</param>
    /// <returns>An <see cref="IActionResult"/> containing the course map image or a 404 response if not found.</returns>
    [HttpGet("{raceId}/course-map")]
    [ResponseCache(Duration = 900)]
    public IActionResult GetCourseMapDetails(int raceId)
    {
        var image = _courseMapImageService.GetImage(raceId);
        if (image == null)
        {
            return NoContent();
        }

        return Ok(image);
    }
}
