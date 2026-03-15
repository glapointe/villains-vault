/**
 * Community Race DTO
 * 
 * Data transfer object for community races returned by the API.
 */

using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.DTOs.Community;

/// <summary>
/// DTO representing a single race within a community event
/// </summary>
public class CommunityRaceDto
{
	/// <summary>Race ID</summary>
	public int Id { get; set; }

	/// <summary>Parent event ID</summary>
	public int CommunityEventId { get; set; }

	/// <summary>Date and time of the race</summary>
	public DateTime RaceDate { get; set; }

	/// <summary>Numeric distance value</summary>
	public decimal Distance { get; set; }

	/// <summary>Whether distance is in kilometers (false = miles)</summary>
	public bool IsKilometers { get; set; }

	/// <summary>Optional comments about the race</summary>
	public string? Comments { get; set; }

	/// <summary>Whether a virtual option is available</summary>
	public bool HasVirtualOption { get; set; }

	/// <summary>Whether this race is part of a challenge</summary>
	public bool IsPartOfChallenge { get; set; }

	/// <summary>Number of participants for this race</summary>
	public int ParticipantCount { get; set; }

	/// <summary>When the race was created</summary>
	public DateTime CreatedAt { get; set; }

	/// <summary>
	/// Map from entity to DTO
	/// </summary>
	public static CommunityRaceDto FromEntity(CommunityRace entity)
	{
		return new CommunityRaceDto
		{
			Id = entity.Id,
			CommunityEventId = entity.CommunityEventId,
			RaceDate = entity.RaceDate,
			Distance = entity.Distance,
			IsKilometers = entity.IsKilometers,
			Comments = entity.Comments,
			HasVirtualOption = entity.HasVirtualOption,
			IsPartOfChallenge = entity.IsPartOfChallenge,
			ParticipantCount = entity.Participations?.Count ?? 0,
			CreatedAt = entity.CreatedAt,
		};
	}
}
