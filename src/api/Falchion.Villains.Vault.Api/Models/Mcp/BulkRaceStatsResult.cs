using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.Models.Mcp;

/// <summary>
/// Summary statistics for a single race, used in bulk/cross-event queries.
/// Contains the key counts without the full detailed statistics (age group breakdowns, splits, etc.).
/// </summary>
public class BulkRaceStatsResult
{
	public int EventId { get; set; }
	public string EventName { get; set; } = string.Empty;
	public int RaceId { get; set; }
	public string RaceName { get; set; } = string.Empty;
	public DateTime RaceDate { get; set; }
	public RaceDistance Distance { get; set; }
	public EventSeries EventSeries { get; set; }

	// Runner counts
	public int TotalRunners { get; set; }
	public int MaleRunners { get; set; }
	public int FemaleRunners { get; set; }
	public int RunnerTypeRunner { get; set; }
	public int RunnerTypePushRim { get; set; }
	public int RunnerTypeHandCycle { get; set; }
	public int RunnerTypeDuo { get; set; }
	public int DNFCount { get; set; }
	public int RunnersOver16minPace { get; set; }
}
