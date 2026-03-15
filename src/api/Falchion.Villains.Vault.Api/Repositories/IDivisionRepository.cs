using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.Repositories;

/// <summary>
/// Repository interface for Division entity operations.
/// </summary>
public interface IDivisionRepository
{
	/// <summary>
	/// Gets a division by its race ID and division value.
	/// </summary>
	Task<Division?> GetByRaceAndValueAsync(int raceId, string divisionValue);

	/// <summary>
	/// Gets all divisions for a specific race.
	/// </summary>
	Task<List<Division>> GetByRaceIdAsync(int raceId);

	/// <summary>
	/// Creates a new division.
	/// </summary>
	Task<Division> CreateAsync(Division division);

	/// <summary>
	/// Creates or updates a division based on race ID and division value.
	/// Returns the created or existing division.
	/// </summary>
	/// <param name="raceId">The race ID this division belongs to</param>
	/// <param name="divisionValue">The Track Shack division parameter value</param>
	/// <param name="divisionLabel">The human-readable division label</param>
	Task<Division> CreateOrUpdateAsync(int raceId, string divisionValue, string divisionLabel);
}
