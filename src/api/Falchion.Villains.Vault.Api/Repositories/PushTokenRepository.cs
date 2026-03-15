/**
 * Push Token Repository Implementation
 * 
 * Implements data access operations for PushToken entity using Entity Framework Core.
 */

using Microsoft.EntityFrameworkCore;
using Falchion.Villains.Vault.Api.Data;
using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.Repositories;

/// <summary>
/// Repository for push notification token data access
/// </summary>
public class PushTokenRepository : IPushTokenRepository
{
	private readonly ApplicationDbContext _context;

	public PushTokenRepository(ApplicationDbContext context)
	{
		_context = context;
	}

	/// <inheritdoc />
	public async Task<PushToken> UpsertTokenAsync(int userId, string token, string platform)
	{
		var existing = await _context.PushTokens
			.FirstOrDefaultAsync(pt => pt.Token == token);

		if (existing != null)
		{
			// Update ownership and platform if token already exists
			existing.UserId = userId;
			existing.Platform = platform;
			existing.UpdatedAt = DateTime.UtcNow;
			await _context.SaveChangesAsync();
			return existing;
		}

		var pushToken = new PushToken
		{
			UserId = userId,
			Token = token,
			Platform = platform,
			CreatedAt = DateTime.UtcNow,
			UpdatedAt = DateTime.UtcNow,
		};

		_context.PushTokens.Add(pushToken);
		await _context.SaveChangesAsync();
		return pushToken;
	}

	/// <inheritdoc />
	public async Task<bool> RemoveTokenAsync(string token)
	{
		var existing = await _context.PushTokens
			.FirstOrDefaultAsync(pt => pt.Token == token);

		if (existing == null) return false;

		_context.PushTokens.Remove(existing);
		await _context.SaveChangesAsync();
		return true;
	}

	/// <inheritdoc />
	public async Task RemoveAllTokensForUserAsync(int userId)
	{
		var tokens = await _context.PushTokens
			.Where(pt => pt.UserId == userId)
			.ToListAsync();

		if (tokens.Count > 0)
		{
			_context.PushTokens.RemoveRange(tokens);
			await _context.SaveChangesAsync();
		}
	}

	/// <inheritdoc />
	public async Task<List<PushToken>> GetTokensForOptedInUsersAsync(NotificationType notificationType)
	{
		// Single query: left-join PushTokens → NotificationPreferences.
		// Users without a preference row default to opted-in.
		var query = _context.PushTokens
			.GroupJoin(
				_context.NotificationPreferences,
				pt => pt.UserId,
				np => np.UserId,
				(pt, prefs) => new { Token = pt, Pref = prefs.FirstOrDefault() })
			.Where(x => x.Pref == null);

		// Build type-specific filter — EF Core cannot translate switch expressions in expression trees
		var optedInQuery = notificationType switch
		{
			NotificationType.RaceResults => _context.PushTokens
				.Join(_context.NotificationPreferences.Where(np => np.RaceResults),
					pt => pt.UserId, np => np.UserId, (pt, np) => pt),
			NotificationType.DlsDeclarations => _context.PushTokens
				.Join(_context.NotificationPreferences.Where(np => np.DlsDeclarations),
					pt => pt.UserId, np => np.UserId, (pt, np) => pt),
			NotificationType.CommunityEvents => _context.PushTokens
				.Join(_context.NotificationPreferences.Where(np => np.CommunityEvents),
					pt => pt.UserId, np => np.UserId, (pt, np) => pt),
			_ => _context.PushTokens
				.Join(_context.NotificationPreferences,
					pt => pt.UserId, np => np.UserId, (pt, np) => pt),
		};

		// Union: tokens with no preference row (default opted-in) + tokens with explicit opt-in
		return await query.Select(x => x.Token)
			.Union(optedInQuery)
			.ToListAsync();
	}

	/// <inheritdoc />
	public async Task<List<PushToken>> GetTokensForUserAsync(int userId)
	{
		return await _context.PushTokens
			.Where(pt => pt.UserId == userId)
			.ToListAsync();
	}

	/// <inheritdoc />
	public async Task RemoveTokensByValueAsync(IEnumerable<string> tokens)
	{
		var tokenList = tokens.ToList();
		var entities = await _context.PushTokens
			.Where(pt => tokenList.Contains(pt.Token))
			.ToListAsync();

		if (entities.Count > 0)
		{
			_context.PushTokens.RemoveRange(entities);
			await _context.SaveChangesAsync();
		}
	}
}
