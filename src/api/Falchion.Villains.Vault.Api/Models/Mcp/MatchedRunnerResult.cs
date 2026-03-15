using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.Models.Mcp;

/// <summary>
/// Represents a matched runner result found across events.
/// </summary>
public class MatchedRunnerResult
{
	public string EventName { get; set; } = string.Empty;
	public string RaceName { get; set; } = string.Empty;
	public EventSeries EventSeries { get; set; } = EventSeries.Unknown;
	public DateTime RaceDate { get; set; }
	public RaceDistance Distance { get; set; }
	public long ResultId { get; set; }
	public int? OverallPlace { get; set; }
	public TimeSpan? NetTime { get; set; }
	public TimeSpan? OverallPace { get; set; }
	public string? Hometown { get; set; }
}
