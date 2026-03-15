using Microsoft.EntityFrameworkCore;
using Falchion.Villains.Vault.Api.Data;
using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Enums;
using System.Linq.Expressions;

namespace Falchion.Villains.Vault.Api.Repositories;

/// <summary>
/// Repository implementation for RaceResult entity operations.
/// </summary>
public class ResultRepository : IResultRepository
{
    private readonly ApplicationDbContext _context;
    private const int BatchSize = 500;

    public ResultRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<RaceResult?> GetByIdAsync(long raceResultId)
    {
        return _context.RaceResults
            .Include(r => r.Division)
            .FirstOrDefaultAsync(r => r.Id == raceResultId);
    }

    public Task<RaceResult?> GetByBibNumberAsync(int raceId, int bibNumber)
    {
        return _context.RaceResults
            .Include(r => r.Division)
            .Where(r => r.RaceId == raceId
                && r.BibNumber == bibNumber)
            .FirstOrDefaultAsync();
    }

    public async Task<List<RaceResult>> GetByBibNumbersAsync(int raceId, IEnumerable<int> bibNumbers)
    {
        var bibList = bibNumbers.ToList();
        return await _context.RaceResults
            .Include(r => r.Division)
            .Where(r => r.RaceId == raceId
                && bibList.Contains(r.BibNumber))
            .ToListAsync();
    }

    public async Task<List<RaceResult>> GetRaceResultsByRaceIdAsync(
		int raceId,
		RaceResultColumn sortField = RaceResultColumn.OverallPlace,
		SortDirection sortDirection = SortDirection.Ascending)
    {
		// Exclude DNF runners (OverallPlace is null or 0 for DNF)
		var query = _context.RaceResults
			.Where(r => r.RaceId == raceId)
			.Where(r => r.OverallPlace.HasValue && r.OverallPlace.Value > 0);

		query = ApplySorting(query, sortField, sortDirection);

        var results = await query.ToListAsync();
        return results;
    }

	public async Task<(List<RaceResult> Results, int TotalCount)> GetFilteredPagedResultsAsync(
		int raceId,
		int? divisionId,
		Gender? gender,
		string? searchTerm,
		RaceResultColumn sortField,
		SortDirection sortDirection,
		int page,
		int pageSize,
		string? region = null)
	{
		// Start with base query, include Division for export scenarios
		var query = _context.RaceResults
			.Include(r => r.Division)
			.Where(r => r.RaceId == raceId);

		// Apply division filter if provided
		if (divisionId.HasValue)
		{
			query = query.Where(r => r.DivisionId == divisionId.Value);
		}
		else
		{
			// Exclude DNF runners unless explicitly requesting a specific division (OverallPlace is null or 0 for DNF)
			query = query.Where(r => r.OverallPlace.HasValue && r.OverallPlace.Value > 0);
		}

		// Apply gender filter if provided (always include Unknown)
		if (gender.HasValue)
		{
			if (gender.Value == Gender.Male)
			{
				query = query.Where(r => r.Gender == Gender.Male || r.Gender == Gender.Unknown);
			}
			else if (gender.Value == Gender.Female)
			{
				query = query.Where(r => r.Gender == Gender.Female || r.Gender == Gender.Unknown);
			}
		}

		// Apply search term filter (OR across BibNumber, Name, Hometown)
		// Use EF.Functions.Like for case-insensitive search
		if (!string.IsNullOrWhiteSpace(searchTerm))
		{
			var searchPattern = $"{searchTerm}%";
			var searchPatternFull = $"%{searchTerm}%";
			query = query.Where(r =>
				EF.Functions.Like(r.BibNumber.ToString(), searchPattern) ||
				EF.Functions.Like(r.Name, searchPatternFull) ||
				(r.Hometown != null && EF.Functions.Like(r.Hometown, searchPatternFull))
			);
		}

		// Apply region filter (matches hometown ending with ", REGION")
		if (!string.IsNullOrWhiteSpace(region))
		{
			var regionSuffix = $"%, {region.Trim()}";
			query = query.Where(r => r.Hometown != null && EF.Functions.Like(r.Hometown, regionSuffix));
		}

		// Get total count before paging
		var totalCount = await query.CountAsync();

		// Apply sorting and paging
		query = ApplySorting(query, sortField, sortDirection);

		var results = await query
			.Skip((page - 1) * pageSize)
			.Take(pageSize)
			.ToListAsync();

		return (results, totalCount);
	}

