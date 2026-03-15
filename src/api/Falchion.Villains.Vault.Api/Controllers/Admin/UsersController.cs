/**
 * Admin Users Controller
 * 
 * API endpoints for admin user management.
 * All endpoints require admin authorization.
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Falchion.Villains.Vault.Api.DTOs;
using Falchion.Villains.Vault.Api.Services;

namespace Falchion.Villains.Vault.Api.Controllers.Admin;

/// <summary>
/// Controller for admin user management endpoints
/// </summary>
[ApiController]
[ApiExplorerSettings(GroupName = "admin")]
[Route("api/v1.0/admin/users")]
[Authorize(Policy = "AdminOnly")]
public class UsersController : ApiControllerBase
{
	private readonly UserService _userService;
	private readonly ILogger<UsersController> _logger;

	public UsersController(UserService userService, ILogger<UsersController> logger)
	{
		_userService = userService;
		_logger = logger;
	}

	/// <summary>
	/// Get paged list of all users
	/// </summary>
	[HttpGet]
	public async Task<IActionResult> GetUsers(
		[FromQuery] int page = 1,
		[FromQuery] int pageSize = 25,
		[FromQuery] string? search = null,
		[FromQuery] string? sortBy = null,
		[FromQuery] string? sortDirection = null)
	{
		try
		{
			var (items, totalCount) = await _userService.GetPagedUsersAsync(page, pageSize, search, sortBy, sortDirection);
			var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

			var result = new PagedResultsDto<UserProfileDto>
			{
				Items = items.Select(u => new UserProfileDto
				{
					Id = u.Id.ToString(),
					Email = u.Email,
					DisplayName = u.DisplayName,
					IsAdmin = u.IsAdmin,
					CreatedAt = u.CreatedAt,
					SubjectId = u.SubjectId
				}).ToList(),
				Page = page,
				PageSize = pageSize,
				TotalCount = totalCount,
				TotalPages = totalPages
			};

			return Ok(result);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error getting users");
			return StatusCode(500, new { error = "Internal server error" });
		}
	}

	/// <summary>
	/// Get a specific user by ID
	/// </summary>
	[HttpGet("{id}")]
	public async Task<IActionResult> GetUser(int id)
	{
		try
		{
			var user = await _userService.GetUserByIdAsync(id);
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
			_logger.LogError(ex, "Error getting user {UserId}", id);
			return StatusCode(500, new { error = "Internal server error" });
		}
	}

	/// <summary>
	/// Update a user (admin can change email, displayName, isAdmin)
	/// </summary>
	[HttpPut("{id}")]
	public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
	{
		try
		{
			var user = await _userService.UpdateUserAsync(id, request.Email, request.DisplayName, request.IsAdmin);
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
			_logger.LogError(ex, "Error updating user {UserId}", id);
			return StatusCode(500, new { error = "Internal server error" });
		}
	}

	/// <summary>
	/// Delete a user
	/// </summary>
	[HttpDelete("{id}")]
	public async Task<IActionResult> DeleteUser(int id)
	{
		try
		{
			// Prevent self-deletion
			var subjectId = GetSubjectId();
			if (!string.IsNullOrEmpty(subjectId))
			{
				var currentUser = await _userService.GetUserBySubjectIdAsync(subjectId);
				if (currentUser != null && currentUser.Id == id)
				{
					return BadRequest(new { error = "You cannot delete your own account" });
				}
			}

			var success = await _userService.DeleteUserAsync(id);
			if (!success)
			{
				return NotFound(new { error = "User not found" });
			}

			return Ok(new { message = "User deleted successfully" });
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error deleting user {UserId}", id);
			return StatusCode(500, new { error = "Internal server error" });
		}
	}
}
