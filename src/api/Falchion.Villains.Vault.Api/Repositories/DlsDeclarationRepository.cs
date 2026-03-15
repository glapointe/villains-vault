/**
 * DLS Declaration Repository Implementation
 * 
 * Implements data access operations for DlsRace and DlsDeclaration entities
 * using Entity Framework Core.
 */

using Microsoft.EntityFrameworkCore;
using Falchion.Villains.Vault.Api.Data;
using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.Repositories;

/// <summary>
/// Repository implementation for DlsRace and DlsDeclaration data access
/// </summary>
public class DlsDeclarationRepository : IDlsDeclarationRepository
{
	private readonly ApplicationDbContext _context;

	/// <summary>
	/// Constructor with dependency injection
	/// </summary>
	/// <param name="context">Database context</param>
	public DlsDeclarationRepository(ApplicationDbContext context)
	{
		_context = context;
	}

    /// <inheritdoc/>
    public async Task<List<DlsRace>> GetDlsRacesAsync(bool upcomingOnly = true)
	{
		var query = _context.DlsRaces
			.Include(r => r.Declarations)
			.AsQueryable();

		if (upcomingOnly)
		{
			// Show races until 1 day after the race date (race date + 1 day > today)
			var cutoff = DateTime.UtcNow.Date.AddDays(-1);
			query = query.Where(r => r.RaceDate >= cutoff);
		}

		return await query
			.OrderBy(r => r.RaceDate)
			.ToListAsync();
	}

    /// <inheritdoc/>
    public async Task<DlsRace?> GetDlsRaceByIdAsync(int id)
	{
		return await _context.DlsRaces
			.Include(r => r.Declarations)
				.ThenInclude(d => d.User)
			.FirstOrDefaultAsync(r => r.Id == id);
	}

    /// <inheritdoc/>
    public async Task<DlsRace?> GetDlsRaceByDateAsync(DateTime date)
	{
		return await _context.DlsRaces
			.Include(r => r.Declarations)
				.ThenInclude(d => d.User)
			.FirstOrDefaultAsync(r => r.RaceDate.Date == date.Date);
    }

    /// <inheritdoc/>
    public async Task<DlsRace> AddDlsRaceAsync(DlsRace dlsRace)
	{
		_context.DlsRaces.Add(dlsRace);
		await _context.SaveChangesAsync();
		return dlsRace;
	}

    /// <inheritdoc/>
    public async Task<DlsRace> UpdateDlsRaceAsync(DlsRace dlsRace)
	{
		_context.DlsRaces.Update(dlsRace);
		await _context.SaveChangesAsync();
		return dlsRace;
	}

    /// <inheritdoc/>
    public async Task DeleteDlsRaceAsync(DlsRace dlsRace)
	{
		_context.DlsRaces.Remove(dlsRace);
		await _context.SaveChangesAsync();
	}

    /// <inheritdoc/>
    public async Task<List<DlsDeclaration>> GetDeclarationsByRaceAsync(int dlsRaceId)
	{
		return await _context.DlsDeclarations
			.Include(d => d.User)
			.Include(d => d.DlsRace)
			.Where(d => d.DlsRaceId == dlsRaceId)
			.OrderBy(d => d.BibNumber)
			.ThenBy(d => d.CreatedAt)
			.ToListAsync();
	}

    /// <inheritdoc/>
    public async Task<DlsDeclaration?> GetDeclarationByIdAsync(int id)
	{
		return await _context.DlsDeclarations
			.Include(d => d.User)
			.Include(d => d.DlsRace)
			.FirstOrDefaultAsync(d => d.Id == id);
	}

    /// <inheritdoc/>
    public async Task<DlsDeclaration?> GetDeclarationByUserAndRaceAsync(int dlsRaceId, int userId)
	{
		return await _context.DlsDeclarations
			.FirstOrDefaultAsync(d => d.DlsRaceId == dlsRaceId && d.UserId == userId);
	}

    /// <inheritdoc/>
    public async Task<List<DlsDeclaration>> GetDeclarationsByUserAndRacesAsync(IEnumerable<int> dlsRaceIds, int userId)
	{
		var ids = dlsRaceIds.ToList();
		return await _context.DlsDeclarations
			.Include(d => d.User)
			.Include(d => d.DlsRace)
			.Where(d => ids.Contains(d.DlsRaceId) && d.UserId == userId)
			.ToListAsync();
	}

    /// <inheritdoc/>
    public async Task<DlsDeclaration?> GetDeclarationByBibAndRaceAsync(int dlsRaceId, int bibNumber)
	{
		return await _context.DlsDeclarations
			.FirstOrDefaultAsync(d => d.DlsRaceId == dlsRaceId && d.BibNumber == bibNumber);
	}

    /// <inheritdoc/>
    public async Task<DlsDeclaration> AddDeclarationAsync(DlsDeclaration declaration)
	{
		_context.DlsDeclarations.Add(declaration);
		await _context.SaveChangesAsync();
		return declaration;
	}

    /// <inheritdoc/>
    public async Task<List<DlsDeclaration>> AddDeclarationsAsync(List<DlsDeclaration> declarations)
	{
		_context.DlsDeclarations.AddRange(declarations);
		await _context.SaveChangesAsync();
		return declarations;
	}

    /// <inheritdoc/>
    public async Task<DlsDeclaration> UpdateDeclarationAsync(DlsDeclaration declaration)
	{
		_context.DlsDeclarations.Update(declaration);
		await _context.SaveChangesAsync();
		return declaration;
	}

    /// <inheritdoc/>
    public async Task DeleteDeclarationAsync(DlsDeclaration declaration)
	{
		_context.DlsDeclarations.Remove(declaration);
		await _context.SaveChangesAsync();
	}

    /// <inheritdoc/>
    public async Task<List<DlsDeclaration>> GetMatchableDeclarationsAsync(int dlsRaceId)
	{
		return await _context.DlsDeclarations
			.Include(d => d.User)
			.Where(d => d.DlsRaceId == dlsRaceId
				&& d.UserId != null
				&& d.BibNumber != null)
			.ToListAsync();
	}

    /// <inheritdoc/>
    public async Task<List<DlsDeclaration>> GetNameMatchableDeclarationsAsync(int dlsRaceId)
	{
		return await _context.DlsDeclarations
			.Include(d => d.User)
			.Where(d => d.DlsRaceId == dlsRaceId
				&& d.UserId != null
				&& d.BibNumber == null)
			.ToListAsync();
	}

    /// <inheritdoc/>
    public async Task<List<DlsDeclaration>> GetDeclarationsByActualRaceIdAsync(int raceId)
	{
		return await _context.DlsDeclarations
			.Include(d => d.DlsRace)
			.Include(d => d.User)
			.Where(d => d.DlsRace.RaceId == raceId)
			.ToListAsync();
	}
}
