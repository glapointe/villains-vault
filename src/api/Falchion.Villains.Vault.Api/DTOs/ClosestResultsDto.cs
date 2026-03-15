using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.DTOs;

/// <summary>
/// DTO containing race results closest to a target result by start time and finish time.
/// </summary>
public class ClosestResultsDto
{
	/// <summary>
	/// The target race result that was used to find closest starters and finishers.
	/// </summary>
	public RaceResultDto TargetResult { get; set; } = null!;

	/// <summary>
	/// The 20 closest starters (by start time), sorted by proximity to the target result.
	/// Includes runners who started both before and after the target runner.
	/// </summary>
	public List<RaceResultWithProximityDto> ClosestStarters { get; set; } = new();

	/// <summary>
	/// The 20 closest finishers (by finish time/net time), sorted by proximity to the target result.
	/// Includes runners who finished both before and after the target runner.
	/// </summary>
	public List<RaceResultWithProximityDto> ClosestFinishers { get; set; } = new();
}

/// <summary>
/// DTO for a race result with proximity information to a target result.
/// </summary>
public class RaceResultWithProximityDto : RaceResultDto
{
	/// <summary>
	/// Absolute time difference from the target result.
	/// For starters: difference in start time.
	/// For finishers: difference in finish time (net time).
	/// </summary>
	public TimeSpan TimeDifference { get; set; }

	/// <summary>
	/// Creates a RaceResultWithProximityDto from a RaceResult entity and time difference.
	/// </summary>
	public static RaceResultWithProximityDto FromEntityWithProximity(RaceResult result, TimeSpan timeDifference)
	{
		var dto = FromEntity<RaceResultWithProximityDto>(result);
		dto.TimeDifference = timeDifference;
		return dto;
	}
}
