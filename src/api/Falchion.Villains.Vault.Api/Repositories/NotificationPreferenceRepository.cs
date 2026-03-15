/**
 * Notification Preference Repository Implementation
 * 
 * Implements data access operations for NotificationPreference entity using Entity Framework Core.
 */

using Microsoft.EntityFrameworkCore;
using Falchion.Villains.Vault.Api.Data;
using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.Repositories;

/// <summary>
/// Repository for notification preference data access
/// </summary>
public class NotificationPreferenceRepository : INotificationPreferenceRepository
{
	private readonly ApplicationDbContext _context;

	public NotificationPreferenceRepository(ApplicationDbContext context)
	{
		_context = context;
	}

	/// <inheritdoc />
	public async Task<NotificationPreference> GetOrCreateAsync(int userId)
	{
		var existing = await _context.NotificationPreferences
			.FirstOrDefaultAsync(np => np.UserId == userId);

		if (existing != null) return existing;

		// Create with all defaults (opted in to everything)
		var preference = new NotificationPreference
		{
			UserId = userId,
			RaceResults = true,
			DlsDeclarations = true,
			CommunityEvents = true,
			CreatedAt = DateTime.UtcNow,
			UpdatedAt = DateTime.UtcNow,
		};

		_context.NotificationPreferences.Add(preference);
		await _context.SaveChangesAsync();
		return preference;
	}

	/// <inheritdoc />
	public async Task<NotificationPreference> UpdateAsync(NotificationPreference preference)
	{
		preference.UpdatedAt = DateTime.UtcNow;
		_context.NotificationPreferences.Update(preference);
		await _context.SaveChangesAsync();
		return preference;
	}

	/// <inheritdoc />
	public async Task<List<int>> GetOptedInUserIdsAsync(NotificationType notificationType)
	{
		// Users who have push tokens AND have not opted out of this notification type.
		// Users without a NotificationPreference row are considered opted-in (defaults are true).
		var usersWithTokens = _context.PushTokens
			.Select(pt => pt.UserId)
			.Distinct();

		var query = _context.Users
			.Where(u => usersWithTokens.Contains(u.Id));

		// Users with tokens but no preference row (default opted-in)
		var noPrefsQuery = query
			.GroupJoin(
				_context.NotificationPreferences,
				u => u.Id,
				np => np.UserId,
				(u, prefs) => new { u.Id, Pref = prefs.FirstOrDefault() })
			.Where(x => x.Pref == null)
			.Select(x => x.Id);

		// Users with tokens and explicit opt-in for this type
		// EF Core cannot translate switch expressions in expression trees, so we branch here
		var optedInQuery = notificationType switch
		{
			NotificationType.RaceResults => query
				.Join(_context.NotificationPreferences.Where(np => np.RaceResults),
					u => u.Id, np => np.UserId, (u, np) => u.Id),
			NotificationType.DlsDeclarations => query
				.Join(_context.NotificationPreferences.Where(np => np.DlsDeclarations),
					u => u.Id, np => np.UserId, (u, np) => u.Id),
			NotificationType.CommunityEvents => query
				.Join(_context.NotificationPreferences.Where(np => np.CommunityEvents),
					u => u.Id, np => np.UserId, (u, np) => u.Id),
			_ => query
				.Join(_context.NotificationPreferences,
					u => u.Id, np => np.UserId, (u, np) => u.Id),
		};

		return await noPrefsQuery.Union(optedInQuery).ToListAsync();
	}
}