	public async Task<int> GetRaceResultsCountAsync(int raceId, int? divisionId = null, Gender? gender = null, RunnerType? runnerType = null)
	{
		var query = _context.RaceResults
			.Where(r => r.RaceId == raceId);

		// Exclude DNF runners unless explicitly requesting a specific division (OverallPlace is null or 0 for DNF)
		if (!divisionId.HasValue)
		{
			query = query.Where(r => r.OverallPlace.HasValue && r.OverallPlace.Value > 0);
		}

		query = ApplyStreamFilters(query, divisionId, gender, runnerType);

		return await query.CountAsync();
	}

	public async Task<List<RaceResult>> GetFilteredResultsAsync(
		int raceId,
		int? divisionId,
		Gender? gender,
		RunnerType? runnerType,
		RaceResultColumn sortField,
		SortDirection sortDirection,
		int page,
		int pageSize,
		string? region = null)
	{
		var query = _context.RaceResults
			.Include(r => r.Division)
			.Where(r => r.RaceId == raceId);

		// Exclude DNF runners unless explicitly requesting a specific division (OverallPlace is null or 0 for DNF)
		if (!divisionId.HasValue)
		{
			query = query.Where(r => r.OverallPlace.HasValue && r.OverallPlace.Value > 0);
		}

		query = ApplyStreamFilters(query, divisionId, gender, runnerType);

		// Apply region filter (matches hometown ending with ", REGION")
		if (!string.IsNullOrWhiteSpace(region))
		{
			var regionSuffix = $"%, {region.Trim()}";
			query = query.Where(r => r.Hometown != null && EF.Functions.Like(r.Hometown, regionSuffix));
		}

		query = ApplySorting(query, sortField, sortDirection);

		var results = await query
			.Skip((page - 1) * pageSize)
			.Take(pageSize)
			.ToListAsync();

		return results;
	}

    public async Task<(int Added, int Updated)> BatchUpsertAsync(int raceId, List<RaceResult> results)
    {
        // Get all existing results for this race
        var existingResults = await _context.RaceResults.Where(r => r.RaceId == raceId).ToListAsync();
        var resultsByBibNumber = existingResults.ToDictionary(r => r.BibNumber, r => r);

        var toInsert = new List<RaceResult>();
        var toUpdate = new List<RaceResult>();

        // Separate results into inserts and updates
        foreach (var result in results)
        {
            result.RaceId = raceId;

            if (resultsByBibNumber.TryGetValue(result.BibNumber, out var existing))
            {
                // Check if data has actually changed
                if (HasChanged(existing, result))
                {
                    // Update existing entity
                    UpdateResultFields(existing, result);
                    existing.ModifiedAt = DateTime.UtcNow;
                    toUpdate.Add(existing);
                }
            }
            else
            {
                // New result
                result.CreatedAt = DateTime.UtcNow;
                result.ModifiedAt = DateTime.UtcNow;
                toInsert.Add(result);
            }
        }

        int totalAdded = 0;
        int totalUpdated = toUpdate.Count;

        // Process inserts in batches
        for (int i = 0; i < toInsert.Count; i += BatchSize)
        {
            var batch = toInsert.Skip(i).Take(BatchSize).ToList();
            try
            {
                _context.RaceResults.AddRange(batch);
                await _context.SaveChangesAsync();
                totalAdded += batch.Count;
            }
            catch (Exception ex)
            {
                // Log error but continue processing
                // In production, inject ILogger and log the error
                Console.WriteLine($"Error inserting batch: {ex.Message}");
            }
        }

        // Save updates (already tracked by EF)
        if (toUpdate.Any())
        {
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Log error
                Console.WriteLine($"Error updating results: {ex.Message}");
                totalUpdated = 0;
            }
        }

