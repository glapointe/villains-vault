namespace Falchion.Villains.Vault.Api.Models.Mcp;

/// <summary>
/// Percentile rankings for a runner across different categories.
/// </summary>
public class RunnerPercentiles
{
	public long RaceResultId { get; set; }
	public double? OverallPercentile { get; set; }
	public double? GenderPercentile { get; set; }
	public double? DivisionPercentile { get; set; }
	public int? OverallPlace { get; set; }
	public int TotalRunners { get; set; }
	public int? GenderPlace { get; set; }
	public int GenderRunners { get; set; }
	public int? DivisionPlace { get; set; }
	public int DivisionRunners { get; set; }
}
