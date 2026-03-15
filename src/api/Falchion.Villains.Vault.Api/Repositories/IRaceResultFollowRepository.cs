/**
 * Race Result Follow Repository Interface
 * 
 * Defines the contract for race result follow data access operations.
 */

using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.Repositories;

/// <summary>
/// Repository interface for RaceResultFollow entity data access
/// </summary>
public interface IRaceResultFollowRepository
{
	/// <summary>
	/// Get a follow by user ID and race result ID
	/// </summary>
	/// <param name="userId">User ID</param>
	/// <param name="raceResultId">Race result ID</param>
	/// <returns>Follow entity or null if not found</returns>
	Task<RaceResultFollow?> GetByUserAndResultAsync(int userId, long raceResultId);

	/// <summary>
	/// Get all follows for a user
	/// </summary>
	/// <param name="userId">User ID</param>
	/// <returns>List of follows for the user</returns>
	Task<List<RaceResultFollow>> GetByUserIdAsync(int userId);

	/// <summary>
	/// Add a new follow
	/// </summary>
	/// <param name="follow">Follow entity to add</param>
	/// <returns>Created follow with generated ID</returns>
	Task<RaceResultFollow> AddAsync(RaceResultFollow follow);

	/// <summary>
	/// Delete a follow
	/// </summary>
	/// <param name="follow">Follow entity to delete</param>
	Task DeleteAsync(RaceResultFollow follow);

	/// <summary>
	/// Update an existing follow
	/// </summary>
	/// <param name="follow">Follow entity with updated values</param>
	/// <returns>Updated follow</returns>
	Task<RaceResultFollow> UpdateAsync(RaceResultFollow follow);

	/// <summary>
	/// Get all follows marked as DLS (DeadLastStarted = true) for a specific race
	/// </summary>
	/// <param name="raceId">The race ID to find DLS follows for</param>
	/// <returns>List of DLS follows for the race</returns>
	Task<List<RaceResultFollow>> GetDlsFollowsForRaceAsync(int raceId);
}
