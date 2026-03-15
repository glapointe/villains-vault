namespace Falchion.Villains.Vault.Api.Models.Mcp;

/// <summary>
/// A single segment of a runner's split analysis.
/// </summary>
public class SplitSegment
{
	public string Label { get; set; } = string.Empty;
	public TimeSpan CumulativeTime { get; set; }
	public TimeSpan SegmentTime { get; set; }
	public double SegmentDistanceMiles { get; set; }
	public TimeSpan? SegmentPace { get; set; }
}
