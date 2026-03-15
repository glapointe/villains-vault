using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.DTOs;

/// <summary>
/// DTO containing related race results for a runner across events.
/// Used to display navigation badges for the same runner's results in other races.
/// </summary>
public class RelatedRaceResultsDto
{
	/// <summary>
	/// The source result ID that was used to find related results.
	/// </summary>
	public long SourceResultId { get; set; }

	/// <summary>
	/// The source result's race ID.
	/// </summary>
	public int SourceRaceId { get; set; }

	/// <summary>
	/// Related results grouped by event.
	/// </summary>
	public List<RelatedEventResultsDto> Events { get; set; } = new();
}

/// <summary>
/// An event containing related race results for the same runner.
/// </summary>
public class RelatedEventResultsDto
{
	/// <summary>
	/// The event ID.
	/// </summary>
	public int EventId { get; set; }

	/// <summary>
	/// The event name.
	/// </summary>
	public string EventName { get; set; } = string.Empty;

	/// <summary>
	/// Races within this event with their matched results.
	/// </summary>
	public List<RelatedRaceResultItemDto> Races { get; set; } = new();
}

/// <summary>
/// A single race within an event and the matched result (if found) for the runner.
/// </summary>
public class RelatedRaceResultItemDto
{
	/// <summary>
	/// The race ID.
	/// </summary>
	public int RaceId { get; set; }

	/// <summary>
	/// The race name.
	/// </summary>
	public string RaceName { get; set; } = string.Empty;

	/// <summary>
	/// The race distance enum value.
	/// </summary>
	public RaceDistance Distance { get; set; }

	/// <summary>
	/// The race date.
	/// </summary>
	public DateTime RaceDate { get; set; }

	/// <summary>
	/// The matched result ID for this runner in this race.
	/// Null if no unique match could be determined.
	/// </summary>
	public long? ResultId { get; set; }
}
