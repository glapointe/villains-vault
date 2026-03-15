/**
 * Race Result Follow Repository Implementation
 * 
 * Implements data access operations for RaceResultFollow entity using Entity Framework Core.
 */

using Microsoft.EntityFrameworkCore;
using Falchion.Villains.Vault.Api.Data;
using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.Repositories;

/// <summary>
/// Repository implementation for RaceResultFollow entity data access
/// </summary>
public class RaceResultFollowRepository : IRaceResultFollowRepository
{
	private readonly ApplicationDbContext _context;

	/// <summary>
	/// Constructor with dependency injection
	/// </summary>
	/// <param name="context">Database context</param>
	public RaceResultFollowRepository(ApplicationDbContext context)
	{
		_context = context;
	}

    /// <inheritdoc/>
    public async Task<RaceResultFollow?> GetByUserAndResultAsync(int userId, long raceResultId)
	{
		return await _context.RaceResultFollows
			.FirstOrDefaultAsync(f => f.UserId == userId && f.RaceResultId == raceResultId);
	}

    /// <inheritdoc/>
    public async Task<List<RaceResultFollow>> GetByUserIdAsync(int userId)
	{
		return await _context.RaceResultFollows
			.Include(f => f.RaceResult)
				.ThenInclude(r => r.Race)
					.ThenInclude(r => r.Event)
			.Where(f => f.UserId == userId)
			.OrderByDescending(f => f.RaceResult.Race.RaceDate)
			.ThenBy(f => f.RaceResult.OverallPlace)
			.ToListAsync();
	}

    /// <inheritdoc/>
    public async Task<RaceResultFollow> AddAsync(RaceResultFollow follow)
	{
		_context.RaceResultFollows.Add(follow);
		await _context.SaveChangesAsync();
		return follow;
	}

    /// <inheritdoc/>
    public async Task DeleteAsync(RaceResultFollow follow)
	{
		_context.RaceResultFollows.Remove(follow);
		await _context.SaveChangesAsync();
	}

    /// <inheritdoc/>
    public async Task<RaceResultFollow> UpdateAsync(RaceResultFollow follow)
	{
		_context.RaceResultFollows.Update(follow);
		await _context.SaveChangesAsync();
		return follow;
	}

    /// <inheritdoc/>
    public async Task<List<RaceResultFollow>> GetDlsFollowsForRaceAsync(int raceId)
	{
		return await _context.RaceResultFollows
			.Include(f => f.RaceResult)
			.Where(f => f.DeadLastStarted == true && f.RaceResult.RaceId == raceId)
			.ToListAsync();
	}
}
