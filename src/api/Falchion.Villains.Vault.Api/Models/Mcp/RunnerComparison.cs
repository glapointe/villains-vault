namespace Falchion.Villains.Vault.Api.Models.Mcp;

/// <summary>
/// Head-to-head comparison of two runners in the same race.
/// </summary>
public class RunnerComparison
{
	public int RaceId { get; set; }
	public string RaceName { get; set; } = string.Empty;
	public ComparisonRunner Runner1 { get; set; } = new();
	public ComparisonRunner Runner2 { get; set; } = new();
	public TimeSpan? NetTimeDifference { get; set; }
	public List<SplitComparison> SplitComparisons { get; set; } = [];
}
