using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.DTOs;

/// <summary>
/// Event DTO with races included for public consumption.
/// </summary>
public class EventWithRacesDto
{
	public int Id { get; set; }
	public string Name { get; set; } = string.Empty;
	public string TrackShackUrl { get; set; } = string.Empty;
	public EventSeries EventSeries { get; set; }
    public DateTime CreatedAt { get; set; }
	public DateTime ModifiedAt { get; set; }
	public List<RaceDto> Races { get; set; } = new();

	/// <summary>
	/// Maps an Event entity with races to an EventWithRacesDto.
	/// </summary>
	public static EventWithRacesDto FromEntity(Event evt)
	{
		return new EventWithRacesDto
		{
			Id = evt.Id,
			Name = evt.Name,
			TrackShackUrl = evt.TrackShackUrl,
			EventSeries = evt.EventSeries,
            CreatedAt = evt.CreatedAt,
			ModifiedAt = evt.ModifiedAt,
			Races = evt.Races.Select(RaceDto.FromEntity<RaceDto>).OrderBy(r => r.RaceDate).ToList()
		};
	}
}
