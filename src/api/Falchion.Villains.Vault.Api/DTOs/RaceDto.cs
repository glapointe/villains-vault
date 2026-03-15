using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Models;
using System.Text.Json;

namespace Falchion.Villains.Vault.Api.DTOs;

public class RaceDto
{
	public int Id { get; set; }
	public int EventId { get; set; }
	public string Name { get; set; } = string.Empty;
	public DateTime RaceDate { get; set; }
	public RaceDistance Distance { get; set; }
	public string? Notes { get; set; }
	public string TrackShackUrl { get; set; } = string.Empty;
	public RaceMetadata? Metadata { get; set; }
	public EventSeries EventSeries { get; set; }
	public DateTime CreatedAt { get; set; }
	public DateTime ModifiedAt { get; set; }
	public EventDto? Event { get; set; }

    /// <summary>
    /// Maps a Race entity to a RaceDto.
    /// </summary>
    public static T FromEntity<T>(Race race) where T : RaceDto, new()
	{
		return new T
		{
			Id = race.Id,
			EventId = race.EventId,
			Name = race.Name,
			RaceDate = race.RaceDate,
			Distance = race.Distance,
			Notes = race.Notes,
			TrackShackUrl = race.TrackShackUrl,
			Metadata = JsonSerializer.Deserialize<RaceMetadata>(race.MetadataJson),
			EventSeries = race.EventSeries,
			CreatedAt = race.CreatedAt,
			ModifiedAt = race.ModifiedAt,
			Event = race.Event != null ? EventDto.FromEntity(race.Event) : null
		};
	}
}
