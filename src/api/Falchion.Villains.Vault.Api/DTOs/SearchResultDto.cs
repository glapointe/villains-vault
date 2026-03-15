using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.DTOs;

/// <summary>
/// DTO for search-by-name results used by the "Find My Results" feature.
/// Includes a flag indicating whether the user has already followed the result.
/// </summary>
public class SearchResultDto
{
	public long ResultId { get; set; }
	public string RunnerName { get; set; } = string.Empty;
	public string EventName { get; set; } = string.Empty;
	public EventSeries EventSeries { get; set; }
	public string RaceName { get; set; } = string.Empty;
	public DateTime RaceDate { get; set; }
	public RaceDistance Distance { get; set; }
	public int? OverallPlace { get; set; }
	public TimeSpan? NetTime { get; set; }
	public TimeSpan? OverallPace { get; set; }
	public string? Hometown { get; set; }
}
