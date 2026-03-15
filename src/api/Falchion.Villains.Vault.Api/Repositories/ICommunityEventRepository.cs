/**
 * Community Event Repository Interface
 * 
 * Data access abstraction for community events, races, and participations.
 */

using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.Repositories;

/// <summary>
/// Repository interface for community event data access
/// </summary>
public interface ICommunityEventRepository
{
	/// <summary>
	/// Get paged community events with optional filters
	/// </summary>
	Task<(List<CommunityEvent> Events, int TotalCount)> GetEventsPagedAsync(
		int page, int pageSize,
		int? year = null,
		string? name = null,
		string? location = null,
		bool includePast = false);

	/// <summary>
	/// Get upcoming community events (events with at least one future race)
	/// </summary>
	Task<List<CommunityEvent>> GetUpcomingEventsAsync(int count);

	/// <summary>
	/// Get a single community event by ID with all related data
	/// </summary>
	Task<CommunityEvent?> GetEventByIdAsync(int id);

	/// <summary>
	/// Get distinct years that have community race dates
	/// </summary>
	Task<List<int>> GetAvailableYearsAsync();

	/// <summary>
	/// Add a new community event (with nested races)
	/// </summary>
	Task<CommunityEvent> AddEventAsync(CommunityEvent communityEvent);

	/// <summary>
	/// Update an existing community event
	/// </summary>
	Task<CommunityEvent> UpdateEventAsync(CommunityEvent communityEvent);

	/// <summary>
	/// Delete a community event (cascade deletes races and participations)
	/// </summary>
	Task DeleteEventAsync(CommunityEvent communityEvent);

	/// <summary>
	/// Add a race to an existing community event
	/// </summary>
	Task<CommunityRace> AddRaceAsync(CommunityRace race);

	/// <summary>
	/// Update an existing community race
	/// </summary>
	Task<CommunityRace> UpdateRaceAsync(CommunityRace race);

	/// <summary>
	/// Delete a community race (cascade deletes participations)
	/// </summary>
	Task DeleteRaceAsync(CommunityRace race);

	/// <summary>
	/// Get a single community race by ID with navigation properties
	/// </summary>
	Task<CommunityRace?> GetRaceByIdAsync(int raceId);

	/// <summary>
	/// Get all participations for an event (across all races)
	/// </summary>
	Task<List<CommunityParticipation>> GetParticipationsForEventAsync(int eventId);

	/// <summary>
	/// Get the current user's participations for an event
	/// </summary>
	Task<List<CommunityParticipation>> GetMyParticipationsForEventAsync(int eventId, int userId);

	/// <summary>
	/// Replace all participations for a user on an event (delete existing, insert new)
	/// </summary>
	Task<List<CommunityParticipation>> SaveParticipationsAsync(int eventId, int userId, List<CommunityParticipation> participations);

	/// <summary>
	/// Delete all participations for a user on an event
	/// </summary>
	Task DeleteParticipationsForUserAsync(int eventId, int userId);
}
