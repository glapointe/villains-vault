using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.Data.Entities;

/// <summary>
/// Represents a runDisney event (e.g., "Walt Disney World Marathon Weekend 2024").
/// An event typically consists of multiple races (10K, Half Marathon, Full Marathon).
/// </summary>
public class Event
{
	/// <summary>
	/// Primary key.
	/// </summary>
	public int Id { get; set; }

	/// <summary>
	/// The normalized URL to the Track Shack event page.
	/// Used to identify existing events and avoid duplicates.
	/// </summary>
	public string TrackShackUrl { get; set; } = string.Empty;

	/// <summary>
	/// The name of the event (e.g., "Walt Disney World Marathon Weekend 2024").
	/// Auto-populated from Track Shack page but editable by admin.
	/// </summary>
	public string Name { get; set; } = string.Empty;

	/// <summary>
	/// The ID of the user who submitted this event.
	/// </summary>
	public int SubmittedByUserId { get; set; }

	/// <summary>
	/// When this event was first created.
	/// </summary>
	public DateTime CreatedAt { get; set; }

	/// <summary>
	/// When this event was last modified.
	/// </summary>
	public DateTime ModifiedAt { get; set; }

	// Navigation properties
	public User SubmittedBy { get; set; } = null!;
	public ICollection<Race> Races { get; set; } = new List<Race>();

    /// <summary>
    /// The event series this event belongs to (e.g., Disneyland Halloween, Disney World Marathon, etc.).
    /// Calculated from the event name when the event is created or updated.
    /// </summary>
	public EventSeries EventSeries { get; set; } = EventSeries.Unknown;
}