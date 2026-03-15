/**
 * Community Race Entity Model
 * 
 * Represents a single race within a community event. Each event can have
 * multiple races of varying distances and dates.
 */

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Falchion.Villains.Vault.Api.Data.Entities;

/// <summary>
/// Community race entity representing a single race within a community event
/// </summary>
public class CommunityRace
{
	/// <summary>
	/// Primary key - auto-incrementing integer ID
	/// </summary>
	[Key]
	[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
	public int Id { get; set; }

	/// <summary>
	/// Foreign key to the parent community event
	/// </summary>
	public int CommunityEventId { get; set; }

	/// <summary>
	/// Date and time of the race
	/// </summary>
	public DateTime RaceDate { get; set; }

	/// <summary>
	/// Numeric distance value (e.g. 5, 13.1, 26.2)
	/// </summary>
	public decimal Distance { get; set; }

	/// <summary>
	/// Whether the distance is in kilometers (true) or miles (false)
	/// </summary>
	public bool IsKilometers { get; set; }

	/// <summary>
	/// Optional comments about the race
	/// </summary>
	public string? Comments { get; set; }

	/// <summary>
	/// Whether the race offers a virtual participation option
	/// </summary>
	public bool HasVirtualOption { get; set; }

	/// <summary>
	/// Whether this race is part of a challenge (multi-race challenge)
	/// </summary>
	public bool IsPartOfChallenge { get; set; }

	/// <summary>
	/// Timestamp when the race was created
	/// </summary>
	public DateTime CreatedAt { get; set; }

	/// <summary>
	/// Timestamp when the race was last modified
	/// </summary>
	public DateTime ModifiedAt { get; set; }

	// ── Navigation properties ──

	/// <summary>
	/// The parent community event
	/// </summary>
	public CommunityEvent CommunityEvent { get; set; } = null!;

	/// <summary>
	/// Participations for this race
	/// </summary>
	public ICollection<CommunityParticipation> Participations { get; set; } = new List<CommunityParticipation>();
}
