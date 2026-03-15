using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.DTOs;
using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Repositories;
using Falchion.Villains.Vault.Api.Services;
using Falchion.Villains.Vault.Api.Utils;

namespace Falchion.Villains.Vault.Api.Controllers.Admin;

/// <summary>
/// Controller for managing events.
/// All endpoints require admin authorization.
/// </summary>
[ApiController]
[ApiExplorerSettings(GroupName = "admin")]
[Route("api/v1.0/admin/events")]
[Authorize(Policy = "AdminOnly")]
public class EventsController : ApiControllerBase
{
    private readonly IEventRepository _eventRepository;
    private readonly IRaceRepository _raceRepository;
    private readonly IJobRepository _jobRepository;
    private readonly IUserRepository _userRepository;
    private readonly TrackShackScraperService _scraperService;
    private readonly JobQueue _jobQueue;
    private readonly ILogger<EventsController> _logger;

    public EventsController(
        IEventRepository eventRepository,
        IRaceRepository raceRepository,
        IJobRepository jobRepository,
        IUserRepository userRepository,
        TrackShackScraperService scraperService,
        JobQueue jobQueue,
        ILogger<EventsController> logger)
    {
        _eventRepository = eventRepository;
        _raceRepository = raceRepository;
        _jobRepository = jobRepository;
        _userRepository = userRepository;
        _scraperService = scraperService;
        _jobQueue = jobQueue;
        _logger = logger;
    }

    /// <summary>
    /// Previews an event by scraping the Track Shack page and returning discovered races.
    /// Merges with existing data if the event has been submitted before.
    /// </summary>
    [HttpPost("preview")]
    public async Task<IActionResult> PreviewEvent([FromQuery] string url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return BadRequest(new { error = "URL is required." });
        }

        try
        {
            // Validate URL
            if (!UrlNormalizer.IsValidTrackShackUrl(url))
            {
                return BadRequest(new { error = "Invalid Track Shack URL. Must be from trackshackresults.com domain." });
            }

            // Normalize URL
            var normalizedUrl = UrlNormalizer.Normalize(url);

            // Scrape event page
            var (eventName, discoveredRaces) = await _scraperService.ScrapeEventPageAsync(url);

            // Check for existing event
            var existingEvent = await _eventRepository.GetByUrlAsync(normalizedUrl);
            var existingRaces = existingEvent != null
                ? await _raceRepository.GetByEventIdAsync(existingEvent.Id)
                : new List<Race>();

            // Merge discovered races with existing ones
            var racePreviews = new List<RacePreviewDto>();
            foreach (var (raceUrl, name, date, distance) in discoveredRaces)
            {
                var normalizedRaceUrl = UrlNormalizer.Normalize(raceUrl, url);
                var existingRace = existingRaces.FirstOrDefault(r => r.TrackShackUrl == normalizedRaceUrl);

                // Get result count for existing races
                var resultCount = 0;
                if (existingRace != null)
                {
                    resultCount = await _raceRepository.GetResultCountAsync(existingRace.Id);
                }

                racePreviews.Add(new RacePreviewDto
                {
                    Url = normalizedRaceUrl,
                    Name = existingRace?.Name ?? name,
                    RaceDate = existingRace?.RaceDate ?? date ?? DateTime.Today,
                    Distance = existingRace?.Distance ?? distance,
                    Notes = existingRace?.Notes,
                    IsExisting = existingRace != null,
                    ExistingId = existingRace?.Id,
                    ResultCount = resultCount
                });
            }

            return Ok(new EventPreviewDto
            {
                Url = normalizedUrl,
                Name = existingEvent?.Name ?? eventName,
                IsExisting = existingEvent != null,
                ExistingId = existingEvent?.Id,
                Races = racePreviews
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error previewing event {Url}", url);
            return StatusCode(500, new { error = "Failed to preview event: " + ex.Message });
        }
    }

    /// <summary>
    /// Submits an event and its races for parsing.
    /// Creates jobs for races marked with shouldProcess=true.
    /// </summary>
    [HttpPost("submit")]
    public async Task<IActionResult> SubmitEvent([FromBody] SubmitEventRequest request)
    {
        try
        {
            // Get current user
            var userId = await GetCurrentUserIdAsync();
            if (userId == null)
            {
                return Unauthorized();
            }

            // Validate URL
            if (!UrlNormalizer.IsValidTrackShackUrl(request.Url))
            {
                return BadRequest(new { error = "Invalid Track Shack URL." });
            }

            var normalizedUrl = UrlNormalizer.Normalize(request.Url);

            // Get or create event (using repository method)
            var savedEvent = await _eventRepository.CreateOrUpdateAsync(normalizedUrl, request.Name, userId.Value);

            // Process races
            var savedRaces = new List<Race>();
            var jobIds = new List<int>();
            var errors = new List<string>();

            // Sort races by date for job ordering
            var sortedRaces = request.Races.OrderBy(r => r.RaceDate).ToList();

            foreach (var raceDto in sortedRaces)
            {
                try
                {
                    var normalizedRaceUrl = UrlNormalizer.Normalize(raceDto.Url, request.Url);

                    // Get or create race (using repository method)
                    var savedRace = await _raceRepository.CreateOrUpdateAsync(
                        savedEvent.Id,
                        normalizedRaceUrl,
                        raceDto.Name,
                        raceDto.RaceDate,
                        raceDto.Distance,
                        raceDto.Notes
                    );

                    savedRaces.Add(savedRace);

                    // Create job if requested
                    if (raceDto.ShouldProcess)
                    {
                        try
                        {
                            var job = await _jobRepository.CreateJobForRaceAsync(savedRace.Id, userId.Value);
                            await _jobQueue.EnqueueAsync(job.Id);
                            jobIds.Add(job.Id);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error creating job for race {RaceId}", savedRace.Id);
                            errors.Add($"Failed to create job for {savedRace.Name}: {ex.Message}");
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing race {RaceName}", raceDto.Name);
                    errors.Add($"Failed to process race {raceDto.Name}: {ex.Message}");
                }
            }

            return Ok(new SubmitEventResponseDto
            {
                Event = EventDto.FromEntity(savedEvent),
                Races = savedRaces.Select(RaceDto.FromEntity<RaceDto>).ToList(),
                JobIds = jobIds,
                Errors = errors
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting event");
            return StatusCode(500, new { error = "Failed to submit event: " + ex.Message });
        }
    }

    /// <summary>
    /// Deletes an event and all its associated data.
    /// </summary>
    /// <param name="id">The ID of the event to delete</param>
    /// <response code="204">Event deleted successfully</response>
    /// <response code="401">Unauthorized</response>
    /// <response code="404">Event not found</response>
    /// <response code="500">Internal server error</response>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEvent(int id)
    {
        try
        {
            await _eventRepository.DeleteAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting event with ID {EventId}", id);
            return StatusCode(500, new { error = "Failed to delete event: " + ex.Message });
        }
    }

    // Helper methods
    private async Task<int?> GetCurrentUserIdAsync()
    {
        var subjectId = GetSubjectId();

        if (string.IsNullOrEmpty(subjectId))
        {
            return null;
        }

        var user = await _userRepository.GetBySubjectIdAsync(subjectId);
        return user?.Id;
    }
}
