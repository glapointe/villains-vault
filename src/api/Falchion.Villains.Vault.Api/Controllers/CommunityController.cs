/**
 * Community Events Controller
 * 
 * Public API endpoints for community events, races, and participations.
 * Any authenticated user can create events; only creators and admins can edit/delete.
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Falchion.Villains.Vault.Api.DTOs.Community;
using Falchion.Villains.Vault.Api.Services;

namespace Falchion.Villains.Vault.Api.Controllers;

/// <summary>
/// Controller for community event management
/// </summary>
[ApiController]
[ApiExplorerSettings(GroupName = "public")]
[Route("api/v1.0/community")]
[Authorize]
public class CommunityController : ApiControllerBase
{
	private readonly CommunityEventService _service;
	private readonly UserService _userService;
	private readonly ILogger<CommunityController> _logger;

	/// <summary>
	/// Constructor
	/// </summary>
	public CommunityController(
		CommunityEventService service,
		UserService userService,
		ILogger<CommunityController> logger)
	{
		_service = service;
		_userService = userService;
		_logger = logger;
	}

	// ── Event endpoints ──

	/// <summary>
	/// Get paged community events with optional filters
	/// </summary>
	[HttpGet("events")]
	[AllowAnonymous]
	public async Task<IActionResult> GetEvents(
		[FromQuery] int page = 1,
		[FromQuery] int pageSize = 20,
		[FromQuery] int? year = null,
		[FromQuery] string? name = null,
		[FromQuery] string? location = null,
		[FromQuery] bool includePast = false)
	{
		try
		{
			// Pass current user ID (if authenticated) to populate IsCurrentUserGoing
			int? currentUserId = null;
			var currentUser = await GetCurrentUserAsync();
			if (currentUser != null)
			{
				currentUserId = currentUser.Id;
			}

			var result = await _service.GetEventsPagedAsync(page, pageSize, year, name, location, includePast, currentUserId);
			return Ok(result);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error retrieving community events");
			return StatusCode(500, new { error = "Failed to retrieve community events." });
		}
	}

	/// <summary>
	/// Get upcoming community events for the home sidebar
	/// </summary>
	[HttpGet("events/upcoming")]
	[AllowAnonymous]
	public async Task<IActionResult> GetUpcomingEvents([FromQuery] int count = 10)
	{
		try
		{
			// Pass current user ID (if authenticated) to populate IsCurrentUserGoing
			int? currentUserId = null;
			var currentUser = await GetCurrentUserAsync();
			if (currentUser != null)
			{
				currentUserId = currentUser.Id;
			}

			var events = await _service.GetUpcomingEventsAsync(count, currentUserId);
			return Ok(events);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error retrieving upcoming community events");
			return StatusCode(500, new { error = "Failed to retrieve upcoming community events." });
		}
	}

	/// <summary>
	/// Get a single community event by ID
	/// </summary>
	[HttpGet("events/{id}")]
	[AllowAnonymous]
	public async Task<IActionResult> GetEvent(int id)
	{
		try
		{
			var result = await _service.GetEventByIdAsync(id);
			if (result == null)
				return NotFound(new { error = "Event not found." });

			return Ok(result);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error retrieving community event {EventId}", id);
			return StatusCode(500, new { error = "Failed to retrieve community event." });
		}
	}

	/// <summary>
	/// Get distinct years that have community events (for filter dropdown)
	/// </summary>
	[HttpGet("events/years")]
	[AllowAnonymous]
	public async Task<IActionResult> GetAvailableYears()
	{
		try
		{
			var years = await _service.GetAvailableYearsAsync();
			return Ok(years);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error retrieving available years");
			return StatusCode(500, new { error = "Failed to retrieve available years." });
		}
	}

	/// <summary>
	/// Create a new community event with races
	/// </summary>
	[HttpPost("events")]
	public async Task<IActionResult> CreateEvent([FromBody] CreateCommunityEventRequest request)
	{
		try
		{
			var user = await GetCurrentUserAsync();
			if (user == null)
				return Unauthorized(new { error = "User not found." });

			var result = await _service.CreateEventAsync(request, user.Id);
			return CreatedAtAction(nameof(GetEvent), new { id = result.Id }, result);
		}
		catch (InvalidOperationException ex)
		{
			return BadRequest(new { error = ex.Message });
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error creating community event");
			return StatusCode(500, new { error = "Failed to create community event." });
		}
	}

	/// <summary>
	/// Update a community event (owner or admin only)
	/// </summary>
	[HttpPut("events/{id}")]
	public async Task<IActionResult> UpdateEvent(int id, [FromBody] UpdateCommunityEventRequest request)
	{
		try
		{
			var user = await GetCurrentUserAsync();
			if (user == null)
				return Unauthorized(new { error = "User not found." });

			var result = await _service.UpdateEventAsync(id, request, user.Id, user.IsAdmin);
			return Ok(result);
		}
		catch (InvalidOperationException ex)
		{
			return BadRequest(new { error = ex.Message });
		}
		catch (UnauthorizedAccessException ex)
		{
			return StatusCode(403, new { error = ex.Message });
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error updating community event {EventId}", id);
			return StatusCode(500, new { error = "Failed to update community event." });
		}
	}

	/// <summary>
	/// Delete a community event (owner or admin only)
	/// </summary>
	[HttpDelete("events/{id}")]
	public async Task<IActionResult> DeleteEvent(int id)
	{
		try
		{
			var user = await GetCurrentUserAsync();
			if (user == null)
				return Unauthorized(new { error = "User not found." });

			await _service.DeleteEventAsync(id, user.Id, user.IsAdmin);
			return NoContent();
		}
		catch (InvalidOperationException ex)
		{
			return BadRequest(new { error = ex.Message });
		}
		catch (UnauthorizedAccessException ex)
		{
			return StatusCode(403, new { error = ex.Message });
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error deleting community event {EventId}", id);
			return StatusCode(500, new { error = "Failed to delete community event." });
		}
	}

	// ── Race endpoints ──

	/// <summary>
	/// Add a race to an existing event (owner or admin only)
	/// </summary>
	[HttpPost("events/{eventId}/races")]
	public async Task<IActionResult> AddRace(int eventId, [FromBody] CreateCommunityRaceRequest request)
	{
		try
		{
			var user = await GetCurrentUserAsync();
			if (user == null)
				return Unauthorized(new { error = "User not found." });

			var result = await _service.AddRaceAsync(eventId, request, user.Id, user.IsAdmin);
			return Ok(result);
		}
		catch (InvalidOperationException ex)
		{
			return BadRequest(new { error = ex.Message });
		}
		catch (UnauthorizedAccessException ex)
		{
			return StatusCode(403, new { error = ex.Message });
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error adding race to community event {EventId}", eventId);
			return StatusCode(500, new { error = "Failed to add race." });
		}
	}

	/// <summary>
	/// Update a community race (event owner or admin only)
	/// </summary>
	[HttpPut("races/{raceId}")]
	public async Task<IActionResult> UpdateRace(int raceId, [FromBody] UpdateCommunityRaceRequest request)
	{
		try
		{
			var user = await GetCurrentUserAsync();
			if (user == null)
				return Unauthorized(new { error = "User not found." });

			var result = await _service.UpdateRaceAsync(raceId, request, user.Id, user.IsAdmin);
			return Ok(result);
		}
		catch (InvalidOperationException ex)
		{
			return BadRequest(new { error = ex.Message });
		}
		catch (UnauthorizedAccessException ex)
		{
			return StatusCode(403, new { error = ex.Message });
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error updating community race {RaceId}", raceId);
			return StatusCode(500, new { error = "Failed to update race." });
		}
	}

	/// <summary>
	/// Delete a community race (event owner or admin only)
	/// </summary>
	[HttpDelete("races/{raceId}")]
	public async Task<IActionResult> DeleteRace(int raceId)
	{
		try
		{
			var user = await GetCurrentUserAsync();
			if (user == null)
				return Unauthorized(new { error = "User not found." });

			await _service.DeleteRaceAsync(raceId, user.Id, user.IsAdmin);
			return NoContent();
		}
		catch (InvalidOperationException ex)
		{
			return BadRequest(new { error = ex.Message });
		}
		catch (UnauthorizedAccessException ex)
		{
			return StatusCode(403, new { error = ex.Message });
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error deleting community race {RaceId}", raceId);
			return StatusCode(500, new { error = "Failed to delete race." });
		}
	}

	// ── Participation endpoints ──

	/// <summary>
	/// Get all participants for an event
	/// </summary>
	[HttpGet("events/{eventId}/participants")]
	[AllowAnonymous]
	public async Task<IActionResult> GetParticipants(int eventId)
	{
		try
		{
			var result = await _service.GetParticipantsForEventAsync(eventId);
			return Ok(result);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error retrieving participants for event {EventId}", eventId);
			return StatusCode(500, new { error = "Failed to retrieve participants." });
		}
	}

	/// <summary>
	/// Get current user's participations for an event
	/// </summary>
	[HttpGet("events/{eventId}/my-participation")]
	public async Task<IActionResult> GetMyParticipation(int eventId)
	{
		try
		{
			var user = await GetCurrentUserAsync();
			if (user == null)
				return Unauthorized(new { error = "User not found." });

			var result = await _service.GetMyParticipationsAsync(eventId, user.Id);
			return Ok(result);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error retrieving participation for event {EventId}", eventId);
			return StatusCode(500, new { error = "Failed to retrieve participation." });
		}
	}

	/// <summary>
	/// Save participation for the current user on an event (batch upsert)
	/// </summary>
	[HttpPost("events/{eventId}/participate")]
	public async Task<IActionResult> SaveParticipation(int eventId, [FromBody] SaveCommunityParticipationRequest request)
	{
		try
		{
			var user = await GetCurrentUserAsync();
			if (user == null)
				return Unauthorized(new { error = "User not found." });

			var result = await _service.SaveParticipationsAsync(eventId, request, user.Id);
			return Ok(result);
		}
		catch (InvalidOperationException ex)
		{
			return BadRequest(new { error = ex.Message });
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error saving participation for event {EventId}", eventId);
			return StatusCode(500, new { error = "Failed to save participation." });
		}
	}

	/// <summary>
	/// Withdraw all participation for the current user on an event
	/// </summary>
	[HttpDelete("events/{eventId}/participate")]
	public async Task<IActionResult> WithdrawParticipation(int eventId)
	{
		try
		{
			var user = await GetCurrentUserAsync();
			if (user == null)
				return Unauthorized(new { error = "User not found." });

			await _service.WithdrawParticipationAsync(eventId, user.Id);
			return NoContent();
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error withdrawing participation for event {EventId}", eventId);
			return StatusCode(500, new { error = "Failed to withdraw participation." });
		}
	}

	// ── Helpers ──

	/// <summary>
	/// Get the current authenticated user from the JWT token
	/// </summary>
	private async Task<Data.Entities.User?> GetCurrentUserAsync()
	{
		var subjectId = GetSubjectId();
		if (string.IsNullOrEmpty(subjectId)) return null;

		var email = GetCurrentUserEmail();
		if (string.IsNullOrEmpty(email)) return null;

		return await _userService.GetOrCreateUserAsync(subjectId, email);
	}
}
