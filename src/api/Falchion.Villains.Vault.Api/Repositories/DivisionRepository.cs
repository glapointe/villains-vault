using Microsoft.EntityFrameworkCore;
using Falchion.Villains.Vault.Api.Data;
using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.Repositories;

/// <summary>
/// Repository implementation for Division entity operations.
/// </summary>
public class DivisionRepository : IDivisionRepository
{
	private readonly ApplicationDbContext _context;

	public DivisionRepository(ApplicationDbContext context)
	{
		_context = context;
	}

    /// <inheritdoc/>
    public async Task<Division?> GetByRaceAndValueAsync(int raceId, string divisionValue)
	{
		return await _context.Divisions
			.FirstOrDefaultAsync(d => d.RaceId == raceId && d.DivisionValue == divisionValue);
	}

    /// <inheritdoc/>
    public async Task<List<Division>> GetByRaceIdAsync(int raceId)
	{
		return await _context.Divisions
			.Where(d => d.RaceId == raceId)
			.OrderBy(d => d.DivisionLabel)
			.ToListAsync();
	}

    /// <inheritdoc/>
    public async Task<Division> CreateAsync(Division division)
	{
		division.CreatedAt = DateTime.UtcNow;

		_context.Divisions.Add(division);
		await _context.SaveChangesAsync();

		return division;
	}

    /// <inheritdoc/>
    public async Task<Division> CreateOrUpdateAsync(int raceId, string divisionValue, string divisionLabel)
	{
		var existing = await GetByRaceAndValueAsync(raceId, divisionValue);

		if (existing != null)
		{
			// Division already exists, just return it
			// We don't update the label in case the admin has modified it
			return existing;
		}
		else
		{
			return await CreateAsync(new Division
			{
				RaceId = raceId,
				DivisionValue = divisionValue,
				DivisionLabel = divisionLabel
			});
		}
	}
}
