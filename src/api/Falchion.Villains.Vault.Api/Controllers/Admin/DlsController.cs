/**
 * Admin DLS Controller
 * 
 * Admin endpoints for managing DLS races and declarations.
 * Handles CRUD operations for DLS races, bib number management,
 * and post-scrape declaration processing.
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Falchion.Villains.Vault.Api.DTOs;
using Falchion.Villains.Vault.Api.Repositories;
using Falchion.Villains.Vault.Api.Services;

namespace Falchion.Villains.Vault.Api.Controllers.Admin;

/// <summary>
/// Admin controller for DLS race and declaration management
/// </summary>
[ApiController]
[ApiExplorerSettings(GroupName = "admin")]
[Route("api/v1.0/admin/dls")]
[Authorize(Policy = "AdminOnly")]
public class DlsController : ApiControllerBase
{
	private readonly DlsDeclarationService _dlsService;
	private readonly IUserRepository _userRepository;
	private readonly ILogger<DlsController> _logger;

	public DlsController(
		DlsDeclarationService dlsService,
		IUserRepository userRepository,
		ILogger<DlsController> logger)
	{
		_dlsService = dlsService;
		_userRepository = userRepository;
		_logger = logger;
	}

	// --- DLS Races ---

	/// <summary>
	/// Get all DLS races (including past races when upcomingOnly=false)
	/// </summary>
	/// <param name="upcomingOnly">If true, only return upcoming races (default true)</param>
	/// <returns>List of DLS races with declaration counts</returns>
	[HttpGet("races")]
	public async Task<IActionResult> GetDlsRaces([FromQuery] bool upcomingOnly = true)
	{
		try
		{
			var races = await _dlsService.GetDlsRacesAsync(upcomingOnly);
			return Ok(races);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error getting DLS races");
			return StatusCode(500, new { error = "Failed to get DLS races" });
		}
	}

	/// <summary>
	/// Create a new DLS race with optional initial bib numbers
	/// </summary>
	/// <param name="request">Race name, date, and optional comma-separated bib numbers</param>
	/// <returns>Created DLS race</returns>
	[HttpPost("races")]
	public async Task<IActionResult> CreateDlsRace([FromBody] CreateDlsRaceRequest request)
	{
		try
		{
			var userId = await GetCurrentUserIdAsync();
			if (userId == null)
				return Unauthorized(new { error = "User not found" });

			var race = await _dlsService.CreateDlsRaceAsync(request, userId.Value);
			return CreatedAtAction(nameof(GetDlsRaces), new { }, race);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error creating DLS race");
			return StatusCode(500, new { error = "Failed to create DLS race" });
		}
	}

	/// <summary>
	/// Update a DLS race
	/// </summary>
	/// <param name="id">DLS race ID</param>
	/// <param name="request">Updated name and/or date</param>
	/// <returns>Updated DLS race</returns>
	[HttpPut("races/{id}")]
	public async Task<IActionResult> UpdateDlsRace(int id, [FromBody] UpdateDlsRaceRequest request)
	{
		try
		{
			var result = await _dlsService.UpdateDlsRaceAsync(id, request);
			if (result == null) return NotFound(new { error = "DLS race not found" });
			return Ok(result);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error updating DLS race {DlsRaceId}", id);
			return StatusCode(500, new { error = "Failed to update DLS race" });
		}
	}

	/// <summary>
	/// Delete a DLS race and all its declarations
	/// </summary>
	/// <param name="id">DLS race ID</param>
	/// <returns>No content on success</returns>
	[HttpDelete("races/{id}")]
	public async Task<IActionResult> DeleteDlsRace(int id)
	{
		try
		{
			var deleted = await _dlsService.DeleteDlsRaceAsync(id);
			if (!deleted) return NotFound(new { error = "DLS race not found" });
			return NoContent();
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error deleting DLS race {DlsRaceId}", id);
			return StatusCode(500, new { error = "Failed to delete DLS race" });
		}
	}

	// --- Declarations ---

	/// <summary>
	/// Get all declarations for a DLS race
	/// </summary>
	/// <param name="dlsRaceId">DLS race ID</param>
	/// <returns>List of declarations with user info</returns>
	[HttpGet("races/{dlsRaceId}/declarations")]
	public async Task<IActionResult> GetDeclarations(int dlsRaceId)
	{
		try
		{
			var declarations = await _dlsService.GetDeclarationsAsync(dlsRaceId);
			return Ok(declarations);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error getting declarations for DLS race {DlsRaceId}", dlsRaceId);
			return StatusCode(500, new { error = "Failed to get declarations" });
		}
	}

	/// <summary>
	/// Update any declaration (admin override)
	/// </summary>
	/// <param name="declarationId">Declaration ID</param>
	/// <param name="request">Updated bib number</param>
	/// <returns>Updated declaration</returns>
	[HttpPut("declarations/{declarationId}")]
	public async Task<IActionResult> UpdateDeclaration(int declarationId, [FromBody] UpdateDlsDeclarationRequest request)
	{
		try
		{
			var result = await _dlsService.AdminUpdateDeclarationAsync(declarationId, request);
			if (result == null) return NotFound(new { error = "Declaration not found" });
			return Ok(result);
		}
		catch (InvalidOperationException ex)
		{
			return Conflict(new { error = ex.Message });
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error updating declaration {DeclarationId}", declarationId);
			return StatusCode(500, new { error = "Failed to update declaration" });
		}
	}

	/// <summary>
	/// Imports a collection of DLS declarations for the specified race.
	/// </summary>
	/// <remarks>This endpoint processes multiple declaration imports in a single request. If an error occurs during
	/// import, a generic error message is returned and the details are logged.</remarks>
	/// <param name="dlsRaceId">The unique identifier of the DLS race for which declarations are to be imported.</param>
	/// <param name="request">A list of declaration requests to import. Cannot be null or empty.</param>
	/// <returns>An <see cref="IActionResult"/> containing the result of the import operation. Returns a 200 OK response with the
	/// import result if successful; otherwise, returns a 500 Internal Server Error with an error message.</returns>
	[HttpPost("declarations/import/{dlsRaceId}")]
	public async Task<IActionResult> ImportDeclarationsAsync(int dlsRaceId, [FromBody] List<ImportDlsDeclarationRequest> request)
	{
		try
		{
			var result = await _dlsService.ImportDeclarationsAsync(dlsRaceId, request);
			return Ok(result);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error importing declarations for {DlsRaceId}", dlsRaceId);
			return StatusCode(500, new { error = "Failed to import declarations" });
		}
	}

	/// <summary>
	/// Delete any declaration (admin override)
	/// </summary>
	/// <param name="declarationId">Declaration ID</param>
	/// <returns>No content on success</returns>
	[HttpDelete("declarations/{declarationId}")]
	public async Task<IActionResult> DeleteDeclaration(int declarationId)
	{
		try
		{
			var userId = await GetCurrentUserIdAsync();
			if (userId == null) return Unauthorized(new { error = "User not found" });

			var deleted = await _dlsService.DeleteDeclarationAsync(declarationId, userId.Value, isAdmin: true);
			if (!deleted) return NotFound(new { error = "Declaration not found" });
			return NoContent();
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error deleting declaration {DeclarationId}", declarationId);
			return StatusCode(500, new { error = "Failed to delete declaration" });
		}
	}

	/// <summary>
	/// Process DLS declarations after a race has been scraped.
	/// Matches declarations to actual race results and creates follow entries.
	/// </summary>
	/// <param name="dlsRaceId">DLS race ID</param>
	/// <param name="raceId">Actual scraped race ID</param>
	/// <returns>Number of follow claims created</returns>
	[HttpPost("races/{dlsRaceId}/process/{raceId}")]
	public async Task<IActionResult> ProcessDeclarations(int dlsRaceId, int raceId)
	{
		try
		{
			var claimsCreated = await _dlsService.ProcessDeclarationsAfterScrapeAsync(dlsRaceId, raceId);
			return Ok(new { claimsCreated });
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error processing declarations for DLS race {DlsRaceId} → race {RaceId}", dlsRaceId, raceId);
			return StatusCode(500, new { error = "Failed to process declarations" });
		}
	}

	// --- Helpers ---

	private async Task<int?> GetCurrentUserIdAsync()
	{
		var subjectId = GetSubjectId();
		if (string.IsNullOrEmpty(subjectId)) return null;

		var user = await _userRepository.GetBySubjectIdAsync(subjectId);
		return user?.Id;
	}
}
