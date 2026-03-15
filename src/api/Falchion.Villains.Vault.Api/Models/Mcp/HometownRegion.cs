namespace Falchion.Villains.Vault.Api.Models.Mcp;

/// <summary>
/// Represents a distinct region (state or country) found in race hometowns.
/// </summary>
public class HometownRegion
{
	/// <summary>
	/// The region identifier � a 2-character US state code (e.g., "FL") or country name (e.g., "Brazil").
	/// </summary>
	public string Region { get; set; } = string.Empty;

	/// <summary>
	/// The country name. "United States" for 2-character state codes, otherwise the region value.
	/// </summary>
	public string Country { get; set; } = string.Empty;

	/// <summary>
	/// Whether this region is a US state (2-character alpha code).
	/// </summary>
	public bool IsUsState { get; set; }

	/// <summary>
	/// The number of distinct cities in this region for the race.
	/// </summary>
	public int CityCount { get; set; }

	/// <summary>
	/// The total number of participants from this region (all types).
	/// </summary>
	public int RunnerCount { get; set; }

	/// <summary>
	/// Number of standard runners.
	/// </summary>
	public int Runners { get; set; }

	/// <summary>
	/// Number of push rim wheelchair athletes.
	/// </summary>
	public int PushRim { get; set; }

	/// <summary>
	/// Number of hand cycle athletes.
	/// </summary>
	public int HandCycle { get; set; }

	/// <summary>
	/// Number of duo teams (visually impaired runner with guide).
	/// </summary>
	public int Duo { get; set; }
}
