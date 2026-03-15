namespace Falchion.Villains.Vault.Api.Data.Entities;

/// <summary>
/// Represents a division category within a race (e.g., Men 50-54, Women 18-24).
/// Divisions are discovered from the Track Shack results page dropdown.
/// </summary>
public class Division
{
	/// <summary>
	/// Primary key.
	/// </summary>
	public int Id { get; set; }

	/// <summary>
	/// Foreign key to the race this division belongs to.
	/// </summary>
	public int RaceId { get; set; }

	/// <summary>
	/// The value used in the Track Shack dropdown/URL (e.g., "K", "L", "M").
	/// This is the parameter sent to Track Shack to retrieve division-specific results.
	/// </summary>
	public string DivisionValue { get; set; } = string.Empty;

	/// <summary>
	/// The human-readable label from the Track Shack dropdown (e.g., "MEN -- 50 THROUGH 54").
	/// </summary>
	public string DivisionLabel { get; set; } = string.Empty;

	/// <summary>
	/// When this division was first discovered/created.
	/// </summary>
	public DateTime CreatedAt { get; set; }

	// Navigation properties
	public Race Race { get; set; } = null!;
	public ICollection<RaceResult> Results { get; set; } = new List<RaceResult>();
}
