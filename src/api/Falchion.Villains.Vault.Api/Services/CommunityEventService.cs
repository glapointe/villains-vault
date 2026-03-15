/**
 * Community Event Service
 * 
 * Business logic layer for community events, races, and participations.
 * Handles validation, authorization checks, caching, and entity-to-DTO mapping.
 */

using Microsoft.Extensions.Caching.Memory;
using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.DTOs;
using Falchion.Villains.Vault.Api.DTOs.Community;
using Falchion.Villains.Vault.Api.Repositories;

namespace Falchion.Villains.Vault.Api.Services;

/// <summary>
/// Service for managing community events, races, and participations
/// </summary>
public class CommunityEventService
{
	private readonly ICommunityEventRepository _repository;
	private readonly PushNotificationService _pushNotificationService;
	private readonly IMemoryCache _cache;
	private readonly ILogger<CommunityEventService> _logger;

	private const string UpcomingEventsCacheKey = "community_upcoming_events";
	private const string AvailableYearsCacheKey = "community_available_years";
	private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(2);

	/// <summary>
	/// Constructor
	/// </summary>
	public CommunityEventService(
		ICommunityEventRepository repository,
		PushNotificationService pushNotificationService,
		IMemoryCache cache,
		ILogger<CommunityEventService> logger)
	{
		_repository = repository;
		_pushNotificationService = pushNotificationService;
		_cache = cache;
		_logger = logger;
	}

	/// <summary>
	/// Get paged community events with optional filters
	/// </summary>
	public async Task<PagedResultsDto<CommunityEventDto>> GetEventsPagedAsync(
		int page, int pageSize,
		int? year = null,
		string? name = null,
		string? location = null,
		bool includePast = false,
		int? currentUserId = null)
	{
		var (events, totalCount) = await _repository.GetEventsPagedAsync(
			page, pageSize, year, name, location, includePast);

		var dtos = events.Select(e => CommunityEventDto.FromEntity(e, currentUserId)).ToList();

		return new PagedResultsDto<CommunityEventDto>
		{
			Items = dtos,
			Page = page,
			PageSize = pageSize,
			TotalCount = totalCount,
			TotalPages = (int)Math.Ceiling((double)totalCount / pageSize),
		};
	}

	/// <summary>
	/// Get upcoming community events for the home sidebar
	/// </summary>
	public async Task<List<CommunityEventDto>> GetUpcomingEventsAsync(int count, int? currentUserId = null)
	{
		// When a user is authenticated, skip cache to include per-user participation state
		if (!currentUserId.HasValue)
		{
			var cacheKey = $"{UpcomingEventsCacheKey}_{count}";
			if (_cache.TryGetValue(cacheKey, out List<CommunityEventDto>? cached) && cached != null)
			{
				return cached;
			}

			var events = await _repository.GetUpcomingEventsAsync(count);
			var dtos = events.Select(e => CommunityEventDto.FromEntity(e)).ToList();

			_cache.Set(cacheKey, dtos, CacheDuration);
			return dtos;
		}
		else
		{
			var events = await _repository.GetUpcomingEventsAsync(count);
			return events.Select(e => CommunityEventDto.FromEntity(e, currentUserId)).ToList();
		}
	}

	/// <summary>
	/// Get a single community event by ID
	/// </summary>
	public async Task<CommunityEventDto?> GetEventByIdAsync(int id)
	{
		var entity = await _repository.GetEventByIdAsync(id);
		return entity == null ? null : CommunityEventDto.FromEntity(entity);
	}

	/// <summary>
	/// Get distinct years that have community events
	/// </summary>
	public async Task<List<int>> GetAvailableYearsAsync()
	{
		if (_cache.TryGetValue(AvailableYearsCacheKey, out List<int>? cached) && cached != null)
		{
			return cached;
		}

		var years = await _repository.GetAvailableYearsAsync();
		_cache.Set(AvailableYearsCacheKey, years, CacheDuration);
		return years;
	}

