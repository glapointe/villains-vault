/**
 * Push Notification Data Transfer Objects
 * 
 * DTOs for push token registration and notification preference management.
 */

using System.ComponentModel.DataAnnotations;

namespace Falchion.Villains.Vault.Api.DTOs;

/// <summary>
/// Request to register a push notification token for the current device
/// </summary>
public class RegisterPushTokenRequest
{
	/// <summary>
	/// Expo push token (e.g., "ExponentPushToken[...]")
	/// </summary>
	[Required]
	[MaxLength(512)]
	public required string Token { get; set; }

	/// <summary>
	/// Device platform ("ios" or "android")
	/// </summary>
	[Required]
	[MaxLength(20)]
	public required string Platform { get; set; }
}

/// <summary>
/// Request to unregister a push notification token
/// </summary>
public class UnregisterPushTokenRequest
{
	/// <summary>
	/// Expo push token to remove
	/// </summary>
	[Required]
	[MaxLength(512)]
	public required string Token { get; set; }
}

/// <summary>
/// DTO for notification preferences
/// </summary>
public class NotificationPreferenceDto
{
	/// <summary>
	/// Whether race result notifications are enabled
	/// </summary>
	public bool RaceResults { get; set; }

	/// <summary>
	/// Whether DLS declaration notifications are enabled
	/// </summary>
	public bool DlsDeclarations { get; set; }

	/// <summary>
	/// Whether community event notifications are enabled
	/// </summary>
	public bool CommunityEvents { get; set; }

	/// <summary>
	/// Create DTO from entity
	/// </summary>
	public static NotificationPreferenceDto FromEntity(Data.Entities.NotificationPreference entity) => new()
	{
		RaceResults = entity.RaceResults,
		DlsDeclarations = entity.DlsDeclarations,
		CommunityEvents = entity.CommunityEvents,
	};
}

/// <summary>
/// Request to update notification preferences
/// </summary>
public class UpdateNotificationPreferenceRequest
{
	/// <summary>
	/// Whether race result notifications are enabled
	/// </summary>
	public bool RaceResults { get; set; }

	/// <summary>
	/// Whether DLS declaration notifications are enabled
	/// </summary>
	public bool DlsDeclarations { get; set; }

	/// <summary>
	/// Whether community event notifications are enabled
	/// </summary>
	public bool CommunityEvents { get; set; }
}
