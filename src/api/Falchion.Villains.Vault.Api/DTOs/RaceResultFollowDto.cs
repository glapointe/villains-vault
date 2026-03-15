/**
 * Race Result Follow Data Transfer Objects
 */

using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.DTOs;

/// <summary>
/// DTO representing a user's follow on a race result
/// </summary>
public class RaceResultFollowDto
{
	/// <summary>
	/// Follow ID
	/// </summary>
	public int Id { get; set; }

	/// <summary>
	/// The race result ID being followed
	/// </summary>
	public long RaceResultId { get; set; }

	/// <summary>
	/// The type of follow (Interested or Claimed)
	/// </summary>
	public FollowType FollowType { get; set; }

	/// <summary>
	/// Whether the user dead-last started the race (only for Claimed follows)
	/// </summary>
	public bool? DeadLastStarted { get; set; }

	/// <summary>
	/// When the follow was created
	/// </summary>
	public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Request DTO for creating a follow on a race result
/// </summary>
public class FollowRaceResultRequest
{
	/// <summary>
	/// The race result ID to follow
	/// </summary>
	public long RaceResultId { get; set; }

	/// <summary>
	/// The type of follow (0 = Interested, 1 = Claimed)
	/// </summary>
	public FollowType FollowType { get; set; }

	/// <summary>
	/// Whether the user dead-last started the race.
	/// Only applicable when FollowType is Claimed.
	/// </summary>
	public bool? DeadLastStarted { get; set; }
}

/// <summary>
/// Request DTO for updating an existing follow
/// </summary>
public class UpdateFollowRequest
{
	/// <summary>
	/// Updated DLS status for the follow.
	/// Only applicable for Claimed follows.
	/// </summary>
	public bool? DeadLastStarted { get; set; }
}
