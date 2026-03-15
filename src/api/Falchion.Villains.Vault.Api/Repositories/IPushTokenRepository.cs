/**
 * Push Token Repository Interface
 * 
 * Defines the contract for push token data access operations.
 */

using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.Repositories;

/// <summary>
/// Repository interface for push notification token operations
/// </summary>
public interface IPushTokenRepository
{
	/// <summary>
	/// Upsert a push token for a user (create or update if token already exists)
	/// </summary>
	Task<PushToken> UpsertTokenAsync(int userId, string token, string platform);

	/// <summary>
	/// Remove a specific push token
	/// </summary>
	Task<bool> RemoveTokenAsync(string token);

	/// <summary>
	/// Remove all push tokens for a user (e.g., on account deletion)
	/// </summary>
	Task RemoveAllTokensForUserAsync(int userId);

	/// <summary>
	/// Get push tokens for all users opted in to a specific notification type.
	/// Uses a join between PushTokens and NotificationPreferences (single query, no IN clause).
	/// </summary>
	Task<List<PushToken>> GetTokensForOptedInUsersAsync(NotificationType notificationType);

	/// <summary>
	/// Get all push tokens for a single user
	/// </summary>
	Task<List<PushToken>> GetTokensForUserAsync(int userId);

	/// <summary>
	/// Remove tokens by their token strings (for cleaning up invalid tokens)
	/// </summary>
	Task RemoveTokensByValueAsync(IEnumerable<string> tokens);
}
