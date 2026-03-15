namespace Falchion.Villains.Vault.Api.Models.Mcp;

/// <summary>
/// Split analysis result for a runner, showing per-segment pacing.
/// </summary>
public class RunnerSplitAnalysis
{
	public long RaceResultId { get; set; }
	public bool HasSplitData { get; set; }
	public bool? IsNegativeSplit { get; set; }
	public TimeSpan? OverallPace { get; set; }
	public List<SplitSegment> Segments { get; set; } = [];
}
