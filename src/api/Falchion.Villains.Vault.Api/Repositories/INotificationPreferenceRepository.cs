/**
 * Notification Preference Repository Interface
 * 
 * Defines the contract for notification preference data access operations.
 */

using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.Repositories;

/// <summary>
/// Repository interface for notification preference operations
/// </summary>
public interface INotificationPreferenceRepository
{
	/// <summary>
	/// Get preferences for a user, creating defaults if none exist
	/// </summary>
	Task<NotificationPreference> GetOrCreateAsync(int userId);

	/// <summary>
	/// Update a user's notification preferences
	/// </summary>
	Task<NotificationPreference> UpdateAsync(NotificationPreference preference);

	/// <summary>
	/// Get all user IDs that have NOT opted out of a specific notification type
	/// </summary>
	Task<List<int>> GetOptedInUserIdsAsync(Enums.NotificationType notificationType);
}
