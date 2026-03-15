using Microsoft.EntityFrameworkCore;
using Falchion.Villains.Vault.Api.Data;
using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.Repositories;

/// <summary>
/// Repository implementation for Event entity operations.
/// </summary>
public class EventRepository : IEventRepository
{
	private readonly ApplicationDbContext _context;

	public EventRepository(ApplicationDbContext context)
	{
		_context = context;
	}

    /// <inheritdoc/>
    public async Task<Event?> GetByUrlAsync(string normalizedUrl)
	{
		return await _context.Events
			.Include(e => e.Races)
			.FirstOrDefaultAsync(e => e.TrackShackUrl == normalizedUrl);
	}

    /// <inheritdoc/>
    public async Task<Event?> GetByIdAsync(int id)
	{
		return await _context.Events
			.Include(e => e.Races)
			.FirstOrDefaultAsync(e => e.Id == id);
	}

    /// <inheritdoc/>
    public async Task<List<Event>> GetAllWithRacesAsync()
	{
		var events = await _context.Events
			.Include(e => e.Races)
			.OrderByDescending(e => e.Races.Max(r => (DateTime?)r.RaceDate) ?? DateTime.MinValue)
			.ToListAsync();

		// Sort races within each event by race date (ascending)
		foreach (var evt in events)
		{
			evt.Races = evt.Races.OrderBy(r => r.RaceDate).ToList();
		}

		return events;
	}

    /// <inheritdoc/>
    public async Task<List<Event>> GetAllWithRacesByYearAsync(int year)
	{
		var events = await _context.Events
			.Include(e => e.Races)
			.Where(e => e.Races.Any(r => r.RaceDate.Year == year))
			.OrderByDescending(e => e.Races.Where(r => r.RaceDate.Year == year).Max(r => (DateTime?)r.RaceDate) ?? DateTime.MinValue)
			.ToListAsync();

		// Sort races within each event by race date (ascending)
		foreach (var evt in events)
		{
			evt.Races = evt.Races.OrderBy(r => r.RaceDate).ToList();
		}

		return events;
	}

    /// <inheritdoc/>
    public async Task<Event> CreateAsync(Event newEvent)
	{
		newEvent.CreatedAt = DateTime.UtcNow;
		newEvent.ModifiedAt = DateTime.UtcNow;
		newEvent.EventSeries = EventSeriesHelpers.ParseFromEventLabelDate(newEvent.Name, null);

		_context.Events.Add(newEvent);
		await _context.SaveChangesAsync();

		return newEvent;
	}

    /// <inheritdoc/>
    public async Task UpdateAsync(Event existingEvent)
	{
		existingEvent.ModifiedAt = DateTime.UtcNow;
		var parsedEventSeries = EventSeriesHelpers.ParseFromEventLabelDate(existingEvent.Name, null);
		if (existingEvent.EventSeries == EventSeries.Unknown && parsedEventSeries != EventSeries.Unknown)
		{
			existingEvent.EventSeries = parsedEventSeries;
		}
		await _context.SaveChangesAsync();
	}

    /// <inheritdoc/>
    public async Task<Event> CreateOrUpdateAsync(string normalizedUrl, string name, int userId)
	{
		var existingEvent = await GetByUrlAsync(normalizedUrl);

		if (existingEvent != null)
		{
			existingEvent.Name = name;
			await UpdateAsync(existingEvent);
			return existingEvent;
		}
		else
		{
			return await CreateAsync(new Event
			{
				TrackShackUrl = normalizedUrl,
				Name = name,
				SubmittedByUserId = userId
			});
		}
	}

    /// <inheritdoc/>
    public async Task<List<int>> GetAvailableYearsAsync(EventSeries? eventSeries = null)
	{
		var query = _context.Races.AsQueryable();

		if (eventSeries.HasValue)
		{
			query = query.Where(r => r.EventSeries == eventSeries.Value);
		}

		return await query
			.Select(r => r.RaceDate.Year)
			.Distinct()
			.ToListAsync();
	}

    /// <inheritdoc/>
    public async Task DeleteAsync(int eventId)
    {
        var existingEvent = await _context.Events.FirstOrDefaultAsync(e => e.Id == eventId);
        if (existingEvent != null)
        {
            _context.Events.Remove(existingEvent);
            await _context.SaveChangesAsync();
        }
        else
        {
            throw new InvalidOperationException($"Event with ID {eventId} does not exist.");
        }
    }
}