using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.Repositories;

/// <summary>
/// Repository interface for Event entity operations.
/// </summary>
public interface IEventRepository
{
	/// <summary>
	/// Gets an event by its normalized Track Shack URL.
	/// </summary>
	Task<Event?> GetByUrlAsync(string normalizedUrl);

	/// <summary>
	/// Gets an event by its ID.
	/// </summary>
	Task<Event?> GetByIdAsync(int id);

	/// <summary>
	/// Gets all events with their races, ordered by creation date descending.
	/// </summary>
	Task<List<Event>> GetAllWithRacesAsync();

	/// <summary>
	/// Gets all events with their races for a specific year, ordered by creation date descending.
	/// </summary>
	/// <param name="year">The year to filter events by (based on race dates)</param>
	Task<List<Event>> GetAllWithRacesByYearAsync(int year);

	/// <summary>
	/// Creates a new event.
	/// </summary>
	Task<Event> CreateAsync(Event newEvent);

	/// <summary>
	/// Updates an existing event.
	/// </summary>
	Task UpdateAsync(Event existingEvent);

	/// <summary>
	/// Creates a new event or updates an existing one based on the normalized URL.
	/// Returns the created or updated event.
	/// </summary>
	/// <param name="normalizedUrl">The normalized Track Shack URL to check for existing event</param>
	/// <param name="name">The event name</param>
	/// <param name="userId">The ID of the user creating/updating the event</param>
	Task<Event> CreateOrUpdateAsync(string normalizedUrl, string name, int userId);

    /// <summary>
    /// Gets all available years that have events.
    /// Returns distinct years from race dates.
    /// <param name="eventSeries"/> can be used to filter years by a specific event series, or null to include all series.
    /// </summary>
    Task<List<int>> GetAvailableYearsAsync(EventSeries? eventSeries = null);

    /// <summary>
    /// Deletes an event by its ID.
    /// Also deletes all associated races and results, divisions, and jobs via cascading.
    /// </summary>
    /// <param name="eventId">The ID of the event to delete</param>
    Task DeleteAsync(int eventId);
}
