/**
 * Community Event DTO
 * 
 * Data transfer object for community events returned by the API.
 */

using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.DTOs.Community;

/// <summary>
/// DTO representing a community event with its races
/// </summary>
public class CommunityEventDto
{
	/// <summary>Event ID</summary>
	public int Id { get; set; }

	/// <summary>Event title</summary>
	public string Title { get; set; } = string.Empty;

	/// <summary>Optional link to event website</summary>
	public string? Link { get; set; }

	/// <summary>Optional comments about the event</summary>
	public string? Comments { get; set; }

	/// <summary>Optional event location</summary>
	public string? Location { get; set; }

	/// <summary>ID of the user who created the event</summary>
	public int CreatedByUserId { get; set; }

	/// <summary>Display name of the user who created the event</summary>
	public string? CreatedByDisplayName { get; set; }

	/// <summary>When the event was created</summary>
	public DateTime CreatedAt { get; set; }

	/// <summary>Races in this event</summary>
	public List<CommunityRaceDto> Races { get; set; } = new();

	/// <summary>Total distinct participants across all races</summary>
	public int ParticipantCount { get; set; }

	/// <summary>Whether the current authenticated user is participating in this event</summary>
	public bool IsCurrentUserGoing { get; set; }

	/// <summary>
	/// Map from entity to DTO
	/// </summary>
	public static CommunityEventDto FromEntity(CommunityEvent entity, int? currentUserId = null)
	{
		var races = entity.Races?.OrderBy(r => r.RaceDate).ToList() ?? new List<CommunityRace>();
		var allParticipations = races
			.SelectMany(r => r.Participations ?? new List<CommunityParticipation>())
			.ToList();
		var participantCount = allParticipations
			.Select(p => p.UserId)
			.Distinct()
			.Count();
		var isCurrentUserGoing = currentUserId.HasValue &&
			allParticipations.Any(p => p.UserId == currentUserId.Value);

		return new CommunityEventDto
		{
			Id = entity.Id,
			Title = entity.Title,
			Link = entity.Link,
			Comments = entity.Comments,
			Location = entity.Location,
			CreatedByUserId = entity.CreatedByUserId,
			CreatedByDisplayName = entity.CreatedBy?.DisplayName ?? entity.CreatedBy?.Email,
			CreatedAt = entity.CreatedAt,
			Races = races.Select(CommunityRaceDto.FromEntity).ToList(),
			ParticipantCount = participantCount,
			IsCurrentUserGoing = isCurrentUserGoing,
		};
	}
}
