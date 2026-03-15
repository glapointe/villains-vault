namespace Falchion.Villains.Vault.Api.Enums;

/// <summary>
/// Represents the status of processing a single division within a race.
/// </summary>
public enum DivisionStatus
{
	/// <summary>
	/// Division has been discovered but not yet processed.
	/// </summary>
	Pending,

	/// <summary>
	/// Division is currently being processed.
	/// </summary>
	InProgress,

	/// <summary>
	/// Division completed successfully.
	/// </summary>
	Completed,

	/// <summary>
	/// Division processing failed.
	/// </summary>
	Failed
}
