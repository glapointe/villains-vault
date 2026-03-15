using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.Data.Entities;

/// <summary>
/// Represents a user's follow on a specific race result.
/// Users can follow results they are interested in or claim results as their own.
/// </summary>
public class RaceResultFollow
{
	/// <summary>
	/// Primary key - auto-incrementing integer ID.
	/// </summary>
	public int Id { get; set; }

	/// <summary>
	/// Foreign key to the user who is following this result.
	/// </summary>
	public int UserId { get; set; }

	/// <summary>
	/// Foreign key to the race result being followed.
	/// </summary>
	public long RaceResultId { get; set; }

	/// <summary>
	/// The type of follow (Interested or Claimed).
	/// </summary>
	public FollowType FollowType { get; set; }

	/// <summary>
	/// Whether the user dead-last started (DLS) the race.
	/// Only applicable when FollowType is Claimed. Null otherwise.
	/// </summary>
	public bool? DeadLastStarted { get; set; }

	/// <summary>
	/// Timestamp when the follow was created.
	/// </summary>
	public DateTime CreatedAt { get; set; }

	/// <summary>
	/// Timestamp when the follow was last modified.
	/// </summary>
	public DateTime ModifiedAt { get; set; }

	// Navigation properties

	/// <summary>
	/// The user who created this follow.
	/// </summary>
	public User User { get; set; } = null!;

	/// <summary>
	/// The race result being followed.
	/// </summary>
	public RaceResult RaceResult { get; set; } = null!;
}
