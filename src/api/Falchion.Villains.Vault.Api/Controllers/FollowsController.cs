/**
 * Race Result Follows Controller
 * 
 * API endpoints for following and unfollowing race results.
 * Requires authentication. Users can follow results they're interested
 * in tracking or claim results as their own.
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Falchion.Villains.Vault.Api.DTOs;
using Falchion.Villains.Vault.Api.Services;

namespace Falchion.Villains.Vault.Api.Controllers;

/// <summary>
/// Controller for race result follow endpoints
/// </summary>
[ApiController]
[ApiExplorerSettings(GroupName = "public")]
[Route("api/v1.0/follows")]
[Authorize]
public class FollowsController : ApiControllerBase
{
	private readonly RaceResultFollowService _followService;
	private readonly RaceDataService _raceDataService;
	private readonly UserService _userService;
	private readonly IMemoryCache _cache;
	private readonly ILogger<FollowsController> _logger;

	private const int CacheMinutes = 10;

	/// <summary>
	/// Constructor with dependency injection
	/// </summary>
	public FollowsController(
		RaceResultFollowService followService,
		RaceDataService raceDataService,
		UserService userService,
		IMemoryCache cache,
		ILogger<FollowsController> logger)
	{
		_followService = followService;
		_raceDataService = raceDataService;
		_userService = userService;
		_cache = cache;
		_logger = logger;
	}

	/// <summary>
	/// Build a per-user cache key for the enriched follows list
	/// </summary>
	private static string FollowsCacheKey(int userId) => $"user_{userId}_follows";

	/// <summary>
	/// Invalidate the cached follows list for a user
	/// </summary>
	private void InvalidateFollowsCache(int userId) => _cache.Remove(FollowsCacheKey(userId));

	/// <summary>
	/// Get all enriched follows for the current user (for dashboard display).
	/// Returns follow + race result + race + event data. Cached per user.
	/// </summary>
	[HttpGet]
	public async Task<IActionResult> GetMyFollows()
	{
		try
		{
			var user = await GetCurrentUserAsync();
			if (user == null) return Unauthorized(new { error = "User not found" });

			var bypassCache = ShouldBypassCache();
			var cacheKey = FollowsCacheKey(user.Id);

			if (!bypassCache && _cache.TryGetValue(cacheKey, out List<EnrichedFollowDto>? cached) && cached != null)
			{
				_logger.LogDebug("Retrieved follows for user {UserId} from cache", user.Id);
				return Ok(cached);
			}

			var follows = await _followService.GetUserFollowsAsync(user.Id);

			var enriched = follows.Select(f => new EnrichedFollowDto
			{
				FollowId = f.Id,
				FollowType = f.FollowType,
				DeadLastStarted = f.DeadLastStarted,
				FollowedAt = f.CreatedAt,
				RaceResultId = f.RaceResultId,
				RunnerName = f.RaceResult.Name,
				Age = f.RaceResult.Age,
				Hometown = f.RaceResult.Hometown,
				NetTime = f.RaceResult.NetTime,
				OverallPace = f.RaceResult.OverallPace,
				OverallPlace = f.RaceResult.OverallPlace,
				Passes = f.RaceResult.Passes,
				RaceId = f.RaceResult.RaceId,
				RaceName = f.RaceResult.Race.Name,
				RaceDate = f.RaceResult.Race.RaceDate,
				Distance = f.RaceResult.Race.Distance,
				EventId = f.RaceResult.Race.EventId,
				EventName = f.RaceResult.Race.Event.Name,
				EventSeries = f.RaceResult.Race.EventSeries,
			}).ToList();

			var cacheOptions = new MemoryCacheEntryOptions()
				.SetAbsoluteExpiration(TimeSpan.FromMinutes(CacheMinutes));
			_cache.Set(cacheKey, enriched, cacheOptions);

			_logger.LogInformation("Fetched and cached {Count} follows for user {UserId} (bypass: {Bypass})",
				enriched.Count, user.Id, bypassCache);

			return Ok(enriched);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error fetching follows for current user");
			return StatusCode(500, new { error = "Internal server error" });
		}
	}

	/// <summary>
	/// Search for race results matching the current user's display name.
	/// Used by the "Find My Results" feature on the dashboard.
	/// Already-followed results are excluded on the server.
	/// Supports pagination via skip/limit.
	/// </summary>
	/// <param name="skip">Number of results to skip (default 0)</param>
	/// <param name="limit">Max results per page (default 25)</param>
	[HttpGet("search")]
	public async Task<IActionResult> SearchMyResults([FromQuery] int skip = 0, [FromQuery] int limit = 25)
	{
		try
		{
			var user = await GetCurrentUserAsync();
			if (user == null) return Unauthorized(new { error = "User not found" });

			var name = user.DisplayName;
			if (string.IsNullOrWhiteSpace(name))
			{
				return BadRequest(new { error = "Your profile does not have a display name set. Please update your profile first." });
			}

			// Get the user's existing follows to exclude them from results
			var follows = await _followService.GetUserFollowsAsync(user.Id);
			var followedResultIds = follows
				.Select(f => f.RaceResultId)
				.ToHashSet();

			var results = await _raceDataService.SearchRunnerByNameAsync(
				name,
				limit: limit,
				skip: skip,
				excludeResultIds: followedResultIds);

			var response = results.Select(r => new SearchResultDto
			{
				ResultId = r.ResultId,
				RunnerName = name,
				EventName = r.EventName,
				EventSeries = r.EventSeries,
				RaceName = r.RaceName,
				RaceDate = r.RaceDate,
				Distance = r.Distance,
				OverallPlace = r.OverallPlace,
				NetTime = r.NetTime,
				OverallPace = r.OverallPace,
				Hometown = r.Hometown,
			}).ToList();

			return Ok(response);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error searching results for current user");
			return StatusCode(500, new { error = "Internal server error" });
		}
	}

	/// <summary>
	/// Get the current user's follow status for a specific race result
	/// </summary>
	/// <param name="raceResultId">Race result ID to check</param>
	/// <returns>Follow DTO if following, or 204 No Content if not</returns>
	[HttpGet("status/{raceResultId}")]
	public async Task<IActionResult> GetFollowStatus(long raceResultId)
	{
		try
		{
			var user = await GetCurrentUserAsync();
			if (user == null) return Unauthorized(new { error = "User not found" });

			var follow = await _followService.GetFollowAsync(user.Id, raceResultId);
			if (follow == null)
			{
				return NoContent();
			}

			return Ok(new RaceResultFollowDto
			{
				Id = follow.Id,
				RaceResultId = follow.RaceResultId,
				FollowType = follow.FollowType,
				DeadLastStarted = follow.DeadLastStarted,
				CreatedAt = follow.CreatedAt
			});
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error checking follow status for result {RaceResultId}", raceResultId);
			return StatusCode(500, new { error = "Internal server error" });
		}
	}

	/// <summary>
	/// Follow a race result
	/// </summary>
	/// <param name="request">Follow request with result ID, follow type, and optional DLS flag</param>
	/// <returns>Created follow DTO</returns>
	[HttpPost]
	public async Task<IActionResult> Follow([FromBody] FollowRaceResultRequest request)
	{
		try
		{
			var user = await GetCurrentUserAsync();
			if (user == null) return Unauthorized(new { error = "User not found" });

			var follow = await _followService.FollowAsync(
				user.Id,
				request.RaceResultId,
				request.FollowType,
				request.DeadLastStarted);

			InvalidateFollowsCache(user.Id);

			return Ok(new RaceResultFollowDto
			{
				Id = follow.Id,
				RaceResultId = follow.RaceResultId,
				FollowType = follow.FollowType,
				DeadLastStarted = follow.DeadLastStarted,
				CreatedAt = follow.CreatedAt
			});
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error following result {RaceResultId}", request.RaceResultId);
			return StatusCode(500, new { error = "Internal server error" });
		}
	}

	/// <summary>
	/// Update an existing follow (e.g. toggle DLS status)
	/// </summary>
	/// <param name="raceResultId">Race result ID of the follow to update</param>
	/// <param name="request">Update request with new field values</param>
	/// <returns>Updated follow DTO, or 404 if not following</returns>
	[HttpPatch("{raceResultId}")]
	public async Task<IActionResult> UpdateFollow(long raceResultId, [FromBody] UpdateFollowRequest request)
	{
		try
		{
			var user = await GetCurrentUserAsync();
			if (user == null) return Unauthorized(new { error = "User not found" });

			var follow = await _followService.UpdateFollowAsync(user.Id, raceResultId, request.DeadLastStarted);
			if (follow == null)
			{
				return NotFound(new { error = "You are not following this result" });
			}

			InvalidateFollowsCache(user.Id);

			return Ok(new RaceResultFollowDto
			{
				Id = follow.Id,
				RaceResultId = follow.RaceResultId,
				FollowType = follow.FollowType,
				DeadLastStarted = follow.DeadLastStarted,
				CreatedAt = follow.CreatedAt
			});
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error updating follow for result {RaceResultId}", raceResultId);
			return StatusCode(500, new { error = "Internal server error" });
		}
	}

	/// <summary>
	/// Unfollow a race result
	/// </summary>
	/// <param name="raceResultId">Race result ID to unfollow</param>
	/// <returns>204 No Content on success, 404 if not following</returns>
	[HttpDelete("{raceResultId}")]
	public async Task<IActionResult> Unfollow(long raceResultId)
	{
		try
		{
			var user = await GetCurrentUserAsync();
			if (user == null) return Unauthorized(new { error = "User not found" });

			var result = await _followService.UnfollowAsync(user.Id, raceResultId);
			if (!result)
			{
				return NotFound(new { error = "You are not following this result" });
			}

			InvalidateFollowsCache(user.Id);

			return NoContent();
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error unfollowing result {RaceResultId}", raceResultId);
			return StatusCode(500, new { error = "Internal server error" });
		}
	}

	/// <summary>
	/// Helper to get the current authenticated user from JWT claims
	/// </summary>
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
