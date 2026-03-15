/**
 * Community Participation Entity Model
 * 
 * Represents a user's participation in a specific community race.
 * Tracks participation type (running, DLS, virtual, spectating) and optional notes.
 */

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Falchion.Villains.Vault.Api.Data.Entities;

/// <summary>
/// Community participation entity representing a user's participation in a community race
/// </summary>
public class CommunityParticipation
{
	/// <summary>
	/// Primary key - auto-incrementing integer ID
	/// </summary>
	[Key]
	[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
	public int Id { get; set; }

	/// <summary>
	/// Foreign key to the community race
	/// </summary>
	public int CommunityRaceId { get; set; }

	/// <summary>
	/// Foreign key to the participating user
	/// </summary>
	public int UserId { get; set; }

	/// <summary>
	/// Whether the user is doing the DLS (Dopey-Like Streak) for this race
	/// </summary>
	public bool IsDls { get; set; }

	/// <summary>
	/// Whether the user is participating in the challenge (if race is part of one)
	/// </summary>
	public bool IsChallenge { get; set; }

	/// <summary>
	/// Whether the user is doing the virtual option (if offered)
	/// </summary>
	public bool IsVirtual { get; set; }

	/// <summary>
	/// Whether the user is just spectating (not running)
	/// </summary>
	public bool IsSpectator { get; set; }

	/// <summary>
	/// Optional notes (e.g. who else is going, travel plans, etc.)
	/// </summary>
	public string? Notes { get; set; }

	/// <summary>
	/// Timestamp when the participation was created
	/// </summary>
	public DateTime CreatedAt { get; set; }

	/// <summary>
	/// Timestamp when the participation was last modified
	/// </summary>
	public DateTime ModifiedAt { get; set; }

	// ── Navigation properties ──

	/// <summary>
	/// The community race being participated in
	/// </summary>
	public CommunityRace CommunityRace { get; set; } = null!;

	/// <summary>
	/// The participating user
	/// </summary>
	public User User { get; set; } = null!;
}
