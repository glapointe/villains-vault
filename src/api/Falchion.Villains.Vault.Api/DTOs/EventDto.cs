using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.DTOs;

public class EventDto
{
	public int Id { get; set; }
	public string Name { get; set; } = string.Empty;
	public string TrackShackUrl { get; set; } = string.Empty;
	public EventSeries EventSeries { get; set; }
    public DateTime CreatedAt { get; set; }
	public DateTime ModifiedAt { get; set; }

	/// <summary>
	/// Maps an Event entity to an EventDto.
	/// </summary>
	public static EventDto FromEntity(Event evt)
	{
		return new EventDto
		{
			Id = evt.Id,
			Name = evt.Name,
			TrackShackUrl = evt.TrackShackUrl,
			EventSeries = evt.EventSeries,
			CreatedAt = evt.CreatedAt,
			ModifiedAt = evt.ModifiedAt
		};
	}
}
