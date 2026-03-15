using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.Repositories;

/// <summary>
/// Repository interface for RaceResult entity operations.
/// </summary>
public interface IResultRepository
{
	/// <summary>
	/// Asynchronously retrieves a race result by its unique identifier.
	/// </summary>
	/// <param name="raceResultId">The unique identifier of the race result to retrieve. Must be a positive value.</param>
	/// <returns>A task that represents the asynchronous operation. The task result contains the race result associated with the
	/// specified identifier, or null if no matching race result is found.</returns>
	Task<RaceResult?> GetByIdAsync(long raceResultId);

    /// <summary>
    /// Gets all existing results for a specific race with sorting.
    /// </summary>
    /// <param name="raceId">The race ID</param>
    /// <param name="sortField">Field to sort by (default: OverallPlace)</param>
    /// <param name="sortDirection">Sort direction (default: Ascending)</param>
    Task<List<RaceResult>> GetRaceResultsByRaceIdAsync(
		int raceId,
		RaceResultColumn sortField = RaceResultColumn.OverallPlace,
		SortDirection sortDirection = SortDirection.Ascending);

	/// <summary>
	/// Gets filtered and paged results for a race.
	/// </summary>
	/// <param name="raceId">The race ID</param>
	/// <param name="divisionId">Optional division ID filter</param>
	/// <param name="gender">Optional gender filter (Unknown genders always included)</param>
	/// <param name="searchTerm">Optional search term to filter by BibNumber, Name, or Hometown</param>
	/// <param name="sortField">Field to sort by (default: OverallPlace)</param>
	/// <param name="sortDirection">Sort direction (default: Ascending)</param>
	/// <param name="page">Page number (1-indexed)</param>
	/// <param name="pageSize">Number of items per page</param>
	/// <returns>Tuple containing (results, totalCount)</returns>
	Task<(List<RaceResult> Results, int TotalCount)> GetFilteredPagedResultsAsync(
		int raceId, 
		int? divisionId, 
		Gender? gender, 
		string? searchTerm, 
		RaceResultColumn sortField,
		SortDirection sortDirection,
		int page, 
		int pageSize,
		string? region = null);

	/// <summary>
	/// Gets the total count of results for a race with optional filters.
	/// </summary>
	/// <param name="raceId">The race ID</param>
	/// <param name="divisionId">Optional division ID filter</param>
	/// <param name="gender">Optional gender filter (Unknown genders always included)</param>
	/// <param name="runnerType">Optional runner type filter</param>
	Task<int> GetRaceResultsCountAsync(int raceId, int? divisionId = null, Gender? gender = null, RunnerType? runnerType = null);

	/// <summary>
	/// Gets filtered results with pagination support.
	/// Supports filtering by division, gender, and runner type.
	/// </summary>
	/// <param name="raceId">The race ID</param>
	/// <param name="divisionId">Optional division ID filter</param>
	/// <param name="gender">Optional gender filter (Unknown genders always included)</param>
	/// <param name="runnerType">Optional runner type filter</param>
	/// <param name="sortField">Field to sort by (default: OverallPlace)</param>
	/// <param name="sortDirection">Sort direction (default: Ascending)</param>
	/// <param name="page">Page number (1-indexed)</param>
	/// <param name="pageSize">Number of items per page</param>
	/// <returns>List of race results for the specified page</returns>
	Task<List<RaceResult>> GetFilteredResultsAsync(
		int raceId,
		int? divisionId,
		Gender? gender,
		RunnerType? runnerType,
		RaceResultColumn sortField,
		SortDirection sortDirection,
		int page,
		int pageSize,
		string? region = null);

	/// <summary>
	/// Performs a batch upsert of race results.
	/// Compares incoming results with existing ones to determine inserts vs updates.
	/// Only updates ModifiedAt when data actually changes.
	/// </summary>
	/// <param name="raceId">The race ID these results belong to</param>
	/// <param name="results">The parsed results to insert or update</param>
	/// <returns>Tuple containing (recordsAdded, recordsUpdated)</returns>
	Task<(int Added, int Updated)> BatchUpsertAsync(int raceId, List<RaceResult> results);

	/// <summary>
	/// Gets the last starter (balloon lady) for a race.
	/// Returns the runner with the latest start time whose overall pace is within 10 seconds of 16 min/mile.
	/// </summary>
	/// <param name="raceId">The race ID</param>
	/// <returns>The balloon lady race result, or null if not found</returns>
	Task<RaceResult?> GetLastStarter(int raceId);

	/// <summary>
	/// Asynchronously retrieves the division runner count for a specific race result.
	/// </summary>
	/// <param name="resultId">The unique identifier of the race result.</param>
	/// <returns>The total number of runners in the same division.</returns>
	Task<int> GetDivisionRunnerCountAsync(long resultId);

