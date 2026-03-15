using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Models;

namespace Falchion.Villains.Vault.Api.Data.Entities;

/// <summary>
/// Represents a background job for processing race data.
/// Jobs can scrape race results or recalculate statistics/passes.
/// </summary>
public class Job
{
	/// <summary>
	/// Primary key.
	/// </summary>
	public int Id { get; set; }

	/// <summary>
	/// Foreign key to the race being processed.
	/// </summary>
	public int RaceId { get; set; }

	/// <summary>
	/// The type of work this job performs.
	/// </summary>
	public JobType JobType { get; set; } = JobType.Scrape;

	/// <summary>
	/// Current status of the job.
	/// </summary>
	public JobStatus Status { get; set; } = JobStatus.Queued;

	/// <summary>
	/// Detailed progress data stored as JSON.
	/// Contains division-level progress and aggregate statistics.
	/// </summary>
	public string ProgressDataJson { get; set; } = "{}";

	/// <summary>
	/// The ID of the user who submitted this job.
	/// </summary>
	public int SubmittedByUserId { get; set; }

	/// <summary>
	/// Flag indicating that the user has requested cancellation.
	/// Checked by background service between divisions.
	/// </summary>
	public bool CancellationRequested { get; set; }

	/// <summary>
	/// When this job was created and queued.
	/// </summary>
	public DateTime CreatedAt { get; set; }

	/// <summary>
	/// When this job completed (successfully, partially, failed, or cancelled).
	/// Null if still in progress or queued.
	/// </summary>
	public DateTime? CompletedAt { get; set; }

	// Navigation properties
	public Race Race { get; set; } = null!;
	public User SubmittedBy { get; set; } = null!;
}
