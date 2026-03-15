/**
 * PushToken Entity Model
 * 
 * Represents a registered push notification token for a user's device.
 * Each user can have multiple tokens (one per device).
 */

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Falchion.Villains.Vault.Api.Data.Entities;

/// <summary>
/// Push notification token for a user's device (Expo Push Token)
/// </summary>
public class PushToken
{
	/// <summary>
	/// Primary key - auto-incrementing integer ID
	/// </summary>
	[Key]
	[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
	public int Id { get; set; }

	/// <summary>
	/// Foreign key to the user who owns this token
	/// </summary>
	public int UserId { get; set; }

	/// <summary>
	/// The Expo push token string (e.g., "ExponentPushToken[...]")
	/// </summary>
	[Required]
	[MaxLength(512)]
	public required string Token { get; set; }

	/// <summary>
	/// Device platform: "ios" or "android"
	/// </summary>
	[Required]
	[MaxLength(20)]
	public required string Platform { get; set; }

	/// <summary>
	/// When this token was first registered
	/// </summary>
	public DateTime CreatedAt { get; set; }

	/// <summary>
	/// When this token was last refreshed/confirmed
	/// </summary>
	public DateTime UpdatedAt { get; set; }

	/// <summary>
	/// Navigation property to User
	/// </summary>
	[ForeignKey(nameof(UserId))]
	public User? User { get; set; }
}