        return (totalAdded, totalUpdated);
    }

    /// <summary>
    /// Checks if any field has changed between existing and new result.
    /// </summary>
    private bool HasChanged(RaceResult existing, RaceResult newResult)
    {
        return existing.Name != newResult.Name ||
            existing.Age != newResult.Age ||
            existing.RunnerType != newResult.RunnerType ||
            existing.DivisionPlace != newResult.DivisionPlace ||
            existing.OverallPlace != newResult.OverallPlace ||
            existing.GenderPlace != newResult.GenderPlace ||
			existing.Gender != newResult.Gender ||
            existing.NetTime != newResult.NetTime ||
            existing.ClockTime != newResult.ClockTime ||
			existing.StartTime != newResult.StartTime ||
            existing.Hometown != newResult.Hometown ||
            existing.Split1 != newResult.Split1 ||
            existing.Split2 != newResult.Split2 ||
            existing.Split3 != newResult.Split3 ||
            existing.Split4 != newResult.Split4 ||
            existing.Split5 != newResult.Split5 ||
            existing.Split6 != newResult.Split6 ||
            existing.Split7 != newResult.Split7 ||
            existing.Split8 != newResult.Split8 ||
            existing.Split9 != newResult.Split9 ||
            existing.Split10 != newResult.Split10 ||
            existing.Passes != newResult.Passes ||
            existing.Passers != newResult.Passers ||
            existing.ResultDataJson != newResult.ResultDataJson;
    }

    /// <summary>
    /// Updates all fields from new result to existing result.
    /// </summary>
    private void UpdateResultFields(RaceResult existing, RaceResult newResult)
    {
        existing.Name = newResult.Name;
        existing.Age = newResult.Age;
        existing.RunnerType = newResult.RunnerType;
        existing.DivisionPlace = newResult.DivisionPlace;
        existing.OverallPlace = newResult.OverallPlace;
        existing.GenderPlace = newResult.GenderPlace;
		existing.Gender = newResult.Gender;
        existing.NetTime = newResult.NetTime;
        existing.ClockTime = newResult.ClockTime;
		existing.StartTime = newResult.StartTime;
        existing.Hometown = newResult.Hometown;
        existing.Split1 = newResult.Split1;
        existing.Split2 = newResult.Split2;
        existing.Split3 = newResult.Split3;
        existing.Split4 = newResult.Split4;
        existing.Split5 = newResult.Split5;
        existing.Split6 = newResult.Split6;
        existing.Split7 = newResult.Split7;
        existing.Split8 = newResult.Split8;
        existing.Split9 = newResult.Split9;
        existing.Split10 = newResult.Split10;
        existing.Passes = newResult.Passes;
        existing.Passers = newResult.Passers;
        existing.ResultDataJson = newResult.ResultDataJson;
    }

	/// <summary>
	/// Applies sorting to a race results query based on the specified field and direction.
	/// Uses properly typed expressions to avoid boxing and ensure EF Core can translate to SQL.
	/// TimeSpan columns are stored as long (Ticks) in the database via value converters,
	/// allowing simple sorting without special handling.
	/// </summary>
	private IQueryable<RaceResult> ApplySorting(
		IQueryable<RaceResult> query,
		RaceResultColumn sortField,
		SortDirection sortDirection)
	{
		// Apply sorting based on field and direction using properly typed expressions
		// TimeSpan values are stored as Ticks in DB via value converters, so sorting works directly
		return (sortField, sortDirection) switch
		{
			// String columns
			(RaceResultColumn.BibNumber, SortDirection.Ascending) => query.OrderBy(r => r.BibNumber),
			(RaceResultColumn.BibNumber, SortDirection.Descending) => query.OrderByDescending(r => r.BibNumber),
			(RaceResultColumn.Name, SortDirection.Ascending) => query.OrderBy(r => r.Name),
			(RaceResultColumn.Name, SortDirection.Descending) => query.OrderByDescending(r => r.Name),
			(RaceResultColumn.Hometown, SortDirection.Ascending) => query.OrderBy(r => r.Hometown),
			(RaceResultColumn.Hometown, SortDirection.Descending) => query.OrderByDescending(r => r.Hometown),

			// Integer columns
			(RaceResultColumn.Age, SortDirection.Ascending) => query.OrderBy(r => r.Age),
			(RaceResultColumn.Age, SortDirection.Descending) => query.OrderByDescending(r => r.Age),
			(RaceResultColumn.Gender, SortDirection.Ascending) => query.OrderBy(r => r.Gender),
			(RaceResultColumn.Gender, SortDirection.Descending) => query.OrderByDescending(r => r.Gender),
			(RaceResultColumn.OverallPlace, SortDirection.Ascending) => query.OrderBy(r => r.OverallPlace),
			(RaceResultColumn.OverallPlace, SortDirection.Descending) => query.OrderByDescending(r => r.OverallPlace),
			(RaceResultColumn.DivisionPlace, SortDirection.Ascending) => query.OrderBy(r => r.DivisionPlace),
			(RaceResultColumn.DivisionPlace, SortDirection.Descending) => query.OrderByDescending(r => r.DivisionPlace),
			(RaceResultColumn.GenderPlace, SortDirection.Ascending) => query.OrderBy(r => r.GenderPlace),
			(RaceResultColumn.GenderPlace, SortDirection.Descending) => query.OrderByDescending(r => r.GenderPlace),

			// TimeSpan columns (stored as Ticks via value converter - nulls sort last automatically)
			(RaceResultColumn.NetTime, SortDirection.Ascending) => query.OrderBy(r => r.NetTime),
			(RaceResultColumn.NetTime, SortDirection.Descending) => query.OrderByDescending(r => r.NetTime),
            (RaceResultColumn.ClockTime, SortDirection.Ascending) => query.OrderBy(r => r.ClockTime),
            (RaceResultColumn.ClockTime, SortDirection.Descending) => query.OrderByDescending(r => r.ClockTime),
            (RaceResultColumn.StartTime, SortDirection.Ascending) => query.OrderBy(r => r.StartTime),
            (RaceResultColumn.StartTime, SortDirection.Descending) => query.OrderByDescending(r => r.StartTime),
            (RaceResultColumn.OverallPace, SortDirection.Ascending) => query.OrderBy(r => r.OverallPace),
			(RaceResultColumn.OverallPace, SortDirection.Descending) => query.OrderByDescending(r => r.OverallPace),
			(RaceResultColumn.Split1, SortDirection.Ascending) => query.OrderBy(r => r.Split1),
			(RaceResultColumn.Split1, SortDirection.Descending) => query.OrderByDescending(r => r.Split1),
			(RaceResultColumn.Split2, SortDirection.Ascending) => query.OrderBy(r => r.Split2),
			(RaceResultColumn.Split2, SortDirection.Descending) => query.OrderByDescending(r => r.Split2),
			(RaceResultColumn.Split3, SortDirection.Ascending) => query.OrderBy(r => r.Split3),
			(RaceResultColumn.Split3, SortDirection.Descending) => query.OrderByDescending(r => r.Split3),
			(RaceResultColumn.Split4, SortDirection.Ascending) => query.OrderBy(r => r.Split4),
			(RaceResultColumn.Split4, SortDirection.Descending) => query.OrderByDescending(r => r.Split4),
			(RaceResultColumn.Split5, SortDirection.Ascending) => query.OrderBy(r => r.Split5),
			(RaceResultColumn.Split5, SortDirection.Descending) => query.OrderByDescending(r => r.Split5),
			(RaceResultColumn.Split6, SortDirection.Ascending) => query.OrderBy(r => r.Split6),
			(RaceResultColumn.Split6, SortDirection.Descending) => query.OrderByDescending(r => r.Split6),
			(RaceResultColumn.Split7, SortDirection.Ascending) => query.OrderBy(r => r.Split7),
			(RaceResultColumn.Split7, SortDirection.Descending) => query.OrderByDescending(r => r.Split7),
			(RaceResultColumn.Split8, SortDirection.Ascending) => query.OrderBy(r => r.Split8),
			(RaceResultColumn.Split8, SortDirection.Descending) => query.OrderByDescending(r => r.Split8),
			(RaceResultColumn.Split9, SortDirection.Ascending) => query.OrderBy(r => r.Split9),
			(RaceResultColumn.Split9, SortDirection.Descending) => query.OrderByDescending(r => r.Split9),
			(RaceResultColumn.Split10, SortDirection.Ascending) => query.OrderBy(r => r.Split10),
			(RaceResultColumn.Split10, SortDirection.Descending) => query.OrderByDescending(r => r.Split10),

			// Passes/Passers columns (kills and assassins)
			(RaceResultColumn.Passes, SortDirection.Ascending) => query.OrderBy(r => r.Passes),
			(RaceResultColumn.Passes, SortDirection.Descending) => query.OrderByDescending(r => r.Passes),
			(RaceResultColumn.Passers, SortDirection.Ascending) => query.OrderBy(r => r.Passers),
			(RaceResultColumn.Passers, SortDirection.Descending) => query.OrderByDescending(r => r.Passers),

			// Default case
			_ => query.OrderBy(r => r.OverallPlace)
		};
	}

	/// <summary>
	/// Applies filters for streaming endpoints (division, gender, runner type).
	/// Gender filters always include Unknown genders (e.g., Duo Division).
	/// </summary>
	private IQueryable<RaceResult> ApplyStreamFilters(
		IQueryable<RaceResult> query,
		int? divisionId,
		Gender? gender,
		RunnerType? runnerType)
	{
		// Apply division filter if provided
		if (divisionId.HasValue)
		{
			query = query.Where(r => r.DivisionId == divisionId.Value);
		}

		// Apply gender filter if provided (always include Unknown)
		if (gender.HasValue)
		{
			if (gender.Value == Gender.Male)
			{
				query = query.Where(r => r.Gender == Gender.Male || r.Gender == Gender.Unknown);
			}
			else if (gender.Value == Gender.Female)
			{
				query = query.Where(r => r.Gender == Gender.Female || r.Gender == Gender.Unknown);
			}
		}

		// Apply runner type filter if provided
		if (runnerType.HasValue)
		{
			query = query.Where(r => r.RunnerType == runnerType.Value);
		}

		return query;
	}

	/// <summary>
	/// Gets the last starter (balloon lady) for a race.
	/// Returns the runner with the latest start time.
	/// </summary>
	public async Task<RaceResult?> GetLastStarter(int raceId)
	{
		// Exclude DNF runners (OverallPlace is null or 0 for DNF)
		var lastStarter = await _context.RaceResults
			.Where(r => r.RaceId == raceId)
			.Where(r => r.OverallPlace.HasValue && r.OverallPlace.Value > 0)
			.OrderByDescending(r => r.StartTime)
			.FirstOrDefaultAsync();

		return lastStarter;
    }

    /// <summary>
    /// Asynchronously retrieves the division runner count for a specific race result.
    /// </summary>
    /// <param name="resultId">The unique identifier of the race result.</param>
    /// <returns>The total number of runners in the same division.</returns>
    public async Task<int> GetDivisionRunnerCountAsync(long resultId)
    {
        var count = await _context.RaceResults
            .Where(r => r.DivisionId == _context.RaceResults
                .Where(r2 => r2.Id == resultId)
                .Select(r2 => r2.DivisionId)
                .FirstOrDefault())
            .CountAsync();

        if (count == 0)
        {
            // Check if the result exists at all
            var exists = await _context.RaceResults.AnyAsync(r => r.Id == resultId);
            if (!exists)
                throw new InvalidOperationException("Result not found.");
        }

        return count;
    }
	/// <summary>
	/// Finds race results matching a runner by name and age range within a specific race.
	/// Used for related results lookup across events.
	/// </summary>
	public async Task<List<RaceResult>> FindMatchingResultsAsync(int raceId, string name, int minAge, int maxAge, string? hometown = null, int? bibNumber = null)
	{
		var normalizedName = name.Trim();

		var query = _context.RaceResults
			.Where(r => r.RaceId == raceId)
			.Where(r => r.Name == normalizedName)
			.Where(r => r.Age >= minAge && r.Age <= maxAge);

		if (hometown != null)
		{
			var normalizedHometown = hometown.Trim();
			query = query.Where(r => r.Hometown != null && r.Hometown == normalizedHometown);
		}

		if (bibNumber.HasValue)
		{
			query = query.Where(r => r.BibNumber == bibNumber.Value);
		}

		return await query.ToListAsync();
	}

	/// <summary>
	/// Gets the X closest race results to a target result by start time and finish time.
	/// Returns runners who started/finished closest to the target runner.
	/// Uses SQL-side ordering on the bigint (Ticks) column to avoid loading all results into memory.
	/// </summary>
	public async Task<(List<RaceResult> ClosestStarters, List<RaceResult> ClosestFinishers)> GetClosestResultsAsync(long raceResultId, int fieldSize)
	{
		// Get the target result
		var targetResult = await _context.RaceResults.FirstOrDefaultAsync(r => r.Id == raceResultId);
		if (targetResult == null)
		{
			throw new InvalidOperationException($"Race result with ID {raceResultId} not found.");
		}

		// Use raw SQL for ABS(DATEDIFF) ordering on time(7) columns — EF Core cannot translate
		// Math.Abs on TimeSpan differences. DATEDIFF(MILLISECOND, ...) gives sub-second resolution.

		// Find closest starters (by start time)
		var closestStarters = new List<RaceResult>();
		if (targetResult.StartTime.HasValue)
		{
			closestStarters = await _context.RaceResults
				.FromSqlRaw(
					@"SELECT * FROM RaceResults
					  WHERE RaceId = {0} AND Id != {1}
					    AND OverallPlace IS NOT NULL AND OverallPlace > 0
					    AND StartTime IS NOT NULL
					  ORDER BY ABS(DATEDIFF(MILLISECOND, StartTime, {2}))
					  OFFSET 0 ROWS FETCH NEXT {3} ROWS ONLY",
					targetResult.RaceId, raceResultId, targetResult.StartTime.Value, fieldSize)
				.ToListAsync();
		}

		// Find closest finishers (by net time)
		var closestFinishers = new List<RaceResult>();
		if (targetResult.NetTime.HasValue)
		{
			closestFinishers = await _context.RaceResults
				.FromSqlRaw(
					@"SELECT * FROM RaceResults
					  WHERE RaceId = {0} AND Id != {1}
					    AND OverallPlace IS NOT NULL AND OverallPlace > 0
					    AND NetTime IS NOT NULL
					  ORDER BY ABS(DATEDIFF(MILLISECOND, NetTime, {2}))
					  OFFSET 0 ROWS FETCH NEXT {3} ROWS ONLY",
					targetResult.RaceId, raceResultId, targetResult.NetTime.Value, fieldSize)
				.ToListAsync();
		}

		return (closestStarters, closestFinishers);
	}

	/// <inheritdoc/>
	public async Task<List<RaceResult>> GetResultsByHometownAsync(int raceId, string hometown, int limit = 0)
	{
		var normalizedHometown = hometown.Trim();

		var query = _context.RaceResults
			.Where(r => r.RaceId == raceId)
			.Where(r => r.OverallPlace.HasValue && r.OverallPlace.Value > 0)
			.Where(r => r.Hometown != null && r.Hometown == normalizedHometown)
			.OrderBy(r => r.OverallPlace);

		if (limit > 0)
			return await query.Take(limit).ToListAsync();

		return await query.ToListAsync();
	}

	/// <inheritdoc/>
	public async Task<List<RaceResult>> GetResultsByRegionAsync(int raceId, string region, int limit = 0)
	{
		var regionSuffix = $", {region.Trim()}";

		var query = _context.RaceResults
			.Where(r => r.RaceId == raceId)
			.Where(r => r.OverallPlace.HasValue && r.OverallPlace.Value > 0)
			.Where(r => r.Hometown != null && EF.Functions.Like(r.Hometown, $"%{regionSuffix}"))
			.OrderBy(r => r.OverallPlace);

		if (limit > 0)
			return await query.Take(limit).ToListAsync();

		return await query.ToListAsync();
	}

	/// <inheritdoc/>
	public async Task<List<RaceResult>> SearchByNameAsync(string name, int? raceId = null, int? eventId = null, EventSeries? eventSeries = null, int limit = 20, int skip = 0, HashSet<long>? excludeResultIds = null)
	{
		var searchPattern = $"%{name.Trim()}%";

		var query = _context.RaceResults
			.Include(r => r.Race)
				.ThenInclude(r => r.Event)
			.Where(r => EF.Functions.Like(r.Name, searchPattern));

		if (raceId.HasValue)
			query = query.Where(r => r.RaceId == raceId.Value);
		else if (eventId.HasValue)
			query = query.Where(r => r.Race.EventId == eventId.Value);

		// Filter by EventSeries server-side using the persisted column on Race
		if (eventSeries.HasValue && eventSeries.Value != EventSeries.Unknown)
		{
			query = query.Where(r => r.Race.EventSeries == eventSeries.Value);
		}

		// Exclude already-followed results so the frontend only sees un-followed entries
		if (excludeResultIds is { Count: > 0 })
		{
			query = query.Where(r => !excludeResultIds.Contains(r.Id));
		}

		return await query
			.OrderByDescending(r => r.Race.RaceDate)
			.ThenBy(r => r.OverallPlace)
			.Skip(skip)
			.Take(limit)
			.ToListAsync();
	}

	/// <inheritdoc/>
	public async Task<List<(string Hometown, RunnerType RunnerType, int Count)>> GetHometownRunnerTypeCountsAsync(int? raceId = null, int? eventId = null)
	{
		var query = _context.RaceResults
			.Where(r => r.OverallPlace.HasValue && r.OverallPlace.Value > 0)
			.Where(r => r.Hometown != null && r.Hometown != "");

		if (raceId.HasValue)
			query = query.Where(r => r.RaceId == raceId.Value);
		else if (eventId.HasValue)
			query = query.Where(r => r.Race.EventId == eventId.Value);

		var results = await query
			.GroupBy(r => new { r.Hometown, r.RunnerType })
			.Select(g => new { Hometown = g.Key.Hometown!, RunnerType = g.Key.RunnerType, Count = g.Count() })
			.OrderBy(x => x.Hometown)
			.ToListAsync();

		return results.Select(x => (x.Hometown, x.RunnerType, x.Count)).ToList();
	}
}
