using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.Models;

/// <summary>
/// Represents the progress of parsing a single division within a race.
/// </summary>
public class DivisionProgress
{
	/// <summary>
	/// The value of the division from the dropdown (e.g., "MEN -- 14 THROUGH 17").
	/// Used when making the request to Track Shack to get division-specific results.
	/// </summary>
	public string DivisionValue { get; set; } = string.Empty;

	/// <summary>
	/// The human-readable name of the division.
	/// </summary>
	public string DivisionName { get; set; } = string.Empty;

	/// <summary>
	/// Total number of result records found in this division.
	/// </summary>
	public int RecordsParsed { get; set; }

	/// <summary>
	/// Number of new records added to the database for this division.
	/// </summary>
	public int RecordsAdded { get; set; }

	/// <summary>
	/// Number of existing records updated in the database for this division.
	/// </summary>
	public int RecordsUpdated { get; set; }

	/// <summary>
	/// Current status of processing this division.
	/// </summary>
	public DivisionStatus Status { get; set; } = DivisionStatus.Pending;

	/// <summary>
	/// Error message if the division processing failed, otherwise null.
	/// </summary>
	public string? ErrorMessage { get; set; }
}
