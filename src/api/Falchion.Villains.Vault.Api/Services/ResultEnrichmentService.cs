using Falchion.Villains.Vault.Api.Data;
using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Falchion.Villains.Vault.Api.Services;

/// <summary>
/// Service for enriching race results with computed data:
/// - Pass counts (kills/assassins) with runner-type-aware comparisons
/// - Breakdown data by division, gender, hometown, and region
/// - Rank data within various groupings
/// </summary>
public class ResultEnrichmentService
{
	private readonly ApplicationDbContext _context;
	private readonly ILogger<ResultEnrichmentService> _logger;

	public ResultEnrichmentService(
		ApplicationDbContext context,
		ILogger<ResultEnrichmentService> logger)
	{
		_context = context;
		_logger = logger;
	}

	/// <summary>
	/// Calculates and persists all enrichment data for a race:
	/// pass counts, breakdowns, and rankings.
	/// </summary>
	/// <param name="raceId">The race ID to enrich results for.</param>
	/// <returns>The number of results updated.</returns>
	public async Task<int> EnrichRaceResultsAsync(int raceId)
	{
		_logger.LogInformation("Enriching results for race {RaceId}", raceId);

		// Load all results for the race
		var allResults = await _context.RaceResults
			.Where(r => r.RaceId == raceId)
			.ToListAsync();

		if (allResults.Count == 0)
		{
			_logger.LogInformation("No results found for race {RaceId}, skipping enrichment", raceId);
			return 0;
		}

		// Non-DNF results (have a valid overall place)
		var rankedResults = allResults
			.Where(r => r.OverallPlace.HasValue && r.OverallPlace.Value > 0)
			.ToList();

		_logger.LogInformation("Enriching {Count} results ({Ranked} ranked) in race {RaceId}",
			allResults.Count, rankedResults.Count, raceId);

		// Pre-compute timing data for pass calculations
		var resultData = rankedResults
			.Select(r => new ResultPassData
			{
				Result = r,
				StartTimeSeconds = r.StartTime?.TotalSeconds ?? 0,
				ClockTimeSeconds = r.ClockTime?.TotalSeconds,
			})
			.ToList();

		var validResults = resultData.Where(r => r.ClockTimeSeconds.HasValue).ToList();

		// Group by runner category for type-aware pass comparisons
		var wheelchairResults = validResults
			.Where(r => r.Result.RunnerType == RunnerType.HandCycle || r.Result.RunnerType == RunnerType.PushRim)
			.ToList();
		var standardResults = validResults
			.Where(r => r.Result.RunnerType == RunnerType.Runner || r.Result.RunnerType == RunnerType.Duo)
			.ToList();

		// Pre-build groupings for breakdown/rank calculations
		var byDivision = rankedResults.GroupBy(r => r.DivisionId).ToDictionary(g => g.Key, g => g.ToList());
		// Gender grouping scoped by runner type
		var byGenderAndType = rankedResults
			.GroupBy(r => (r.Gender, r.RunnerType))
			.ToDictionary(g => g.Key, g => g.ToList());
		var byHometown = rankedResults
			.Where(r => !string.IsNullOrWhiteSpace(r.Hometown))
			.GroupBy(r => r.Hometown!.Trim(), StringComparer.OrdinalIgnoreCase)
			.ToDictionary(g => g.Key, g => g.ToList(), StringComparer.OrdinalIgnoreCase);

		var byRegion = rankedResults
			.Where(r => !string.IsNullOrWhiteSpace(r.Hometown))
			.GroupBy(r => ParseRegion(r.Hometown!), StringComparer.OrdinalIgnoreCase)
			.Where(g => !string.IsNullOrWhiteSpace(g.Key))
			.ToDictionary(g => g.Key, g => g.ToList(), StringComparer.OrdinalIgnoreCase);

		// Pre-compute ranked lists for each grouping (ordered by NetTime for rank calculations)
		var divisionRanked = byDivision.ToDictionary(
			kvp => kvp.Key,
			kvp => kvp.Value.Where(r => r.NetTime.HasValue).OrderBy(r => r.NetTime!.Value).ToList());
		var genderTypeRanked = byGenderAndType.ToDictionary(
			kvp => kvp.Key,
			kvp => kvp.Value.Where(r => r.NetTime.HasValue).OrderBy(r => r.NetTime!.Value).ToList());
		var hometownRanked = byHometown.ToDictionary(
			kvp => kvp.Key,
			kvp => kvp.Value.Where(r => r.NetTime.HasValue).OrderBy(r => r.NetTime!.Value).ToList(),
			StringComparer.OrdinalIgnoreCase);
		var regionRanked = byRegion.ToDictionary(
			kvp => kvp.Key,
			kvp => kvp.Value.Where(r => r.NetTime.HasValue).OrderBy(r => r.NetTime!.Value).ToList(),
			StringComparer.OrdinalIgnoreCase);

		// Build lookup for valid results by ID for fast pass dimension checks
		var validById = validResults.ToDictionary(r => r.Result.Id);

		int updatedCount = 0;

		// Calculate passes, breakdowns, and rankings for each ranked result
		foreach (var current in rankedResults)
		{
			var breakdown = new ResultBreakdownData();
			var currentPass = validById.GetValueOrDefault(current.Id);

			// --- Pass calculations (only for results with valid clock times) ---
			if (currentPass != null)
			{
				int passes = 0, passers = 0;
				int passesByDiv = 0, passersByDiv = 0;
				int passesByGender = 0, passersByGender = 0;
				int passesByHometown = 0, passersByHometown = 0;
				int passesByRegion = 0, passersByRegion = 0;

				var comparisonPool = GetComparisonPool(currentPass, wheelchairResults, standardResults, validResults);
				var currentRegion = !string.IsNullOrWhiteSpace(current.Hometown) ? ParseRegion(current.Hometown) : null;

				foreach (var other in comparisonPool)
				{
					if (other.Result.Id == current.Id) continue;

					bool isKill = currentPass.StartTimeSeconds > other.StartTimeSeconds &&
								  currentPass.ClockTimeSeconds!.Value < other.ClockTimeSeconds!.Value;
					bool isAssassin = other.StartTimeSeconds > currentPass.StartTimeSeconds &&
									  other.ClockTimeSeconds!.Value < currentPass.ClockTimeSeconds!.Value;

					if (isKill)
					{
						passes++;
						if (other.Result.DivisionId == current.DivisionId) passesByDiv++;
						if (other.Result.Gender == current.Gender) passesByGender++;
						if (!string.IsNullOrWhiteSpace(current.Hometown) &&
							string.Equals(other.Result.Hometown?.Trim(), current.Hometown.Trim(), StringComparison.OrdinalIgnoreCase))
							passesByHometown++;
						if (currentRegion != null &&
							string.Equals(ParseRegion(other.Result.Hometown ?? ""), currentRegion, StringComparison.OrdinalIgnoreCase))
							passesByRegion++;
					}

					if (isAssassin)
					{
						passers++;
						if (other.Result.DivisionId == current.DivisionId) passersByDiv++;
						if (other.Result.Gender == current.Gender) passersByGender++;
						if (!string.IsNullOrWhiteSpace(current.Hometown) &&
							string.Equals(other.Result.Hometown?.Trim(), current.Hometown.Trim(), StringComparison.OrdinalIgnoreCase))
							passersByHometown++;
						if (currentRegion != null &&
							string.Equals(ParseRegion(other.Result.Hometown ?? ""), currentRegion, StringComparison.OrdinalIgnoreCase))
							passersByRegion++;
					}
				}

				// Update top-level pass counts
				if (current.Passes != passes || current.Passers != passers)
				{
					current.Passes = passes;
					current.Passers = passers;
				}

				breakdown.PassBreakdowns = new PassBreakdown
				{
					ByDivision = passesByDiv,
					ByGender = passesByGender,
					ByHometown = passesByHometown,
					ByRegion = passesByRegion,
				};
				breakdown.PasserBreakdowns = new PassBreakdown
				{
					ByDivision = passersByDiv,
					ByGender = passersByGender,
					ByHometown = passersByHometown,
					ByRegion = passersByRegion,
				};
			}
			else
			{
				// No valid clock time — null out passes
				current.Passes = null;
				current.Passers = null;
			}

			// --- Rank calculations (by net time) ---
			var genderTypeKey = (current.Gender, current.RunnerType);
			var genderList = genderTypeRanked.GetValueOrDefault(genderTypeKey);
			if (genderList != null)
			{
				breakdown.Rankings.GenderTotal = genderList.Count;
			}

			if (!string.IsNullOrWhiteSpace(current.Hometown))
			{
				var htKey = current.Hometown.Trim();
				var htList = hometownRanked.GetValueOrDefault(htKey);
				if (htList != null)
				{
					breakdown.Rankings.HometownPlace = htList.FindIndex(r => r.Id == current.Id) + 1;
					breakdown.Rankings.HometownTotal = htList.Count;
					if (breakdown.Rankings.HometownPlace == 0) breakdown.Rankings.HometownPlace = null;
				}

				var regionKey = ParseRegion(current.Hometown);
				if (!string.IsNullOrWhiteSpace(regionKey))
				{
					var regList = regionRanked.GetValueOrDefault(regionKey);
					if (regList != null)
					{
						breakdown.Rankings.RegionPlace = regList.FindIndex(r => r.Id == current.Id) + 1;
						breakdown.Rankings.RegionTotal = regList.Count;
						if (breakdown.Rankings.RegionPlace == 0) breakdown.Rankings.RegionPlace = null;
					}
				}
			}

			// Serialize breakdown and check if changed
			var breakdownJson = breakdown.ToJson();
			if (current.ResultDataJson != breakdownJson)
			{
				current.ResultDataJson = breakdownJson;
				updatedCount++;
			}
		}

		// Handle DNF results — null out passes and breakdown
		foreach (var dnf in allResults.Where(r => !r.OverallPlace.HasValue || r.OverallPlace.Value <= 0))
		{
			bool changed = false;
			if (dnf.Passes != null) { dnf.Passes = null; changed = true; }
			if (dnf.Passers != null) { dnf.Passers = null; changed = true; }
			if (dnf.ResultDataJson != null) { dnf.ResultDataJson = null; changed = true; }
			if (changed) updatedCount++;
		}

		if (updatedCount > 0)
		{
			await _context.SaveChangesAsync();
			_logger.LogInformation("Updated enrichment data for {Count} results in race {RaceId}", updatedCount, raceId);
		}
		else
		{
			_logger.LogInformation("No enrichment changes needed for race {RaceId}", raceId);
		}

		return updatedCount;
	}