    /// <summary>
    /// Gets the X closest race results to a target result by start time and finish time.
    /// Returns runners who started/finished both before and after the target runner.
    /// </summary>
    /// <param name="raceResultId">The target race result ID</param>
    /// <param name="fieldSize">The number of results to retrieve.</param>
    /// <returns>Tuple containing (closestStarters, closestFinishers) lists, each with up to [fieldSize] results sorted by proximity</returns>
    Task<(List<RaceResult> ClosestStarters, List<RaceResult> ClosestFinishers)> GetClosestResultsAsync(long raceResultId, int fieldSize);

    /// <summary>
    /// Finds race results matching a runner by name and age range within a specific race.
    /// Used for related results lookup across events.
    /// </summary>
    /// <param name="raceId">The race to search within</param>
    /// <param name="name">The runner's name (case-insensitive)</param>
    /// <param name="minAge">Minimum age to match (inclusive)</param>
    /// <param name="maxAge">Maximum age to match (inclusive)</param>
    /// <param name="hometown">Optional hometown filter (case-insensitive)</param>
    /// <param name="bibNumber">Optional bib number filter</param>
    /// <returns>List of matching race results</returns>
    Task<List<RaceResult>> FindMatchingResultsAsync(int raceId, string name, int minAge, int maxAge, string? hometown = null, int? bibNumber = null);

	/// <summary>
	/// Gets race results for runners from a specific hometown within a race, ordered by overall place.
	/// Excludes DNF runners.
	/// </summary>
	/// <param name="raceId">The race ID</param>
	/// <param name="hometown">The hometown to match (case-insensitive)</param>
	/// <param name="limit">Maximum results to return (0 for all)</param>
	/// <returns>List of matching race results ordered by overall place</returns>
	Task<List<RaceResult>> GetResultsByHometownAsync(int raceId, string hometown, int limit = 0);

	/// <summary>
	/// Gets race results for runners from a specific region (state/country) within a race, ordered by overall place.
	/// Matches hometowns ending with ", REGION" (e.g., ", FL" or ", Brazil"). Excludes DNF runners.
	/// </summary>
	/// <param name="raceId">The race ID</param>
	/// <param name="region">The region to match — a 2-character US state code (e.g., "FL") or country name (e.g., "Brazil")</param>
	/// <param name="limit">Maximum results to return (0 for all)</param>
	/// <returns>List of matching race results ordered by overall place</returns>
	Task<List<RaceResult>> GetResultsByRegionAsync(int raceId, string region, int limit = 0);

	/// <summary>
	/// Searches for race results by runner name across races.
	/// Optionally scoped to a single race or all races in an event.
	/// Excludes DNF runners. Includes Race and Event navigation properties.
	/// </summary>
	/// <param name="name">The runner name to search for (case-insensitive, supports partial match)</param>
	/// <param name="raceId">Optional race ID to scope to a single race</param>
	/// <param name="eventId">Optional event ID to scope to all races in an event (ignored if raceId is set)</param>
	/// <param name="eventSeries">Optional event series to filter by</param>
	/// <param name="limit">Maximum results to return</param>
	/// <param name="skip">Number of results to skip for pagination (default 0)</param>
	/// <param name="excludeResultIds">Result IDs to exclude (e.g. already-followed results)</param>
	/// <returns>List of matching race results ordered by overall place</returns>
	Task<List<RaceResult>> SearchByNameAsync(string name, int? raceId = null, int? eventId = null, EventSeries? eventSeries = null, int limit = 20, int skip = 0, HashSet<long>? excludeResultIds = null);

	/// <summary>
	/// Gets runner counts grouped by hometown and runner type.
	/// Excludes DNF runners and null/empty hometowns.
	/// Scope: raceId filters to a single race, eventId to all races in an event, neither returns all.
	/// </summary>
	/// <param name="raceId">Optional race ID to scope to a single race</param>
	/// <param name="eventId">Optional event ID to scope to all races in an event (ignored if raceId is set)</param>
	/// <returns>List of (hometown, runnerType, count) tuples</returns>
	Task<List<(string Hometown, RunnerType RunnerType, int Count)>> GetHometownRunnerTypeCountsAsync(int? raceId = null, int? eventId = null);

	/// <summary>
	/// Gets a single race result by bib number within a race.
	/// Excludes DNF runners.
	/// </summary>
	/// <param name="raceId">The race ID</param>
	/// <param name="bibNumber">The bib number to look up</param>
	/// <returns>The matching race result, or null if not found</returns>
	Task<RaceResult?> GetByBibNumberAsync(int raceId, int bibNumber);

	/// <summary>
	/// Gets race results for multiple bib numbers within a race.
	/// Excludes DNF runners. Returns results in the order of found matches.
	/// </summary>
	/// <param name="raceId">The race ID</param>
	/// <param name="bibNumbers">The bib numbers to look up</param>
	/// <returns>List of matching race results</returns>
	Task<List<RaceResult>> GetByBibNumbersAsync(int raceId, IEnumerable<int> bibNumbers);
}
