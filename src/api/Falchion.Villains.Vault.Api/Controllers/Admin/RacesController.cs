using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Falchion.Villains.Vault.Api.DTOs;
using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Repositories;
using Falchion.Villains.Vault.Api.Services;

namespace Falchion.Villains.Vault.Api.Controllers.Admin;

/// <summary>
/// Controller for managing race operations.
/// All endpoints require admin authorization.
/// </summary>
[ApiController]
[ApiExplorerSettings(GroupName = "admin")]
[Route("api/v1.0/admin/races")]
[Authorize(Policy = "AdminOnly")]
public class RacesController : ApiControllerBase
{
	private readonly IRaceRepository _raceRepository;
	private readonly IJobRepository _jobRepository;
	private readonly IUserRepository _userRepository;
	private readonly TrackShackScraperService _scraperService;
	private readonly JobQueue _jobQueue;
	private readonly ILogger<RacesController> _logger;
	private readonly CourseMapImageService _courseMapImageService;

	public RacesController(
		IRaceRepository raceRepository,
		IJobRepository jobRepository,
		IUserRepository userRepository,
		TrackShackScraperService scraperService,
		JobQueue jobQueue,
		ILogger<RacesController> logger,
		CourseMapImageService courseMapImageService)
	{
		_raceRepository = raceRepository;
		_jobRepository = jobRepository;
		_userRepository = userRepository;
		_scraperService = scraperService;
		_courseMapImageService = courseMapImageService;
		_jobQueue = jobQueue;
		_logger = logger;
	}

	/// <summary>
	/// Triggers a reparse of an existing race.
	/// Creates a new job and enqueues it for processing.
	/// </summary>
    /// <param name="id">The ID of the race to reparse</param>
    /// <returns>The created job ID</returns>
    /// <response code="200">Job created successfully</response>
    /// <response code="401">Unauthorized</response>
    /// <response code="404">Race not found</response>
    /// <response code="500">Internal server error</response>
	[HttpPost("{id}/reparse")]
	public async Task<IActionResult> ReparseRace(int id)
	{
		try
		{
			var userId = await GetCurrentUserIdAsync();
			if (userId == null)
			{
				return Unauthorized();
			}

			var race = await _raceRepository.GetByIdAsync(id);
			if (race == null)
			{
				return NotFound(new { error = "Race not found." });
			}

			var job = await _jobRepository.CreateJobForRaceAsync(race.Id, userId.Value);
			await _jobQueue.EnqueueAsync(job.Id);

			return Ok(new { jobId = job.Id });
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error reparsing race {RaceId}", id);
			return StatusCode(500, new { error = "Failed to reparse race: " + ex.Message });
		}
	}