	/// <summary>
	/// Create a new community event with races
	/// </summary>
	public async Task<CommunityEventDto> CreateEventAsync(CreateCommunityEventRequest request, int userId)
	{
		// Validation
		if (string.IsNullOrWhiteSpace(request.Title))
			throw new InvalidOperationException("Event title is required.");

		if (request.Races == null || request.Races.Count == 0)
			throw new InvalidOperationException("At least one race is required.");

		foreach (var raceReq in request.Races)
		{
			if (raceReq.Distance <= 0)
				throw new InvalidOperationException("Race distance must be greater than zero.");
		}

		var entity = new CommunityEvent
		{
			Title = request.Title.Trim(),
			Link = request.Link?.Trim(),
			Comments = request.Comments?.Trim(),
			Location = request.Location?.Trim(),
			CreatedByUserId = userId,
			Races = request.Races.Select(r => new CommunityRace
			{
				RaceDate = r.RaceDate,
				Distance = r.Distance,
				IsKilometers = r.IsKilometers,
				Comments = r.Comments?.Trim(),
				HasVirtualOption = r.HasVirtualOption,
				IsPartOfChallenge = r.IsPartOfChallenge,
			}).ToList(),
		};

		var saved = await _repository.AddEventAsync(entity);
		InvalidateCache();

		// Notify users about new community event
		try
		{
			await _pushNotificationService.NotifyCommunityEventCreatedAsync(saved.Title, saved.Id);
		}
		catch (Exception ex)
		{
			_logger.LogWarning(ex, "Failed to send community event notification for {Title}", saved.Title);
		}

		_logger.LogInformation("Community event created: {Title} (ID: {Id}) by user {UserId}", saved.Title, saved.Id, userId);
		return CommunityEventDto.FromEntity(saved);
	}

	/// <summary>
	/// Update a community event (owner or admin only)
	/// </summary>
	public async Task<CommunityEventDto> UpdateEventAsync(int eventId, UpdateCommunityEventRequest request, int userId, bool isAdmin)
	{
		var entity = await _repository.GetEventByIdAsync(eventId)
			?? throw new InvalidOperationException("Event not found.");

		if (entity.CreatedByUserId != userId && !isAdmin)
			throw new UnauthorizedAccessException("Only the event creator or an admin can update this event.");

		if (request.Title != null) entity.Title = request.Title.Trim();
		if (request.Link != null) entity.Link = request.Link.Trim();
		if (request.Comments != null) entity.Comments = request.Comments.Trim();
		if (request.Location != null) entity.Location = request.Location.Trim();

		var updated = await _repository.UpdateEventAsync(entity);
		InvalidateCache();

		return CommunityEventDto.FromEntity(updated);
	}

	/// <summary>
	/// Delete a community event (owner or admin only)
	/// </summary>
	public async Task DeleteEventAsync(int eventId, int userId, bool isAdmin)
	{
		var entity = await _repository.GetEventByIdAsync(eventId)
			?? throw new InvalidOperationException("Event not found.");

		if (entity.CreatedByUserId != userId && !isAdmin)
			throw new UnauthorizedAccessException("Only the event creator or an admin can delete this event.");

		await _repository.DeleteEventAsync(entity);
		InvalidateCache();

		_logger.LogInformation("Community event deleted: {Title} (ID: {Id}) by user {UserId}", entity.Title, entity.Id, userId);
	}

	/// <summary>
	/// Add a race to an existing event (owner or admin only)
	/// </summary>
	public async Task<CommunityEventDto> AddRaceAsync(int eventId, CreateCommunityRaceRequest request, int userId, bool isAdmin)
	{
		var eventEntity = await _repository.GetEventByIdAsync(eventId)
			?? throw new InvalidOperationException("Event not found.");

		if (eventEntity.CreatedByUserId != userId && !isAdmin)
			throw new UnauthorizedAccessException("Only the event creator or an admin can add races.");

		if (request.Distance <= 0)
			throw new InvalidOperationException("Race distance must be greater than zero.");

		var race = new CommunityRace
		{
			CommunityEventId = eventId,
			RaceDate = request.RaceDate,
			Distance = request.Distance,
			IsKilometers = request.IsKilometers,
			Comments = request.Comments?.Trim(),
			HasVirtualOption = request.HasVirtualOption,
			IsPartOfChallenge = request.IsPartOfChallenge,
		};

		await _repository.AddRaceAsync(race);
		InvalidateCache();

		// Return the full updated event
		var updated = await _repository.GetEventByIdAsync(eventId);
		return CommunityEventDto.FromEntity(updated!);
	}

