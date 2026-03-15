using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.DTOs;

/// <summary>
/// Enriched follow DTO that includes race result, race, and event details
/// for dashboard display. Returned by the list-my-follows endpoint.
/// </summary>
public class EnrichedFollowDto
{
	// Follow fields
	public int FollowId { get; set; }
	public FollowType FollowType { get; set; }
	public bool? DeadLastStarted { get; set; }
	public DateTime FollowedAt { get; set; }

	// Race result fields
	public long RaceResultId { get; set; }
	public string RunnerName { get; set; } = string.Empty;
	public int Age { get; set; }
	public string? Hometown { get; set; }
	public TimeSpan? NetTime { get; set; }
	public TimeSpan? OverallPace { get; set; }
	public int? OverallPlace { get; set; }
	public int? Passes { get; set; }

	// Race fields
	public int RaceId { get; set; }
	public string RaceName { get; set; } = string.Empty;
	public DateTime RaceDate { get; set; }
	public RaceDistance Distance { get; set; }

	// Event fields
	public int EventId { get; set; }
	public string EventName { get; set; } = string.Empty;
	public EventSeries EventSeries { get; set; }
}