	/// <summary>
	/// Scrapes divisions from a Track Shack URL for preview/testing.
	/// Does not require database entities - useful for previewing before creating a race.
	/// Only available in development mode.
	/// </summary>
    /// <param name="url">The Track Shack URL to scrape divisions from</param>
    /// <returns>List of scraped divisions</returns>
    /// <response code="200">Divisions scraped successfully</response>
    /// <response code="404">Not found (non-development mode)</response>
    /// <response code="400">Bad request (missing URL)</response>
    /// <response code="500">Internal server error</response>
	[HttpPost("preview/divisions")]
	public async Task<IActionResult> PreviewDivisions([FromQuery] string url)
	{
		if (!HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
		{
			return NotFound();
		}

		if (string.IsNullOrWhiteSpace(url))
		{
			return BadRequest(new { error = "URL is required." });
		}

		try
		{
			var divisions = await _scraperService.ScrapeDivisionsAsync(url);
			return Ok(new
			{
				url,
				divisions = divisions.Select(d => new { value = d.Value, name = d.Name }).ToList(),
				count = divisions.Count
			});
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error scraping divisions from {Url}", url);
			return StatusCode(500, new { error = "Failed to scrape divisions: " + ex.Message });
		}
	}

	/// <summary>
	/// Parses race results for a specific division from a Track Shack URL for preview/testing.
	/// Does not require database entities - useful for previewing before creating a race.
	/// Only available in development mode.
	/// </summary>
    /// <param name="url">The Track Shack URL to parse results from</param>
    /// <param name="division">Optional division to filter results by</param>
    /// <returns>List of parsed results</returns>
    /// <response code="200">Results parsed successfully</response>
    /// <response code="404">Not found (non-development mode)</response>
    /// <response code="400">Bad request (missing URL)</response>
    /// <response code="500">Internal server error</response>
	[HttpPost("preview/results")]
	public async Task<IActionResult> PreviewResults([FromQuery] string url, [FromQuery] string? division = null)
	{
		if (!HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
		{
			return NotFound();
		}

		if (string.IsNullOrWhiteSpace(url))
		{
			return BadRequest(new { error = "URL is required." });
		}

		try
		{
			var results = await _scraperService.ParseDivisionResultsAsync(url, division ?? "");
			return Ok(new
			{
				url,
				division = division ?? "(all)",
				results = results.Select(r => new
				{
					r.BibNumber,
					r.Name,
					r.Age,
					r.OverallPlace,
					r.GenderPlace,
					r.Gender,
					r.DivisionPlace,
					r.ClockTime,
					r.NetTime,
					r.StartTime,
					r.OverallPace,
					r.Split1,
					r.Split2,
					r.Split3,
					r.Split4,
					r.Split5,
					r.Split6,
					r.Split7,
					r.Split8,
					r.Split9,
					r.Split10,
					r.Hometown
				}).ToList(),
				count = results.Count
			});
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error parsing results from {Url}", url);
			return StatusCode(500, new { error = "Failed to parse results: " + ex.Message });
		}
	}

    /// <summary>
    /// Deletes a race and all its associated data.
    /// </summary>
    /// <param name="id">The ID of the race to delete</param>
    /// <response code="204">Race deleted successfully</response>
    /// <response code="401">Unauthorized</response>
    /// <response code="404">Race not found</response>
    /// <response code="500">Internal server error</response>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRace(int id)
    {
        try
        {
            await _raceRepository.DeleteAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting race with ID {RaceId}", id);
            return StatusCode(500, new { error = "Failed to delete race: " + ex.Message });
        }
    }

	/// <summary>
	/// Generates and saves statistical data for the specified race.
	/// When recalculateIndividualResults is true, creates a background job that recalculates
	/// individual result statistics then regenerates statistics.
	/// </summary>
	/// <remarks>When recalculatePasses is false, statistics are generated synchronously.
	/// When true, a background job is created and the job ID is returned for tracking.</remarks>
	/// <param name="raceId">The unique identifier of the race for which to generate statistics.</param>
	/// <param name="recalculateIndividualResults">When true, creates a background job to recalculate pass counts (kills/assassins) and regenerate stats.</param>
	/// <returns>An HTTP 200 response containing statistics or job info; 404 if race not found; 500 on error.</returns>
    [HttpPost("{raceId}/generate-stats")]
    public async Task<IActionResult> GenerateRaceStats(int raceId, [FromQuery] bool recalculateIndividualResults = false)
    {
        try
        {
            var race = await _raceRepository.GetByIdAsync(raceId);
            if (race == null)
            {
                return NotFound(new { error = "Race not found" });
            }

            if (recalculateIndividualResults)
            {
                // Create a background job for pass recalculation + stats regeneration
                var userId = await GetCurrentUserIdAsync();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var job = await _jobRepository.CreateJobForRaceAsync(raceId, userId.Value, JobType.RecalculateStats);
                await _jobQueue.EnqueueAsync(job.Id);

                _logger.LogInformation("Created RecalculateStats job {JobId} for race {RaceId}", job.Id, raceId);
                return Ok(new { jobId = job.Id, message = "Recalculation job created. Pass counts will be recalculated and statistics regenerated in the background." });
            }

            // No pass recalculation - just regenerate stats synchronously
            var stats = await _raceRepository.BuildRaceStats(raceId);
            race.StatisticsJson = stats.ToJson();
            await _raceRepository.UpdateAsync(race);

            _logger.LogInformation("Race statistics generated and saved for race {RaceId}", raceId);
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating race stats for race {RaceId}", raceId);
            return StatusCode(500, new { error = "Failed to generate race stats: " + ex.Message });
        }
    }


    /// <summary>
    /// Upload a new course map image (admin only).
    /// Accepts JPEG, PNG, or WebP. Image is resized to full-size (max 1920px) and thumbnail (300px).
    /// </summary>
    [HttpPost("{raceId}/course-map")]
    [RequestSizeLimit(20 * 1024 * 1024)] // 20 MB max
    public async Task<IActionResult> UploadCourseMap([FromForm] IFormFile image, int raceId)
    {
        try
        {
            var dto = await _courseMapImageService.UploadImageAsync(image, raceId);
            return Ok(dto);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading course map image");
            return StatusCode(500, new { error = "Failed to upload course map image." });
        }
    }

    /// <summary>
    /// Delete a course map image by race ID (admin only).
    /// Removes both the full-size and thumbnail versions.
    /// </summary>
    [HttpDelete("{raceId}/course-map")]
    public async Task<IActionResult> DeleteCourseMapImage(int raceId)
    {
        try
        {
            await _courseMapImageService.DeleteImageAsync(raceId);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (FileNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting course map image {RaceId}", raceId);
            return StatusCode(500, new { error = "Failed to delete course map image." });
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
