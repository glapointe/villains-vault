/**
 * Community Event Repository Implementation
 * 
 * Data access layer for community events, races, and participations.
 * Uses Entity Framework Core for database operations.
 */

using Microsoft.EntityFrameworkCore;
using Falchion.Villains.Vault.Api.Data;
using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.Repositories;

/// <summary>
/// Repository implementation for community event data access
/// </summary>
public class CommunityEventRepository : ICommunityEventRepository
{
	private readonly ApplicationDbContext _context;

	/// <summary>
	/// Constructor
	/// </summary>
	public CommunityEventRepository(ApplicationDbContext context)
	{
		_context = context;
	}

	/// <inheritdoc />
	public async Task<(List<CommunityEvent> Events, int TotalCount)> GetEventsPagedAsync(
		int page, int pageSize,
		int? year = null,
		string? name = null,
		string? location = null,
		bool includePast = false)
	{
		var query = _context.CommunityEvents
			.Include(e => e.CreatedBy)
			.Include(e => e.Races)
				.ThenInclude(r => r.Participations)
			.AsQueryable();

		// Filter by year (any race in the event has a date in that year)
		if (year.HasValue)
		{
			query = query.Where(e => e.Races.Any(r => r.RaceDate.Year == year.Value));
		}

		// Filter by name (title contains)
		if (!string.IsNullOrWhiteSpace(name))
		{
			query = query.Where(e => e.Title.Contains(name));
		}

		// Filter by location (contains)
		if (!string.IsNullOrWhiteSpace(location))
		{
			query = query.Where(e => e.Location != null && e.Location.Contains(location));
		}

		// Exclude past events by default (events where ALL races are in the past)
		if (!includePast)
		{
			var now = DateTime.UtcNow.Date;
			query = query.Where(e => e.Races.Any(r => r.RaceDate >= now));
		}

		var totalCount = await query.CountAsync();

		// Order by earliest upcoming race date, then by title
		var events = await query
			.OrderBy(e => e.Races.Min(r => r.RaceDate))
			.ThenBy(e => e.Title)
			.Skip((page - 1) * pageSize)
			.Take(pageSize)
			.AsSplitQuery()
			.ToListAsync();

		return (events, totalCount);
	}

	/// <inheritdoc />
	public async Task<List<CommunityEvent>> GetUpcomingEventsAsync(int count)
	{
		var now = DateTime.UtcNow;

		return await _context.CommunityEvents
			.Include(e => e.CreatedBy)
			.Include(e => e.Races)
				.ThenInclude(r => r.Participations)
			.Where(e => e.Races.Any(r => r.RaceDate >= now))
			.OrderBy(e => e.Races.Where(r => r.RaceDate >= now).Min(r => r.RaceDate))
			.Take(count)
			.AsSplitQuery()
			.ToListAsync();
	}

	/// <inheritdoc />
	public async Task<CommunityEvent?> GetEventByIdAsync(int id)
	{
		return await _context.CommunityEvents
			.Include(e => e.CreatedBy)
			.Include(e => e.Races)
				.ThenInclude(r => r.Participations)
					.ThenInclude(p => p.User)
			.AsSplitQuery()
			.FirstOrDefaultAsync(e => e.Id == id);
	}

	/// <inheritdoc />
	public async Task<List<int>> GetAvailableYearsAsync()
	{
		return await _context.CommunityRaces
			.Select(r => r.RaceDate.Year)
			.Distinct()
			.OrderByDescending(y => y)
			.ToListAsync();
	}

	/// <inheritdoc />
	public async Task<CommunityEvent> AddEventAsync(CommunityEvent communityEvent)
	{
		_context.CommunityEvents.Add(communityEvent);
		await _context.SaveChangesAsync();

		// Reload with navigation properties
		return await GetEventByIdAsync(communityEvent.Id) ?? communityEvent;
	}

	/// <inheritdoc />
	public async Task<CommunityEvent> UpdateEventAsync(CommunityEvent communityEvent)
	{
		_context.CommunityEvents.Update(communityEvent);
		await _context.SaveChangesAsync();

		return await GetEventByIdAsync(communityEvent.Id) ?? communityEvent;
	}

	/// <inheritdoc />
	public async Task DeleteEventAsync(CommunityEvent communityEvent)
	{
		_context.CommunityEvents.Remove(communityEvent);
		await _context.SaveChangesAsync();
	}

	/// <inheritdoc />
	public async Task<CommunityRace> AddRaceAsync(CommunityRace race)
	{
		_context.CommunityRaces.Add(race);
		await _context.SaveChangesAsync();

		return await GetRaceByIdAsync(race.Id) ?? race;
	}

	/// <inheritdoc />
	public async Task<CommunityRace> UpdateRaceAsync(CommunityRace race)
	{
		_context.CommunityRaces.Update(race);
		await _context.SaveChangesAsync();

		return await GetRaceByIdAsync(race.Id) ?? race;
	}

	/// <inheritdoc />
	public async Task DeleteRaceAsync(CommunityRace race)
	{
		_context.CommunityRaces.Remove(race);
		await _context.SaveChangesAsync();
	}

	/// <inheritdoc />
	public async Task<CommunityRace?> GetRaceByIdAsync(int raceId)
	{
		return await _context.CommunityRaces
			.Include(r => r.CommunityEvent)
				.ThenInclude(e => e.CreatedBy)
			.Include(r => r.Participations)
				.ThenInclude(p => p.User)
			.FirstOrDefaultAsync(r => r.Id == raceId);
	}

	/// <inheritdoc />
	public async Task<List<CommunityParticipation>> GetParticipationsForEventAsync(int eventId)
	{
		return await _context.CommunityParticipations
			.Include(p => p.User)
			.Include(p => p.CommunityRace)
			.Where(p => p.CommunityRace.CommunityEventId == eventId)
			.OrderBy(p => p.CommunityRace.RaceDate)
			.ThenBy(p => p.User.DisplayName)
			.ToListAsync();
	}

	/// <inheritdoc />
	public async Task<List<CommunityParticipation>> GetMyParticipationsForEventAsync(int eventId, int userId)
	{
		return await _context.CommunityParticipations
			.Include(p => p.CommunityRace)
			.Where(p => p.CommunityRace.CommunityEventId == eventId && p.UserId == userId)
			.ToListAsync();
	}

	/// <inheritdoc />
	public async Task<List<CommunityParticipation>> SaveParticipationsAsync(
		int eventId, int userId, List<CommunityParticipation> participations)
	{
		// Delete existing participations for this user on this event
		var existing = await _context.CommunityParticipations
			.Where(p => p.CommunityRace.CommunityEventId == eventId && p.UserId == userId)
			.ToListAsync();

		if (existing.Count > 0)
		{
			_context.CommunityParticipations.RemoveRange(existing);
		}

		// Add new participations
		if (participations.Count > 0)
		{
			_context.CommunityParticipations.AddRange(participations);
		}

		await _context.SaveChangesAsync();

		// Return saved participations with navigation properties
		return await GetMyParticipationsForEventAsync(eventId, userId);
	}

	/// <inheritdoc />
	public async Task DeleteParticipationsForUserAsync(int eventId, int userId)
	{
		var existing = await _context.CommunityParticipations
			.Where(p => p.CommunityRace.CommunityEventId == eventId && p.UserId == userId)
			.ToListAsync();

		if (existing.Count > 0)
		{
			_context.CommunityParticipations.RemoveRange(existing);
			await _context.SaveChangesAsync();
		}
	}
}
