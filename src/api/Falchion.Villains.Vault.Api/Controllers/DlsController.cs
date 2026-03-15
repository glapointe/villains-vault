/**
 * DLS Declarations Controller (Public)
 * 
 * Public endpoints for DLS race declarations.
 * Authenticated users can view upcoming DLS races, self-declare,
 * update their declarations, and retrieve DLS result IDs for charts.
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Falchion.Villains.Vault.Api.DTOs;
using Falchion.Villains.Vault.Api.Services;

namespace Falchion.Villains.Vault.Api.Controllers;

/// <summary>
/// Controller for public DLS declaration endpoints
/// </summary>
[ApiController]
[ApiExplorerSettings(GroupName = "public")]
[Route("api/v1.0/dls")]
[Authorize]
public class DlsController : ApiControllerBase
{
	private readonly DlsDeclarationService _dlsService;
	private readonly UserService _userService;
	private readonly ILogger<DlsController> _logger;

	public DlsController(
		DlsDeclarationService dlsService,
		UserService userService,
		ILogger<DlsController> logger)
	{
		_dlsService = dlsService;
		_userService = userService;
		_logger = logger;
	}

	/// <summary>
	/// Get all upcoming DLS races with declaration counts
	/// </summary>
	/// <returns>List of upcoming DLS races</returns>
	[HttpGet("races")]
	[AllowAnonymous]
	public async Task<IActionResult> GetUpcomingRaces()
	{
		try
		{
			var races = await _dlsService.GetDlsRacesAsync(upcomingOnly: true);
			return Ok(races);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error getting upcoming DLS races");
			return StatusCode(500, new { error = "Failed to get DLS races" });
		}
	}

	/// <summary>
	/// Get declarations for a specific DLS race
	/// </summary>
	/// <param name="dlsRaceId">DLS race ID</param>
	/// <returns>List of declarations</returns>
	[HttpGet("races/{dlsRaceId}/declarations")]
	[AllowAnonymous]
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
	/// Self-declare for a DLS race (authenticated users)
	/// </summary>
	/// <param name="request">DLS race ID and optional bib number</param>
	/// <returns>Created declaration</returns>
	[HttpPost("declare")]
	public async Task<IActionResult> SelfDeclare([FromBody] CreateDlsDeclarationRequest request)
	{
		try
		{
			var user = await GetCurrentUserAsync();
			if (user == null)
				return Unauthorized(new { error = "User not found" });

			var declaration = await _dlsService.SelfDeclareAsync(request.DlsRaceId, user.Id, request.BibNumber, request.IsFirstDls, request.IsGoingForKills, request.Comments);
			return CreatedAtAction(nameof(GetMyDeclarations), declaration);
		}
		catch (InvalidOperationException ex)
		{
			return Conflict(new { error = ex.Message });
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error self-declaring for DLS race {DlsRaceId}", request.DlsRaceId);
			return StatusCode(500, new { error = "Failed to create declaration" });
		}
	}

	/// <summary>
	/// Get the current user's declarations for multiple DLS races.
	/// Accepts a comma-separated list of DLS race IDs and returns an array
	/// of the user's declarations (empty array if none).
	/// </summary>
	/// <param name="ids">Comma-separated DLS race IDs</param>
	/// <returns>Array of the user's declarations</returns>
	[HttpGet("my-declarations")]
	public async Task<IActionResult> GetMyDeclarations([FromQuery] string ids)
	{
		try
		{
			var user = await GetCurrentUserAsync();
			if (user == null)
				return Unauthorized(new { error = "User not found" });

			var dlsRaceIds = (ids ?? "")
				.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
				.Select(s => int.TryParse(s, out var v) ? v : (int?)null)
				.Where(v => v.HasValue)
				.Select(v => v!.Value)
				.Distinct()
				.ToList();

			if (dlsRaceIds.Count == 0)
				return Ok(Array.Empty<DlsDeclarationDto>());

			var declarations = await _dlsService.GetMyDeclarationsAsync(dlsRaceIds, user.Id);
			return Ok(declarations);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error getting user declarations for DLS races");
			return StatusCode(500, new { error = "Failed to get declarations" });
		}
	}

	/// <summary>
	/// Update the current user's declaration (e.g. add/change bib number)
	/// </summary>
	/// <param name="declarationId">Declaration ID</param>
	/// <param name="request">Updated bib number</param>
	/// <returns>Updated declaration</returns>
	[HttpPut("declarations/{declarationId}")]
	public async Task<IActionResult> UpdateMyDeclaration(int declarationId, [FromBody] UpdateDlsDeclarationRequest request)
	{
		try
		{
			var user = await GetCurrentUserAsync();
			if (user == null)
				return Unauthorized(new { error = "User not found" });

			var result = await _dlsService.UpdateDeclarationAsync(declarationId, user.Id, request);
			if (result == null) return NotFound(new { error = "Declaration not found" });
			return Ok(result);
		}
		catch (UnauthorizedAccessException ex)
		{
			return Forbid(ex.Message);
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
    /// Delete the current user's declaration
    /// </summary>
    /// <param name="declarationId">Declaration ID</param>
    /// <returns>No content on success</returns>
    [HttpDelete("declarations/{declarationId}")]
	public async Task<IActionResult> DeleteMyDeclaration(int declarationId)
	{
		try
		{
			var user = await GetCurrentUserAsync();
			if (user == null)
				return Unauthorized(new { error = "User not found" });

			var deleted = await _dlsService.DeleteDeclarationAsync(declarationId, user.Id, isAdmin: false);
			if (!deleted) return NotFound(new { error = "Declaration not found" });
			return NoContent();
		}
		catch (UnauthorizedAccessException)
		{
			return Forbid();
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error deleting declaration {DeclarationId}", declarationId);
			return StatusCode(500, new { error = "Failed to delete declaration" });
		}
	}

	/// <summary>
	/// Get DLS result IDs for a race (for kill chart highlighting).
	/// Returns race result IDs associated with DLS declarations.
	/// </summary>
	/// <param name="raceId">The actual race ID (not DLS race ID)</param>
	/// <returns>List of race result IDs</returns>
	[HttpGet("result-ids/{raceId}")]
	[AllowAnonymous]
	public async Task<IActionResult> GetDlsResultIds(int raceId)
	{
		try
		{
			var resultIds = await _dlsService.GetDlsResultIdsForRaceAsync(raceId);
			return Ok(resultIds);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error getting DLS result IDs for race {RaceId}", raceId);
			return StatusCode(500, new { error = "Failed to get DLS result IDs" });
		}
	}

	// --- Helpers ---

	private async Task<Data.Entities.User?> GetCurrentUserAsync()
	{
		var subjectId = GetSubjectId();
		if (string.IsNullOrEmpty(subjectId))
		{
			_logger.LogWarning("No subject claim found in JWT token");
			return null;
		}

		var email = GetCurrentUserEmail();
		if (string.IsNullOrEmpty(email))
		{
			_logger.LogWarning("No email claim found in JWT token");
			return null;
		}

		return await _userService.GetOrCreateUserAsync(subjectId, email);
	}
}
