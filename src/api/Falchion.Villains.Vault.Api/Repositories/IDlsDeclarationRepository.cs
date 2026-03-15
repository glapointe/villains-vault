/**
 * DLS Declaration Repository Interface
 * 
 * Defines the contract for DLS race and declaration data access operations.
 */

using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.Repositories;

/// <summary>
/// Repository interface for DlsRace and DlsDeclaration entity data access
/// </summary>
public interface IDlsDeclarationRepository
{
	// --- DLS Races ---

	/// <summary>
	/// Get all DLS races (optionally filtered to only upcoming/recent races)
	/// </summary>
	/// <param name="upcomingOnly">If true, only return races with date >= yesterday</param>
	/// <returns>List of DLS races with declaration counts</returns>
	Task<List<DlsRace>> GetDlsRacesAsync(bool upcomingOnly = true);

	/// <summary>
	/// Get a DLS race by ID with its declarations
	/// </summary>
	/// <param name="id">DLS race ID</param>
	/// <returns>DLS race with declarations or null</returns>
	Task<DlsRace?> GetDlsRaceByIdAsync(int id);

	/// <summary>
	/// Asynchronously retrieves the DLS race scheduled for the specified date.
	/// </summary>
	/// <param name="date">The date for which to retrieve the DLS race. Only the date component is considered; the time component is ignored.</param>
	/// <returns>A task that represents the asynchronous operation. The task result contains the DLS race for the specified date, or
	/// <see langword="null"/> if no race is scheduled.</returns>
	Task<DlsRace?> GetDlsRaceByDateAsync(DateTime date);

    /// <summary>
    /// Add a new DLS race
    /// </summary>
    /// <param name="dlsRace">DLS race entity</param>
    /// <returns>Created DLS race with generated ID</returns>
    Task<DlsRace> AddDlsRaceAsync(DlsRace dlsRace);

	/// <summary>
	/// Update an existing DLS race
	/// </summary>
	/// <param name="dlsRace">DLS race entity with updated values</param>
	/// <returns>Updated DLS race</returns>
	Task<DlsRace> UpdateDlsRaceAsync(DlsRace dlsRace);

	/// <summary>
	/// Delete a DLS race (cascades to declarations)
	/// </summary>
	/// <param name="dlsRace">DLS race entity to delete</param>
	Task DeleteDlsRaceAsync(DlsRace dlsRace);

	// --- DLS Declarations ---

	/// <summary>
	/// Get all declarations for a DLS race
	/// </summary>
	/// <param name="dlsRaceId">DLS race ID</param>
	/// <returns>List of declarations with user info</returns>
	Task<List<DlsDeclaration>> GetDeclarationsByRaceAsync(int dlsRaceId);

	/// <summary>
	/// Get a declaration by ID
	/// </summary>
	/// <param name="id">Declaration ID</param>
	/// <returns>Declaration or null</returns>
	Task<DlsDeclaration?> GetDeclarationByIdAsync(int id);

	/// <summary>
	/// Get a user's declaration for a specific DLS race
	/// </summary>
	/// <param name="dlsRaceId">DLS race ID</param>
	/// <param name="userId">User ID</param>
	/// <returns>Declaration or null</returns>
	Task<DlsDeclaration?> GetDeclarationByUserAndRaceAsync(int dlsRaceId, int userId);

	/// <summary>
	/// Get a user's declarations across multiple DLS races
	/// </summary>
	/// <param name="dlsRaceIds">List of DLS race IDs</param>
	/// <param name="userId">User ID</param>
	/// <returns>List of declarations the user has in the specified races</returns>
	Task<List<DlsDeclaration>> GetDeclarationsByUserAndRacesAsync(IEnumerable<int> dlsRaceIds, int userId);

	/// <summary>
	/// Get a declaration by bib number for a specific DLS race
	/// </summary>
	/// <param name="dlsRaceId">DLS race ID</param>
	/// <param name="bibNumber">Bib number</param>
	/// <returns>Declaration or null</returns>
	Task<DlsDeclaration?> GetDeclarationByBibAndRaceAsync(int dlsRaceId, int bibNumber);

	/// <summary>
	/// Add a new declaration
	/// </summary>
	/// <param name="declaration">Declaration entity</param>
	/// <returns>Created declaration with generated ID</returns>
	Task<DlsDeclaration> AddDeclarationAsync(DlsDeclaration declaration);

	/// <summary>
	/// Add multiple declarations at once
	/// </summary>
	/// <param name="declarations">List of declaration entities</param>
	/// <returns>Created declarations</returns>
	Task<List<DlsDeclaration>> AddDeclarationsAsync(List<DlsDeclaration> declarations);

	/// <summary>
	/// Update an existing declaration
	/// </summary>
	/// <param name="declaration">Declaration entity with updated values</param>
	/// <returns>Updated declaration</returns>
	Task<DlsDeclaration> UpdateDeclarationAsync(DlsDeclaration declaration);

	/// <summary>
	/// Delete a declaration
	/// </summary>
	/// <param name="declaration">Declaration entity to delete</param>
	Task DeleteDeclarationAsync(DlsDeclaration declaration);

	/// <summary>
	/// Get all declarations that have both a userId and a bibNumber for a specific DLS race.
	/// Used for matching declarations to race results after scraping.
	/// </summary>
	/// <param name="dlsRaceId">DLS race ID</param>
	/// <returns>Declarations with both userId and bibNumber</returns>
	Task<List<DlsDeclaration>> GetMatchableDeclarationsAsync(int dlsRaceId);

	/// <summary>
	/// Get all declarations with userId but no bib number for name-matching.
	/// </summary>
	/// <param name="dlsRaceId">DLS race ID</param>
	/// <returns>Declarations with userId but no bibNumber</returns>
	Task<List<DlsDeclaration>> GetNameMatchableDeclarationsAsync(int dlsRaceId);

	/// <summary>
	/// Get declarations for races that have been linked to actual Race entities.
	/// Used to resolve DLS result IDs for kill charts.
	/// </summary>
	/// <param name="raceId">Actual Race ID</param>
	/// <returns>Declarations for the linked race</returns>
	Task<List<DlsDeclaration>> GetDeclarationsByActualRaceIdAsync(int raceId);
}
