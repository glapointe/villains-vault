/**
 * Community Event Request DTOs
 * 
 * Request objects for creating, updating, and managing community events,
 * races, and participations.
 */

namespace Falchion.Villains.Vault.Api.DTOs.Community;

/// <summary>
/// Request to create a new community event with one or more races
/// </summary>
public class CreateCommunityEventRequest
{
	/// <summary>Event title (required)</summary>
	public string Title { get; set; } = string.Empty;

	/// <summary>Optional link to event website</summary>
	public string? Link { get; set; }

	/// <summary>Optional comments about the event</summary>
	public string? Comments { get; set; }

	/// <summary>Optional event location</summary>
	public string? Location { get; set; }

	/// <summary>Races to create with the event (at least one required)</summary>
	public List<CreateCommunityRaceRequest> Races { get; set; } = new();
}

/// <summary>
/// Request to create a single community race (used within event creation or when adding a race)
/// </summary>
public class CreateCommunityRaceRequest
{
	/// <summary>Date and time of the race</summary>
	public DateTime RaceDate { get; set; }

	/// <summary>Numeric distance value (e.g. 5, 13.1, 26.2)</summary>
	public decimal Distance { get; set; }

	/// <summary>Whether the distance is in kilometers (false = miles)</summary>
	public bool IsKilometers { get; set; }

	/// <summary>Optional comments about the race</summary>
	public string? Comments { get; set; }

	/// <summary>Whether the race offers a virtual option</summary>
	public bool HasVirtualOption { get; set; }

	/// <summary>Whether this race is part of a challenge</summary>
	public bool IsPartOfChallenge { get; set; }
}

/// <summary>
/// Request to update a community event (all fields optional — only provided fields are updated)
/// </summary>
public class UpdateCommunityEventRequest
{
	/// <summary>Updated title</summary>
	public string? Title { get; set; }

	/// <summary>Updated link</summary>
	public string? Link { get; set; }

	/// <summary>Updated comments</summary>
	public string? Comments { get; set; }

	/// <summary>Updated location</summary>
	public string? Location { get; set; }
}

/// <summary>
/// Request to update a community race (all fields optional — only provided fields are updated)
/// </summary>
public class UpdateCommunityRaceRequest
{
	/// <summary>Updated race date</summary>
	public DateTime? RaceDate { get; set; }

	/// <summary>Updated distance</summary>
	public decimal? Distance { get; set; }

	/// <summary>Updated kilometer flag</summary>
	public bool? IsKilometers { get; set; }

	/// <summary>Updated comments</summary>
	public string? Comments { get; set; }

	/// <summary>Updated virtual option flag</summary>
	public bool? HasVirtualOption { get; set; }

	/// <summary>Updated challenge flag</summary>
	public bool? IsPartOfChallenge { get; set; }
}

/// <summary>
/// Request to save participation for an event (batch of per-race entries).
/// Replaces all existing participations for the user on this event.
/// </summary>
public class SaveCommunityParticipationRequest
{
	/// <summary>Per-race participation entries</summary>
	public List<RaceParticipationEntry> Entries { get; set; } = new();
}

/// <summary>
/// A single race participation entry within a batch save
/// </summary>
public class RaceParticipationEntry
{
	/// <summary>The community race ID</summary>
	public int CommunityRaceId { get; set; }

	/// <summary>Whether the user is DLSing this race</summary>
	public bool IsDls { get; set; }

	/// <summary>Whether the user is doing the challenge</summary>
	public bool IsChallenge { get; set; }

	/// <summary>Whether the user is doing it virtually</summary>
	public bool IsVirtual { get; set; }

	/// <summary>Whether the user is just spectating</summary>
	public bool IsSpectator { get; set; }

	/// <summary>Optional notes (companions, travel plans, etc.)</summary>
	public string? Notes { get; set; }
}
