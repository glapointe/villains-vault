namespace Falchion.Villains.Vault.Api.Enums;

/// <summary>
/// Represents the status of a job processing race results.
/// </summary>
public enum JobStatus
{
	/// <summary>
	/// Job has been created and is waiting to be processed.
	/// </summary>
	Queued = 0,

	/// <summary>
	/// Job is currently being processed.
	/// </summary>
	InProgress = 1,

	/// <summary>
	/// Job completed successfully with all divisions parsed.
	/// </summary>
	Completed = 2,

	/// <summary>
	/// Job completed but some divisions failed to parse.
	/// </summary>
	PartiallyCompleted = 3,

	/// <summary>
	/// Job failed completely and could not parse any divisions.
	/// </summary>
	Failed = 4,

	/// <summary>
	/// Job was cancelled by the user before completion.
	/// </summary>
	Cancelled = 5
}
