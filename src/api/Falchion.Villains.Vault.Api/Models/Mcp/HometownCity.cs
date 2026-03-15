namespace Falchion.Villains.Vault.Api.Models.Mcp;

/// <summary>
/// Represents a distinct city within a region found in race hometowns,
/// with runner counts broken down by runner type.
/// </summary>
public class HometownCity
{
	/// <summary>
	/// The city name (e.g., "Orlando").
	/// </summary>
	public string City { get; set; } = string.Empty;

	/// <summary>
	/// The full hometown string as it appears in race results (e.g., "Orlando, FL").
	/// </summary>
	public string FullHometown { get; set; } = string.Empty;

	/// <summary>
	/// The total number of participants from this city (all types).
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
