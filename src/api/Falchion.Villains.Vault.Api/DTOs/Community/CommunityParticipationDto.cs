/**
 * Community Participation DTO
 * 
 * Data transfer object for community race participations returned by the API.
 */

using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.DTOs.Community;

/// <summary>
/// DTO representing a user's participation in a community race
/// </summary>
public class CommunityParticipationDto
{
	/// <summary>Participation ID</summary>
	public int Id { get; set; }

	/// <summary>The race this participation is for</summary>
	public int CommunityRaceId { get; set; }

	/// <summary>User ID of the participant</summary>
	public int UserId { get; set; }

	/// <summary>Display name of the participant</summary>
	public string? UserDisplayName { get; set; }

	/// <summary>Whether the user is DLSing this race</summary>
	public bool IsDls { get; set; }

	/// <summary>Whether the user is doing the challenge</summary>
	public bool IsChallenge { get; set; }

	/// <summary>Whether the user is doing it virtually</summary>
	public bool IsVirtual { get; set; }

	/// <summary>Whether the user is spectating</summary>
	public bool IsSpectator { get; set; }

	/// <summary>Optional notes (companions, travel plans, etc.)</summary>
	public string? Notes { get; set; }

	/// <summary>When the participation was created</summary>
	public DateTime CreatedAt { get; set; }

	/// <summary>
	/// Map from entity to DTO
	/// </summary>
	public static CommunityParticipationDto FromEntity(CommunityParticipation entity)
	{
		return new CommunityParticipationDto
		{
			Id = entity.Id,
			CommunityRaceId = entity.CommunityRaceId,
			UserId = entity.UserId,
			UserDisplayName = entity.User?.DisplayName ?? entity.User?.Email,
			IsDls = entity.IsDls,
			IsChallenge = entity.IsChallenge,
			IsVirtual = entity.IsVirtual,
			IsSpectator = entity.IsSpectator,
			Notes = entity.Notes,
			CreatedAt = entity.CreatedAt,
		};
	}
}
