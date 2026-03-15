namespace Falchion.Villains.Vault.Api.Data.Entities;

/// <summary>
/// Represents a race entry for DLS (Dead Last Start) declaration tracking.
/// Created by admins before a race occurs so users can declare intent to DLS.
/// Once the race is scraped, declarations are matched to actual race results
/// to create follow entries. This is distinct from the community calendar;
/// its sole purpose is tracking DLS intentions for upcoming Disney races.
/// </summary>
public class DlsRace
{
	/// <summary>
	/// Primary key - auto-incrementing integer ID.
	/// </summary>
	public int Id { get; set; }

	/// <summary>
	/// The name of the race (e.g., "Walt Disney World Marathon 2026").
	/// </summary>
	public string Name { get; set; } = string.Empty;

	/// <summary>
	/// The date of the race.
	/// Used to match with scraped race results when the race is eventually imported.
	/// </summary>
	public DateTime RaceDate { get; set; }

	/// <summary>
	/// Optional foreign key to the actual Race entity once the race has been scraped.
	/// Null until the race results are imported and matched.
	/// </summary>
	public int? RaceId { get; set; }

	/// <summary>
	/// The ID of the admin user who created this DLS race entry.
	/// </summary>
	public int CreatedByUserId { get; set; }

	/// <summary>
	/// Timestamp when this DLS race entry was created.
	/// </summary>
	public DateTime CreatedAt { get; set; }

	/// <summary>
	/// Timestamp when this DLS race entry was last modified.
	/// </summary>
	public DateTime ModifiedAt { get; set; }

	// Navigation properties

	/// <summary>
	/// The actual race entity (once matched after scraping).
	/// </summary>
	public Race? Race { get; set; }

	/// <summary>
	/// The admin who created this DLS race entry.
	/// </summary>
	public User CreatedBy { get; set; } = null!;

	/// <summary>
	/// Collection of DLS declarations for this race.
	/// </summary>
	public ICollection<DlsDeclaration> Declarations { get; set; } = new List<DlsDeclaration>();
}
