namespace Falchion.Villains.Vault.Api.Models;

/// <summary>
/// Represents a single split time definition in a race.
/// Contains both the distance value and the label as it appears in the results.
/// </summary>
public class SplitTimeInfo
{
	/// <summary>
	/// The numeric distance value for this split.
	/// Can be in miles or kilometers depending on the label.
	/// Examples: 5.0 for "5K", 13.1 for "Half Marathon", 11.5 for "11.5 Mile"
	/// </summary>
	public double Distance { get; set; }

	/// <summary>
	/// The label for this split as it appears in the race results.
	/// Examples: "5K", "10K", "Half Marathon", "5 Mile", "11.5 Mile"
	/// </summary>
	public string Label { get; set; } = string.Empty;

	/// <summary>
	/// Indicates whether the distance is in kilometers (true) or miles (false).
	/// </summary>
	public bool IsKilometers { get; set; }
}
