using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Models;

namespace Falchion.Villains.Vault.Api.Repositories;

/// <summary>
/// Repository interface for Race entity operations.
/// </summary>
public interface IRaceRepository
{
	/// <summary>
	/// Gets a race by its normalized Track Shack URL.
	/// </summary>
	Task<Race?> GetByUrlAsync(string normalizedUrl);

	/// <summary>
	/// Gets a race by its ID.
	/// </summary>
	Task<Race?> GetByIdAsync(int id);

	/// <summary>
	/// Gets all races for a specific event.
	/// </summary>
	Task<List<Race>> GetByEventIdAsync(int eventId);

	/// <summary>
	/// Gets the count of race results for a specific race.
	/// </summary>
	Task<int> GetResultCountAsync(int raceId);

	/// <summary>
	/// Creates a new race.
	/// </summary>
	Task<Race> CreateAsync(Race newRace);

	/// <summary>
	/// Updates an existing race.
	/// </summary>
	Task UpdateAsync(Race existingRace);

	/// <summary>
	/// Creates a new race or updates an existing one based on the normalized URL.
	/// Returns the created or updated race.
	/// </summary>
	/// <param name="eventId">The event ID this race belongs to</param>
	/// <param name="normalizedUrl">The normalized Track Shack URL to check for existing race</param>
	/// <param name="name">The race name</param>
	/// <param name="raceDate">The race date</param>
	/// <param name="distance">The race distance</param>
	/// <param name="notes">Optional notes about the race</param>
	Task<Race> CreateOrUpdateAsync(int eventId, string normalizedUrl, string name, DateTime raceDate, RaceDistance distance, string? notes);

    /// <summary>
    /// Deletes a race by its ID.
    /// Also deletes all associated results, divisions, and jobs via cascading.
    /// </summary>
    /// <param name="raceId">The ID of the race to delete</param>
    Task DeleteAsync(int raceId);

    /// <summary>
    /// Gets the count of DNF (Did Not Finish) runners for a race.
    /// DNF runners are stored in a special division and excluded from normal queries.
    /// </summary>
    /// <param name="raceId">The race ID</param>
    /// <returns>The count of DNF runners</returns>
    Task<int> GetDnfCountAsync(int raceId);

	/// <summary>
	/// Builds the race statistics for the specified race.
	/// </summary>
	/// <param name="raceId">The ID of the race to build statistics for.</param>
	/// <returns>A task that represents the asynchronous operation. The task result contains the race statistics.</returns>
	Task<RaceStats> BuildRaceStats(int raceId);
}
