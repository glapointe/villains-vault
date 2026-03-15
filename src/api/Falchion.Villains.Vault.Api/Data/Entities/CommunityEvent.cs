/**
 * Community Event Entity Model
 * 
 * Represents a user-created community event (non-runDisney) that other users
 * can indicate participation in. Events contain one or more races of varying distances.
 */

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Falchion.Villains.Vault.Api.Data.Entities;

/// <summary>
/// Community event entity representing a user-created race event
/// </summary>
public class CommunityEvent
{
	/// <summary>
	/// Primary key - auto-incrementing integer ID
	/// </summary>
	[Key]
	[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
	public int Id { get; set; }

	/// <summary>
	/// Event title / name
	/// </summary>
	public string Title { get; set; } = string.Empty;

	/// <summary>
	/// Optional URL link to the event website or registration page
	/// </summary>
	public string? Link { get; set; }

	/// <summary>
	/// Optional comments or description about the event
	/// </summary>
	public string? Comments { get; set; }

	/// <summary>
	/// Optional location / venue for the event
	/// </summary>
	public string? Location { get; set; }

	/// <summary>
	/// Foreign key to the user who created this event
	/// </summary>
	public int CreatedByUserId { get; set; }

	/// <summary>
	/// Timestamp when the event was created
	/// </summary>
	public DateTime CreatedAt { get; set; }

	/// <summary>
	/// Timestamp when the event was last modified
	/// </summary>
	public DateTime ModifiedAt { get; set; }

	// ── Navigation properties ──

	/// <summary>
	/// The user who created this event
	/// </summary>
	public User CreatedBy { get; set; } = null!;

	/// <summary>
	/// Races associated with this event
	/// </summary>
	public ICollection<CommunityRace> Races { get; set; } = new List<CommunityRace>();
}
