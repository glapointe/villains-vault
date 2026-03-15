using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Falchion.Villains.Vault.Api.DTOs;
using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Repositories;

namespace Falchion.Villains.Vault.Api.Controllers.Admin;

/// <summary>
/// Controller for managing background jobs.
/// All endpoints require admin authorization.
/// </summary>
[ApiController]
[ApiExplorerSettings(GroupName = "admin")]
[Route("api/v1.0/admin/jobs")]
[Authorize(Policy = "AdminOnly")]
public class JobsController : ApiControllerBase
{
	private readonly IJobRepository _jobRepository;
	private readonly ILogger<JobsController> _logger;

	public JobsController(
		IJobRepository jobRepository,
		ILogger<JobsController> logger)
	{
		_jobRepository = jobRepository;
		_logger = logger;
	}

	/// <summary>
	/// Gets the status and progress of multiple jobs by their IDs.
	/// Used for polling job progress from the frontend.
	/// </summary>
	[HttpGet]
	public async Task<IActionResult> GetJobs([FromQuery] string? ids = null)
	{
		try
		{
			// If no IDs provided, return recent jobs (paginated)
			if (string.IsNullOrWhiteSpace(ids))
			{
				return BadRequest(new { error = "Use /recent endpoint to get recent jobs." });
			}

			var jobIdList = ids.Split(',', StringSplitOptions.RemoveEmptyEntries)
				.Select(id => int.TryParse(id, out var parsed) ? parsed : -1)
				.Where(id => id > 0)
				.ToList();

			if (!jobIdList.Any())
			{
				return BadRequest(new { error = "No valid job IDs provided." });
			}

			var jobs = await _jobRepository.GetByIdsAsync(jobIdList);

			return Ok(jobs.Select(JobDto.FromEntity).ToList());
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error retrieving jobs");
			return StatusCode(500, new { error = "Failed to retrieve jobs: " + ex.Message });
		}
	}

	/// <summary>
	/// Gets recent jobs ordered by creation date descending (newest first).
	/// Supports pagination for loading more jobs.
	/// </summary>
	/// <param name="page">Page number (1-based, default: 1)</param>
	/// <param name="pageSize">Number of jobs per page (default: 5, max: 50)</param>
	[HttpGet("recent")]
	public async Task<IActionResult> GetRecentJobs([FromQuery] int page = 1, [FromQuery] int pageSize = 5)
	{
		try
		{
			// Validate and constrain parameters
			page = Math.Max(1, page);
			pageSize = Math.Clamp(pageSize, 1, 50);

			var jobs = await _jobRepository.GetRecentJobsAsync(page, pageSize);

			return Ok(jobs.Select(JobDto.FromEntity).ToList());
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error retrieving recent jobs");
			return StatusCode(500, new { error = "Failed to retrieve recent jobs: " + ex.Message });
		}
	}

	/// <summary>
	/// Requests cancellation of a running job.
	/// The background service will check this flag and stop processing.
	/// </summary>
	[HttpPut("{id}/cancel")]
	public async Task<IActionResult> CancelJob(int id)
	{
		try
		{
			var job = await _jobRepository.GetByIdAsync(id);
			if (job == null)
			{
				return NotFound(new { error = "Job not found." });
			}

			if (job.Status == JobStatus.Completed || job.Status == JobStatus.Failed || job.Status == JobStatus.Cancelled)
			{
				return BadRequest(new { error = "Job has already completed and cannot be cancelled." });
			}

			await _jobRepository.SetCancellationRequestedAsync(id);

			return Ok(new { message = "Cancellation requested." });
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error cancelling job {JobId}", id);
			return StatusCode(500, new { error = "Failed to cancel job: " + ex.Message });
		}
	}
}
