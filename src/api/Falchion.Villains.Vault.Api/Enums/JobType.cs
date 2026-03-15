namespace Falchion.Villains.Vault.Api.Enums;

/// <summary>
/// Represents the type of work a job performs.
/// </summary>
public enum JobType
{
	/// <summary>
	/// Scrapes and parses race results from Track Shack.
	/// </summary>
	Scrape = 0,

	/// <summary>
	/// Recalculates pass counts (kills/assassins) and regenerates race statistics.
	/// </summary>
	RecalculateStats = 1
}
