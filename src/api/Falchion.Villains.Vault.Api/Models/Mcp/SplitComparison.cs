namespace Falchion.Villains.Vault.Api.Models.Mcp;

/// <summary>
/// Split-level comparison between two runners.
/// </summary>
public class SplitComparison
{
	public string Label { get; set; } = string.Empty;
	public TimeSpan? Runner1Time { get; set; }
	public TimeSpan? Runner2Time { get; set; }
	/// <summary>Runner1 - Runner2. Positive means Runner1 was slower.</summary>
	public TimeSpan? Difference { get; set; }
}
