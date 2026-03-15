

using Falchion.Villains.Vault.Api.Data.Entities;

/**
 * DLS Declaration Data Transfer Objects
 * 
 * DTOs for DLS races and declarations.
 */
namespace Falchion.Villains.Vault.Api.DTOs;

/// <summary>
/// DTO representing a DLS race entry for declaration tracking
/// </summary>
public class DlsRaceDto
{
	/// <summary>
	/// DLS race ID
	/// </summary>
	public int Id { get; set; }

	/// <summary>
	/// The name of the race
	/// </summary>
	public string Name { get; set; } = string.Empty;

	/// <summary>
	/// The date of the race
	/// </summary>
	public DateTime RaceDate { get; set; }

	/// <summary>
	/// The actual Race ID if the race has been scraped
	/// </summary>
	public int? RaceId { get; set; }

	/// <summary>
	/// When this DLS race entry was created
	/// </summary>
	public DateTime CreatedAt { get; set; }

	/// <summary>
	/// Count of DLS declarations for this race
	/// </summary>
	public int DeclarationCount { get; set; }

    /// <summary>
    /// Maps a DlsRace entity to a DlsRaceDto, including counting declarations.
    /// </summary>
    /// <param name="dlsRace"></param>
    /// <returns></returns>
    public static DlsRaceDto FromEntity(DlsRace dlsRace) {
		return new DlsRaceDto
		{
			Id = dlsRace.Id,
			Name = dlsRace.Name,
			RaceDate = dlsRace.RaceDate,
			RaceId = dlsRace.RaceId,
			CreatedAt = dlsRace.CreatedAt,
			DeclarationCount = dlsRace.Declarations?.Count ?? 0
		};
    }
}

/// <summary>
/// DTO representing a DLS declaration
/// </summary>
public class DlsDeclarationDto
{
	/// <summary>
	/// Declaration ID
	/// </summary>
	public int Id { get; set; }

	/// <summary>
	/// The DLS race ID
	/// </summary>
	public int DlsRaceId { get; set; }

	/// <summary>
	/// The DLS race name (for display)
	/// </summary>
	public string DlsRaceName { get; set; } = string.Empty;

	/// <summary>
	/// The runner's bib number, if known
	/// </summary>
	public int? BibNumber { get; set; }

	/// <summary>
	/// The user ID, if associated with a registered user
	/// </summary>
	public int? UserId { get; set; }

	/// <summary>
	/// The user's display name (if associated)
	/// </summary>
	public string? UserDisplayName { get; set; }

	/// <summary>
	/// Whether this is the user's first DLS
	/// </summary>
	public bool IsFirstDls { get; set; }

	/// <summary>
	/// Whether the user is going for kills
	/// </summary>
	public bool IsGoingForKills { get; set; }

	/// <summary>
	/// User's comments/motivation
	/// </summary>
	public string? Comments { get; set; }

	/// <summary>
	/// When this declaration was created
	/// </summary>
	public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Maps a DlsDeclaration entity to a DlsDeclarationDto.
    /// </summary>
    /// <param name="declaration"></param>
    /// <returns></returns>
    public static DlsDeclarationDto FromEntity(DlsDeclaration declaration)
    {
        return new DlsDeclarationDto
        {
            Id = declaration.Id,
            DlsRaceId = declaration.DlsRaceId,
            DlsRaceName = declaration.DlsRace?.Name ?? string.Empty,
            BibNumber = declaration.BibNumber,
            UserId = declaration.UserId,
            UserDisplayName = declaration.User?.DisplayName,
            IsFirstDls = declaration.IsFirstDls,
            IsGoingForKills = declaration.IsGoingForKills,
            Comments = declaration.Comments,
            CreatedAt = declaration.CreatedAt
        };
    }
}

/// <summary>
/// Request DTO for creating a DLS race entry (admin only)
/// </summary>
public class CreateDlsRaceRequest
{
	/// <summary>
	/// The name of the race
	/// </summary>
	public string Name { get; set; } = string.Empty;

	/// <summary>
	/// The date of the race
	/// </summary>
	public DateTime RaceDate { get; set; }

}

/// <summary>
/// Request DTO for updating a DLS race entry (admin only)
/// </summary>
public class UpdateDlsRaceRequest
{
	/// <summary>
	/// Updated race name
	/// </summary>
	public string? Name { get; set; }

	/// <summary>
	/// Updated race date
	/// </summary>
	public DateTime? RaceDate { get; set; }
}

/// <summary>
/// Request DTO for creating a DLS declaration (admin: by bib, user: self-declare)
/// </summary>
public class CreateDlsDeclarationRequest
{
	/// <summary>
	/// The DLS race ID to declare for
	/// </summary>
	public int DlsRaceId { get; set; }

	/// <summary>
	/// Optional bib number (admin can provide, user can add later)
	/// </summary>
	public int? BibNumber { get; set; }

	/// <summary>
	/// Whether this is the user's first DLS
	/// </summary>
	public bool IsFirstDls { get; set; }

	/// <summary>
	/// Whether the user is going for kills
	/// </summary>
	public bool IsGoingForKills { get; set; }

	/// <summary>
	/// Optional user comments
	/// </summary>
	public string? Comments { get; set; }
}

/// <summary>
/// Represents a request to import a DLS declaration.
/// </summary>
public class ImportDlsDeclarationRequest
{
    /// <summary>
    /// The user's display name (for imported declarations without a user account - attempt to match to an account, otherwise ignored).
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// Bib number is a required field for imports to allow matching to existing declarations and users. Admins can provide this when importing, users can add later if self-declaring without a bib.
    /// </summary>
    public int BibNumber { get; set; }

    /// <summary>
    /// Whether this is the user's first DLS
    /// </summary>
    public bool? IsFirstDls { get; set; }

    /// <summary>
    /// Whether the user is going for kills
    /// </summary>
    public bool? IsGoingForKills { get; set; }

    /// <summary>
    /// Optional user comments
    /// </summary>
    public string? Comments { get; set; }
}

/// <summary>
/// Request DTO for updating a DLS declaration
/// </summary>
public class UpdateDlsDeclarationRequest
{
	/// <summary>
	/// Updated bib number (user can add once they get it)
	/// </summary>
	public int? BibNumber { get; set; }

	/// <summary>
	/// Whether this is the user's first DLS
	/// </summary>
	public bool? IsFirstDls { get; set; }

	/// <summary>
	/// Whether the user is going for kills
	/// </summary>
	public bool? IsGoingForKills { get; set; }

	/// <summary>
	/// Optional user comments
	/// </summary>
	public string? Comments { get; set; }
}


