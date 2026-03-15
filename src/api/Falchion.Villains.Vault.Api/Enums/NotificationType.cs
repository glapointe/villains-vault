/**
 * Notification Type Enum
 * 
 * Defines the types of push notifications the system can send.
 * Used for preference filtering and notification dispatch.
 */

namespace Falchion.Villains.Vault.Api.Enums;

/// <summary>
/// Types of push notifications the system can dispatch
/// </summary>
public enum NotificationType
{
	/// <summary>
	/// Sent when a new race has been scraped and results are available
	/// </summary>
	RaceResults,

	/// <summary>
	/// Sent when a new DLS declaration event is created
	/// </summary>
	DlsDeclarations,

	/// <summary>
	/// Sent when a new community event is created
	/// </summary>
	CommunityEvents
}