	/// <summary>
	/// Determines the comparison pool for a runner based on their type.
	/// HandCycle/PushRim runners only compare against other HandCycle/PushRim runners.
	/// Standard Runners and Duo runners compare against each other.
	/// </summary>
	private static List<ResultPassData> GetComparisonPool(
		ResultPassData current,
		List<ResultPassData> wheelchairResults,
		List<ResultPassData> standardResults,
		List<ResultPassData> allResults)
	{
		return current.Result.RunnerType switch
		{
			RunnerType.HandCycle or RunnerType.PushRim => wheelchairResults,
			RunnerType.Runner or RunnerType.Duo => standardResults,
			_ => allResults
		};
	}

	/// <summary>
	/// Extracts the region (state or country) from a hometown string.
	/// Hometown format is typically "City, ST" or "City, Country".
	/// </summary>
	private static string ParseRegion(string hometown)
	{
		var lastComma = hometown.LastIndexOf(',');
		if (lastComma < 0) return string.Empty;
		return hometown[(lastComma + 1)..].Trim();
	}

	/// <summary>
	/// Internal helper for pre-computed result data used during pass calculation.
	/// </summary>
	private class ResultPassData
	{
		public required RaceResult Result { get; init; }
		public double StartTimeSeconds { get; init; }
		public double? ClockTimeSeconds { get; init; }
	}
}
