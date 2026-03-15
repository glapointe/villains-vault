/**
 * NotificationPreference Entity Model
 * 
 * Stores per-user opt-in/out settings for each notification type.
 * One row per user, created on first push token registration.
 * All preferences default to true (opted in).
 */

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Falchion.Villains.Vault.Api.Data.Entities;

/// <summary>
/// Per-user notification preference settings
/// </summary>
public class NotificationPreference
{
	/// <summary>
	/// Primary key - auto-incrementing integer ID
	/// </summary>
	[Key]
	[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
	public int Id { get; set; }

	/// <summary>
	/// Foreign key to the user (one preference row per user)
	/// </summary>
	public int UserId { get; set; }

	/// <summary>
	/// Whether the user wants race result notifications
	/// </summary>
	public bool RaceResults { get; set; } = true;

	/// <summary>
	/// Whether the user wants DLS declaration event notifications
	/// </summary>
	public bool DlsDeclarations { get; set; } = true;

	/// <summary>
	/// Whether the user wants community event notifications
	/// </summary>
	public bool CommunityEvents { get; set; } = true;

	/// <summary>
	/// When this preference row was created
	/// </summary>
	public DateTime CreatedAt { get; set; }

	/// <summary>
	/// When preferences were last updated
	/// </summary>
	public DateTime UpdatedAt { get; set; }

	/// <summary>
	/// Navigation property to User
	/// </summary>
	[ForeignKey(nameof(UserId))]
	public User? User { get; set; }
}
