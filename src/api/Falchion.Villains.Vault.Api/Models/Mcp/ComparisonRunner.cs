using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.Models.Mcp;

/// <summary>
/// Runner data used in a head-to-head comparison.
/// </summary>
public class ComparisonRunner
{
	public long ResultId { get; set; }
	public string Name { get; set; } = string.Empty;
	public int BibNumber { get; set; }
	public int Age { get; set; }
	public Gender Gender { get; set; }
	public int? OverallPlace { get; set; }
	public int? GenderPlace { get; set; }
	public int? DivisionPlace { get; set; }
	public TimeSpan? NetTime { get; set; }
	public TimeSpan? ClockTime { get; set; }
	public TimeSpan? OverallPace { get; set; }
	public string? Hometown { get; set; }
}