	/// <summary>
	/// Update a community race (event owner or admin only)
	/// </summary>
	public async Task<CommunityEventDto> UpdateRaceAsync(int raceId, UpdateCommunityRaceRequest request, int userId, bool isAdmin)
	{
		var race = await _repository.GetRaceByIdAsync(raceId)
			?? throw new InvalidOperationException("Race not found.");

		if (race.CommunityEvent.CreatedByUserId != userId && !isAdmin)
			throw new UnauthorizedAccessException("Only the event creator or an admin can update races.");

		if (request.RaceDate.HasValue) race.RaceDate = request.RaceDate.Value;
		if (request.Distance.HasValue)
		{
			if (request.Distance.Value <= 0)
				throw new InvalidOperationException("Race distance must be greater than zero.");
			race.Distance = request.Distance.Value;
		}
		if (request.IsKilometers.HasValue) race.IsKilometers = request.IsKilometers.Value;
		if (request.Comments != null) race.Comments = request.Comments.Trim();
		if (request.HasVirtualOption.HasValue) race.HasVirtualOption = request.HasVirtualOption.Value;
		if (request.IsPartOfChallenge.HasValue) race.IsPartOfChallenge = request.IsPartOfChallenge.Value;

		await _repository.UpdateRaceAsync(race);
		InvalidateCache();

		// Return the full updated event
		var updated = await _repository.GetEventByIdAsync(race.CommunityEventId);
		return CommunityEventDto.FromEntity(updated!);
	}

	/// <summary>
	/// Delete a community race (event owner or admin only)
	/// </summary>
	public async Task DeleteRaceAsync(int raceId, int userId, bool isAdmin)
	{
		var race = await _repository.GetRaceByIdAsync(raceId)
			?? throw new InvalidOperationException("Race not found.");

		if (race.CommunityEvent.CreatedByUserId != userId && !isAdmin)
			throw new UnauthorizedAccessException("Only the event creator or an admin can delete races.");

		// Don't allow deleting the last race in an event
		var eventEntity = await _repository.GetEventByIdAsync(race.CommunityEventId);
		if (eventEntity?.Races.Count <= 1)
			throw new InvalidOperationException("Cannot delete the last race in an event. Delete the event instead.");

		await _repository.DeleteRaceAsync(race);
		InvalidateCache();

		_logger.LogInformation("Community race deleted (ID: {RaceId}) from event {EventId} by user {UserId}", raceId, race.CommunityEventId, userId);
	}

	/// <summary>
	/// Get all participants for an event
	/// </summary>
	public async Task<List<CommunityParticipationDto>> GetParticipantsForEventAsync(int eventId)
	{
		var participations = await _repository.GetParticipationsForEventAsync(eventId);
		return participations.Select(CommunityParticipationDto.FromEntity).ToList();
	}

	/// <summary>
	/// Get the current user's participations for an event
	/// </summary>
	public async Task<List<CommunityParticipationDto>> GetMyParticipationsAsync(int eventId, int userId)
	{
		var participations = await _repository.GetMyParticipationsForEventAsync(eventId, userId);
		return participations.Select(CommunityParticipationDto.FromEntity).ToList();
	}

	/// <summary>
	/// Save the current user's participations for an event (batch upsert)
	/// </summary>
	public async Task<List<CommunityParticipationDto>> SaveParticipationsAsync(
		int eventId, SaveCommunityParticipationRequest request, int userId)
	{
		// Validate the event exists
		var eventEntity = await _repository.GetEventByIdAsync(eventId)
			?? throw new InvalidOperationException("Event not found.");

		// Validate all race IDs belong to this event
		var eventRaceIds = eventEntity.Races.Select(r => r.Id).ToHashSet();
		foreach (var entry in request.Entries)
		{
			if (!eventRaceIds.Contains(entry.CommunityRaceId))
				throw new InvalidOperationException($"Race ID {entry.CommunityRaceId} does not belong to this event.");
		}

		var participations = request.Entries.Select(e => new CommunityParticipation
		{
			CommunityRaceId = e.CommunityRaceId,
			UserId = userId,
			IsDls = e.IsDls,
			IsChallenge = e.IsChallenge,
			IsVirtual = e.IsVirtual,
			IsSpectator = e.IsSpectator,
			Notes = e.Notes?.Trim(),
		}).ToList();

		var saved = await _repository.SaveParticipationsAsync(eventId, userId, participations);
		InvalidateCache();

		return saved.Select(CommunityParticipationDto.FromEntity).ToList();
	}

	/// <summary>
	/// Withdraw all participation for the current user on an event
	/// </summary>
	public async Task WithdrawParticipationAsync(int eventId, int userId)
	{
		await _repository.DeleteParticipationsForUserAsync(eventId, userId);
		InvalidateCache();
	}

	/// <summary>
	/// Invalidate all community event caches
	/// </summary>
	private void InvalidateCache()
	{
		// Remove all known cache keys (upcoming events with various counts)
		for (var i = 1; i <= 50; i++)
		{
			_cache.Remove($"{UpcomingEventsCacheKey}_{i}");
		}
		_cache.Remove(AvailableYearsCacheKey);
	}
}
