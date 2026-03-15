/**
 * Race Result Follow Service
 * 
 * Business logic for following and unfollowing race results.
 * Users can follow results as "Interested" (tracking someone else)
 * or "Claimed" (stating this is their own result).
 */

using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Repositories;

namespace Falchion.Villains.Vault.Api.Services;

/// <summary>
/// Service for managing race result follow operations
/// </summary>
public class RaceResultFollowService
{
	private readonly IRaceResultFollowRepository _followRepository;
	private readonly ILogger<RaceResultFollowService> _logger;

	/// <summary>
	/// Constructor with dependency injection
	/// </summary>
	/// <param name="followRepository">Follow repository for data access</param>
	/// <param name="logger">Logger instance</param>
	public RaceResultFollowService(
		IRaceResultFollowRepository followRepository,
		ILogger<RaceResultFollowService> logger)
	{
		_followRepository = followRepository;
		_logger = logger;
	}

	/// <summary>
	/// Get a user's follow for a specific race result, if it exists
	/// </summary>
	/// <param name="userId">User ID</param>
	/// <param name="raceResultId">Race result ID</param>
	/// <returns>Follow entity or null</returns>
	public async Task<RaceResultFollow?> GetFollowAsync(int userId, long raceResultId)
	{
		return await _followRepository.GetByUserAndResultAsync(userId, raceResultId);
	}

	/// <summary>
	/// Get all follows for a user
	/// </summary>
	/// <param name="userId">User ID</param>
	/// <returns>List of follows</returns>
	public async Task<List<RaceResultFollow>> GetUserFollowsAsync(int userId)
	{
		return await _followRepository.GetByUserIdAsync(userId);
	}

	/// <summary>
	/// Follow a race result. If the user already follows this result, returns the existing follow.
	/// </summary>
	/// <param name="userId">User ID</param>
	/// <param name="raceResultId">Race result ID to follow</param>
	/// <param name="followType">Type of follow (Interested or Claimed)</param>
	/// <param name="deadLastStarted">Whether the user DLS'd the race (only for Claimed)</param>
	/// <returns>The created or existing follow</returns>
	public async Task<RaceResultFollow> FollowAsync(
		int userId, long raceResultId, FollowType followType, bool? deadLastStarted = null)
	{
		// Check if already following
		var existing = await _followRepository.GetByUserAndResultAsync(userId, raceResultId);
		if (existing != null)
		{
			_logger.LogInformation("User {UserId} already follows result {RaceResultId}", userId, raceResultId);
			return existing;
		}

		var follow = new RaceResultFollow
		{
			UserId = userId,
			RaceResultId = raceResultId,
			FollowType = followType,
			DeadLastStarted = followType == FollowType.Claimed ? deadLastStarted : null,
			CreatedAt = DateTime.UtcNow,
			ModifiedAt = DateTime.UtcNow
		};

		await _followRepository.AddAsync(follow);
		_logger.LogInformation(
			"User {UserId} followed result {RaceResultId} as {FollowType}",
			userId, raceResultId, followType);

		return follow;
	}

	/// <summary>
	/// Unfollow a race result
	/// </summary>
	/// <param name="userId">User ID</param>
	/// <param name="raceResultId">Race result ID to unfollow</param>
	/// <returns>True if unfollowed, false if no follow existed</returns>
	public async Task<bool> UnfollowAsync(int userId, long raceResultId)
	{
		var follow = await _followRepository.GetByUserAndResultAsync(userId, raceResultId);
		if (follow == null)
		{
			_logger.LogInformation("User {UserId} is not following result {RaceResultId}", userId, raceResultId);
			return false;
		}

		await _followRepository.DeleteAsync(follow);
		_logger.LogInformation(
			"User {UserId} unfollowed result {RaceResultId} (was {FollowType})",
			userId, raceResultId, follow.FollowType);

		return true;
	}

	/// <summary>
	/// Update an existing follow (e.g. toggle DLS status)
	/// </summary>
	/// <param name="userId">User ID</param>
	/// <param name="raceResultId">Race result ID</param>
	/// <param name="deadLastStarted">New DLS value</param>
	/// <returns>Updated follow, or null if not found</returns>
	public async Task<RaceResultFollow?> UpdateFollowAsync(int userId, long raceResultId, bool? deadLastStarted)
	{
		var follow = await _followRepository.GetByUserAndResultAsync(userId, raceResultId);
		if (follow == null)
		{
			_logger.LogInformation("User {UserId} has no follow for result {RaceResultId} to update", userId, raceResultId);
			return null;
		}

		follow.DeadLastStarted = deadLastStarted;
		follow.ModifiedAt = DateTime.UtcNow;

		await _followRepository.UpdateAsync(follow);
		_logger.LogInformation("User {UserId} updated follow for result {RaceResultId}: DLS={Dls}", userId, raceResultId, deadLastStarted);

		return follow;
	}
}
