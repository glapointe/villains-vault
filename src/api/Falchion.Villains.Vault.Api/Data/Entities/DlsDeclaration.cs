namespace Falchion.Villains.Vault.Api.Data.Entities;

/// <summary>
/// Represents a user's declaration that they intend to Dead Last Start (DLS) an upcoming race.
/// Declarations can be created by admins (with bib numbers for known runners) or by users
/// self-declaring (with optional bib number added later).
/// </summary>
public class DlsDeclaration
{
	/// <summary>
	/// Primary key - auto-incrementing integer ID.
	/// </summary>
	public int Id { get; set; }

	/// <summary>
	/// Foreign key to the DLS race entry.
	/// </summary>
	public int DlsRaceId { get; set; }

	/// <summary>
	/// The runner's bib number, if known.
	/// May be null if the user self-declared but doesn't have their bib yet.
	/// </summary>
	public int? BibNumber { get; set; }

	/// <summary>
	/// Foreign key to the user, if this declaration is associated with a registered user.
	/// Nullable to support potential future admin-seeded or imported declarations
	/// where only a bib number is known but no user account exists yet.
	/// Currently, all declarations are created via user self-declaration.
	/// </summary>
	public int? UserId { get; set; }

	/// <summary>
	/// Whether this is the user's first DLS attempt.
	/// </summary>
	public bool IsFirstDls { get; set; }

	/// <summary>
	/// Whether the user is going for kills (passing other runners).
	/// </summary>
	public bool IsGoingForKills { get; set; }

	/// <summary>
	/// Optional user comments (motivation, charity, etc.).
	/// </summary>
	public string? Comments { get; set; }

	/// <summary>
	/// Timestamp when this declaration was created.
	/// </summary>
	public DateTime CreatedAt { get; set; }

	/// <summary>
	/// Timestamp when this declaration was last modified.
	/// </summary>
	public DateTime ModifiedAt { get; set; }

	// Navigation properties

	/// <summary>
	/// The DLS race entry this declaration is for.
	/// </summary>
	public DlsRace DlsRace { get; set; } = null!;

	/// <summary>
	/// The user who made this declaration (if associated).
	/// </summary>
	public User? User { get; set; }
}
