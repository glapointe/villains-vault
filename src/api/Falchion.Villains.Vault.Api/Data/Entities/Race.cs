using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Models;

namespace Falchion.Villains.Vault.Api.Data.Entities;

/// <summary>
/// Represents a specific race within an event (e.g., "10K" or "Half Marathon").
/// </summary>
public class Race
{
	/// <summary>
	/// Primary key.
	/// </summary>
	public int Id { get; set; }

	/// <summary>
	/// Foreign key to the parent event.
	/// </summary>
	public int EventId { get; set; }

	/// <summary>
	/// The normalized URL to the Track Shack race results page.
	/// Used to identify existing races and avoid duplicates.
	/// </summary>
	public string TrackShackUrl { get; set; } = string.Empty;

	/// <summary>
	/// The name of the race (e.g., "10K" or "Half Marathon").
	/// Editable by admin during submission.
	/// </summary>
	public string Name { get; set; } = string.Empty;

	/// <summary>
	/// The date when the race took place.
	/// </summary>
	public DateTime RaceDate { get; set; }

	/// <summary>
	/// The distance of the race (e.g., 5K, 10K, Half Marathon, Full Marathon).
	/// </summary>
	public RaceDistance Distance { get; set; }

	/// <summary>
	/// Admin notes about the race in plain text format.
	/// Can be rich text formatted on the frontend.
	/// Used to communicate data issues or fun facts to end users.
	/// </summary>
	public string? Notes { get; set; }

	/// <summary>
	/// Race metadata stored as JSON.
	/// Contains information like available split times.
	/// </summary>
	public string MetadataJson { get; set; } = "{}";

	/// <summary>
	/// Weather data for the race day stored as JSON from Open-Meteo API.
	/// Includes hourly and daily weather metrics.
	/// Null if weather data has not been fetched yet.
	/// </summary>
	public string? WeatherDataJson { get; set; }

    /// <summary>
    /// Pre-calculated statistics for the race stored as JSON.
    /// </summary>
    public string? StatisticsJson { get; set; }

    /// <summary>
    /// When this race was first created.
    /// </summary>
    public DateTime CreatedAt { get; set; }

	/// <summary>
	/// When this race was last modified.
	/// </summary>
	public DateTime ModifiedAt { get; set; }

	// Navigation properties
	public Event Event { get; set; } = null!;
	public ICollection<Division> Divisions { get; set; } = new List<Division>();
	public ICollection<RaceResult> Results { get; set; } = new List<RaceResult>();
	public ICollection<Job> Jobs { get; set; } = new List<Job>();

	/// <summary>
	/// The event series this race belongs to.
	/// Persisted on the Race for efficient queries without joining to Event.
	/// Set/validated when races are created or imported.
	/// </summary>
	public EventSeries EventSeries { get; set; } = EventSeries.Unknown;
}
