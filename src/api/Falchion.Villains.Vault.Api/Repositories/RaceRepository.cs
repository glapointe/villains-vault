using Microsoft.EntityFrameworkCore;
using Falchion.Villains.Vault.Api.Data;
using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Models;
using Falchion.Villains.Vault.Api.Utils;
using System.Text.Json;

namespace Falchion.Villains.Vault.Api.Repositories;

/// <summary>
/// Repository implementation for Race entity operations.
/// </summary>
public class RaceRepository : IRaceRepository
{
	private readonly ApplicationDbContext _context;

	public RaceRepository(ApplicationDbContext context)
	{
		_context = context;
	}

    /// <inheritdoc/>
    public async Task<Race?> GetByUrlAsync(string normalizedUrl)
	{
		return await _context.Races
			.FirstOrDefaultAsync(r => r.TrackShackUrl == normalizedUrl);
	}

    /// <inheritdoc/>
    public async Task<Race?> GetByIdAsync(int id)
	{
		return await _context.Races
			.Include(r => r.Event)
			.FirstOrDefaultAsync(r => r.Id == id);
	}

    /// <inheritdoc/>
    public async Task<List<Race>> GetByEventIdAsync(int eventId)
	{
		return await _context.Races
			.Where(r => r.EventId == eventId)
			.OrderBy(r => r.RaceDate)
			.ToListAsync();
	}

    /// <inheritdoc/>
    public async Task<int> GetResultCountAsync(int raceId)
	{
		return await _context.RaceResults
			.Where(rr => rr.RaceId == raceId)
			.CountAsync();
	}

    /// <inheritdoc/>
    public async Task<Race> CreateAsync(Race newRace)
	{
		newRace.CreatedAt = DateTime.UtcNow;
		newRace.ModifiedAt = DateTime.UtcNow;

		// Compute EventSeries using the parent event name + race date
		var evt = await _context.Events.FirstOrDefaultAsync(e => e.Id == newRace.EventId);
		if (evt != null)
		{
			newRace.EventSeries = EventSeriesHelpers.ParseFromEventLabelDate(evt.Name, newRace.RaceDate);

			// Validate the parent Event's EventSeries — the race has the date for more accurate parsing
			if (evt.EventSeries != newRace.EventSeries)
			{
				evt.EventSeries = newRace.EventSeries;
				evt.ModifiedAt = DateTime.UtcNow;
			}
		}

		_context.Races.Add(newRace);
		await _context.SaveChangesAsync();

		return newRace;
	}

    /// <inheritdoc/>
    public async Task UpdateAsync(Race existingRace)
	{
		existingRace.ModifiedAt = DateTime.UtcNow;

		// Recompute EventSeries on update in case name/date changed
		var evt = await _context.Events.FirstOrDefaultAsync(e => e.Id == existingRace.EventId);
		if (evt != null)
		{
			existingRace.EventSeries = EventSeriesHelpers.ParseFromEventLabelDate(evt.Name, existingRace.RaceDate);
			if (evt.EventSeries != existingRace.EventSeries)
			{
				evt.EventSeries = existingRace.EventSeries;
				evt.ModifiedAt = DateTime.UtcNow;
			}
		}

		await _context.SaveChangesAsync();
	}

    /// <inheritdoc/>
    public async Task<Race> CreateOrUpdateAsync(int eventId, string normalizedUrl, string name, DateTime raceDate, RaceDistance distance, string? notes)
	{
		var existingRace = await GetByUrlAsync(normalizedUrl);

		if (existingRace != null)
		{
			existingRace.Name = name;
			existingRace.RaceDate = raceDate;
			existingRace.Distance = distance;
			existingRace.Notes = notes;
			await UpdateAsync(existingRace);
			return existingRace;
		}
		else
		{
			return await CreateAsync(new Race
			{
				EventId = eventId,
				TrackShackUrl = normalizedUrl,
				Name = name,
				RaceDate = raceDate,
				Distance = distance,
				Notes = notes,
				MetadataJson = "{}"
			});
		}
	}

    /// <inheritdoc/>
    public async Task DeleteAsync(int raceId)
	{
		var existingRace = await _context.Races.FirstOrDefaultAsync(r => r.Id == raceId);
		if (existingRace != null)
		{
			_context.Races.Remove(existingRace);
			await _context.SaveChangesAsync();
		}
		else
		{
			throw new InvalidOperationException($"Race with ID {raceId} does not exist.");
		}
	}

    /// <inheritdoc/>
    public async Task<int> GetDnfCountAsync(int raceId)
	{
		// DNF runners have OverallPlace of null or 0
		var count = await _context.RaceResults
			.Where(r => r.RaceId == raceId)
			.Where(r => !r.OverallPlace.HasValue || r.OverallPlace.Value == 0)
			.CountAsync();

		return count;
	}

    /// <inheritdoc/>
    public async Task<RaceStats> BuildRaceStats(int raceId)
	{
		// Generate and return the RaceStats object for the specified race.
		var race = await GetByIdAsync(raceId);
		if (race == null)
		{
			throw new InvalidOperationException($"Race with ID {raceId} does not exist.");
		}

		var results = await _context.RaceResults.Where(r => r.RaceId == raceId).ToListAsync();
		return RaceAnalyzer.BuildRaceStats(race, results);
    }
}
