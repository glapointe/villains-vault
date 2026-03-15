/**
 * Users Controller
 * 
 * API endpoints for user management.
 * Handles user profile retrieval and auto-creation on first authentication.
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Falchion.Villains.Vault.Api.DTOs;
using Falchion.Villains.Vault.Api.Repositories;
using Falchion.Villains.Vault.Api.Services;

namespace Falchion.Villains.Vault.Api.Controllers;

/// <summary>
/// Controller for user-related endpoints
/// </summary>
[ApiController]
[ApiExplorerSettings(GroupName = "public")]
[Route("api/v1.0/users")]
[Authorize]
public class UsersController : ApiControllerBase
{
	private readonly UserService _userService;
	private readonly IPushTokenRepository _pushTokenRepository;
	private readonly INotificationPreferenceRepository _notificationPreferenceRepository;
	private readonly ILogger<UsersController> _logger;

	/// <summary>
	/// Constructor with dependency injection
	/// </summary>
	public UsersController(
		UserService userService,
		IPushTokenRepository pushTokenRepository,
		INotificationPreferenceRepository notificationPreferenceRepository,
		ILogger<UsersController> logger)
	{
		_userService = userService;
		_pushTokenRepository = pushTokenRepository;
		_notificationPreferenceRepository = notificationPreferenceRepository;
		_logger = logger;
	}

	/// <summary>
	/// Get current authenticated user's profile
	/// Auto-creates user on first authentication (first user becomes admin)
	/// </summary>
	/// <returns>User profile</returns>
	[HttpGet("me")]
	public async Task<IActionResult> GetCurrentUser()
	{
		try
		{
			var subjectId = GetSubjectId();
			var email = GetCurrentUserEmail();
			var displayName = GetCurrentUserDisplayName();

			if (string.IsNullOrEmpty(subjectId))
			{
				_logger.LogWarning("No subject claim found in JWT token");
				return Unauthorized(new { error = "Invalid token: missing subject claim" });
			}

			if (string.IsNullOrEmpty(email))
			{
				_logger.LogWarning("No email claim found in JWT token for user: {SubjectId}", subjectId);
				return BadRequest(new { error = "Email is required" });
			}

			// Get or create user (first user becomes admin automatically)
			var user = await _userService.GetOrCreateUserAsync(subjectId, email, displayName);

			// Return user profile
			var profile = new UserProfileDto
			{
				Id = user.Id.ToString(),
				Email = user.Email,
				DisplayName = user.DisplayName,
				IsAdmin = user.IsAdmin,
				CreatedAt = user.CreatedAt
			};

			return Ok(profile);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error getting current user profile");
			return StatusCode(500, new { error = "Internal server error" });
		}
	}

	/// <summary>
	/// Update current authenticated user's own profile (non-admin)
	/// Only allows updating display name — email can only be changed by an admin
	/// </summary>
	[HttpPut("me")]
	public async Task<IActionResult> UpdateOwnProfile([FromBody] UpdateOwnProfileRequest request)
	{
		try
		{
			var subjectId = GetSubjectId();

			if (string.IsNullOrEmpty(subjectId))
			{
				return Unauthorized(new { error = "Invalid token: missing subject claim" });
			}

			var user = await _userService.UpdateOwnProfileAsync(subjectId, request.DisplayName);
			if (user == null)
			{
				return NotFound(new { error = "User not found" });
			}

			var profile = new UserProfileDto
			{
				Id = user.Id.ToString(),
				Email = user.Email,
				DisplayName = user.DisplayName,
				IsAdmin = user.IsAdmin,
				CreatedAt = user.CreatedAt
			};

			return Ok(profile);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error updating own profile");
			return StatusCode(500, new { error = "Internal server error" });
		}
	}

	/// <summary>
	/// Delete the current authenticated user's own account.
	/// Admin accounts cannot be self-deleted to prevent lockout.
	/// </summary>
	[HttpDelete("me")]
	public async Task<IActionResult> DeleteOwnAccount()
	{
		try
		{
			var subjectId = GetSubjectId();

			if (string.IsNullOrEmpty(subjectId))
			{
				return Unauthorized(new { error = "Invalid token: missing subject claim" });
			}

			var result = await _userService.DeleteOwnAccountAsync(subjectId);

			if (result == null)
			{
				return NotFound(new { error = "User not found" });
			}

			if (result == false)
			{
				return BadRequest(new { error = "Admin accounts cannot be self-deleted. Contact another administrator." });
			}

			return Ok(new { message = "Account deleted successfully" });
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error deleting own account");
			return StatusCode(500, new { error = "Internal server error" });
		}
	}

	// ── Push Token Management ───────────────────────────────────────────

	/// <summary>
	/// Register a push notification token for the current device.
	/// Creates notification preferences with defaults if they don't exist.
	/// </summary>
	[HttpPost("me/push-tokens")]
	public async Task<IActionResult> RegisterPushToken([FromBody] RegisterPushTokenRequest request)
	{
		try
		{
			var subjectId = GetSubjectId();
			if (string.IsNullOrEmpty(subjectId))
				return Unauthorized(new { error = "Invalid token: missing subject claim" });

			var user = await _userService.GetUserBySubjectIdAsync(subjectId);
			if (user == null)
				return NotFound(new { error = "User not found" });

			var platform = request.Platform.ToLowerInvariant();
			if (platform != "ios" && platform != "android")
				return BadRequest(new { error = "Platform must be 'ios' or 'android'" });

			await _pushTokenRepository.UpsertTokenAsync(user.Id, request.Token, platform);

			// Ensure notification preferences exist (creates defaults if missing)
			await _notificationPreferenceRepository.GetOrCreateAsync(user.Id);

			_logger.LogInformation("Push token registered for user {UserId} on {Platform}", user.Id, platform);
			return Ok(new { message = "Push token registered" });
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error registering push token");
			return StatusCode(500, new { error = "Internal server error" });
		}
	}

	/// <summary>
	/// Unregister a push notification token (e.g., on logout)
	/// </summary>
	[HttpDelete("me/push-tokens")]
	public async Task<IActionResult> UnregisterPushToken([FromBody] UnregisterPushTokenRequest request)
	{
		try
		{
			var subjectId = GetSubjectId();
			if (string.IsNullOrEmpty(subjectId))
				return Unauthorized(new { error = "Invalid token: missing subject claim" });

			var removed = await _pushTokenRepository.RemoveTokenAsync(request.Token);

			_logger.LogInformation("Push token unregistered: {Removed}", removed);
			return Ok(new { message = "Push token unregistered" });
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error unregistering push token");
			return StatusCode(500, new { error = "Internal server error" });
		}
	}

	// ── Notification Preferences ────────────────────────────────────────

	/// <summary>
	/// Get the current user's notification preferences
	/// </summary>
	[HttpGet("me/notifications/preferences")]
	public async Task<IActionResult> GetNotificationPreferences()
	{
		try
		{
			var subjectId = GetSubjectId();
			if (string.IsNullOrEmpty(subjectId))
				return Unauthorized(new { error = "Invalid token: missing subject claim" });

			var user = await _userService.GetUserBySubjectIdAsync(subjectId);
			if (user == null)
				return NotFound(new { error = "User not found" });

			var prefs = await _notificationPreferenceRepository.GetOrCreateAsync(user.Id);
			return Ok(NotificationPreferenceDto.FromEntity(prefs));
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error getting notification preferences");
			return StatusCode(500, new { error = "Internal server error" });
		}
	}

	/// <summary>
	/// Update the current user's notification preferences
	/// </summary>
	[HttpPut("me/notifications/preferences")]
	public async Task<IActionResult> UpdateNotificationPreferences([FromBody] UpdateNotificationPreferenceRequest request)
	{
		try
		{
			var subjectId = GetSubjectId();
			if (string.IsNullOrEmpty(subjectId))
				return Unauthorized(new { error = "Invalid token: missing subject claim" });

			var user = await _userService.GetUserBySubjectIdAsync(subjectId);
			if (user == null)
				return NotFound(new { error = "User not found" });

			var prefs = await _notificationPreferenceRepository.GetOrCreateAsync(user.Id);
			prefs.RaceResults = request.RaceResults;
			prefs.DlsDeclarations = request.DlsDeclarations;
			prefs.CommunityEvents = request.CommunityEvents;

			await _notificationPreferenceRepository.UpdateAsync(prefs);

			_logger.LogInformation("Notification preferences updated for user {UserId}", user.Id);
			return Ok(NotificationPreferenceDto.FromEntity(prefs));
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error updating notification preferences");
			return StatusCode(500, new { error = "Internal server error" });
		}
	}
}
