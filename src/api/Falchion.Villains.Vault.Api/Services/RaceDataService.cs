using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.DTOs;
using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Models;
using Falchion.Villains.Vault.Api.Models.Mcp;
using Falchion.Villains.Vault.Api.Repositories;
using Falchion.Villains.Vault.Api.Utils;
using System.Text.Json;

namespace Falchion.Villains.Vault.Api.Services;

/// <summary>
/// Shared service for race data queries.
/// Used by both REST controllers and MCP tools to avoid logic duplication.
/// </summary>
public class RaceDataService
{
	private readonly IResultRepository _resultRepository;
	private readonly IRaceRepository _raceRepository;
	private readonly IEventRepository _eventRepository;
	private readonly IDivisionRepository _divisionRepository;

	public RaceDataService(
		IResultRepository resultRepository,
		IRaceRepository raceRepository,
		IEventRepository eventRepository,
		IDivisionRepository divisionRepository)
	{
		_resultRepository = resultRepository;
		_raceRepository = raceRepository;
		_eventRepository = eventRepository;
		_divisionRepository = divisionRepository;
	}

	/// <summary>
	/// Gets a detailed race result by ID, including placement stats.
	/// raceRunners excludes DNF.
	/// </summary>
	public async Task<RaceResultDetailedDto?> GetRaceResultDetailedAsync(long raceResultId)
	{
		var raceResult = await _resultRepository.GetByIdAsync(raceResultId);
		if (raceResult == null)
			return null;

		var dto = RaceResultDetailedDto.FromEntity<RaceResultDetailedDto>(raceResult);
		var raceRunners = await _resultRepository.GetRaceResultsCountAsync(raceResult.RaceId);
		var divisionRunners = await _resultRepository.GetDivisionRunnerCountAsync(raceResult.Id);

		dto.RaceRunners = raceRunners;
		dto.DivisionRunners = divisionRunners;

		return dto;
	}

	/// <summary>
	/// Gets a race by ID.
	/// </summary>
	public Task<Race?> GetRaceByIdAsync(int raceId) => _raceRepository.GetByIdAsync(raceId);

	/// <summary>
	/// Builds race statistics.
	/// </summary>
	public Task<RaceStats> BuildRaceStatsAsync(int raceId) => _raceRepository.BuildRaceStats(raceId);

	/// <summary>
	/// Gets all events, optionally filtered by year.
	/// </summary>
	public async Task<List<EventWithRacesDto>> GetEventsAsync(int? year = null, EventSeries? eventSeries = null)
	{
		var events = year.HasValue
			? await _eventRepository.GetAllWithRacesByYearAsync(year.Value)
			: await _eventRepository.GetAllWithRacesAsync();

		// EventSeries is now a persisted column — filter server-side when possible
		// For GetAllWithRaces calls, the data is already materialized, so filter in memory
		if (eventSeries.HasValue && eventSeries.Value != EventSeries.Unknown)
        {
            events = events.Where(e => e.EventSeries == eventSeries.Value).ToList();
        }

        return events.Select(EventWithRacesDto.FromEntity).ToList();
	}

	/// <summary>
	/// Gets available years that have events.
	/// <param name="eventSeries"/> can be used to filter years by a specific event series, or null to include all series.
	/// </summary>
	public async Task<List<int>> GetAvailableYearsAsync(EventSeries? eventSeries = null)
	{
		var years = await _eventRepository.GetAvailableYearsAsync(eventSeries);
		return years.OrderByDescending(y => y).ToList();
	}

	/// <summary>
	/// Gets an event by ID.
	/// </summary>
	public Task<Event?> GetEventByIdAsync(int eventId) => _eventRepository.GetByIdAsync(eventId);

	/// <summary>
	/// Gets divisions for a race.
	/// </summary>
	public async Task<List<DivisionDto>> GetDivisionsAsync(int raceId)
	{
		var divisions = await _divisionRepository.GetByRaceIdAsync(raceId);
		return divisions.Select(DivisionDto.FromEntity).ToList();
	}

	/// <summary>
	/// Searches race results with paging.
	/// </summary>
	public async Task<(List<RaceResultDto> Results, int TotalCount)> SearchResultsAsync(
		int raceId,
		string? searchTerm,
		int? divisionId = null,
		Gender? gender = null,
		RaceResultColumn sortBy = RaceResultColumn.OverallPlace,
		string sortDirection = "asc",
		int page = 1,
		int pageSize = 50,
		string? region = null)
	{
		var direction = sortDirection.Equals("desc", StringComparison.OrdinalIgnoreCase)
			? SortDirection.Descending
			: SortDirection.Ascending;

		var (results, totalCount) = await _resultRepository.GetFilteredPagedResultsAsync(
			raceId, divisionId, gender, searchTerm, sortBy, direction, page, pageSize, region);

		var dtos = results.Select(RaceResultDto.FromEntity<RaceResultDto>).ToList();
		return (dtos, totalCount);
	}

	/// <summary>
	/// Gets the last starter (balloon lady) for a race.
	/// </summary>
	public async Task<RaceResultDto?> GetLastStarterAsync(int raceId)
	{
		var lastStarter = await _resultRepository.GetLastStarter(raceId);
		return lastStarter != null ? RaceResultDto.FromEntity<RaceResultDto>(lastStarter) : null;
	}

	/// <summary>
	/// Gets a single race result by bib number within a race.
	/// </summary>
	public async Task<RaceResultDto?> GetResultByBibNumberAsync(int raceId, int bibNumber)
	{
		var result = await _resultRepository.GetByBibNumberAsync(raceId, bibNumber);
		return result != null ? RaceResultDto.FromEntity<RaceResultDto>(result) : null;
	}

	/// <summary>
	/// Gets race results for multiple bib numbers within a race.
	/// Returns results keyed by bib number to preserve the caller's requested order.
	/// </summary>
	public async Task<List<RaceResultDto>> GetResultsByBibNumbersAsync(int raceId, IEnumerable<int> bibNumbers)
	{
		var results = await _resultRepository.GetByBibNumbersAsync(raceId, bibNumbers);
		return results.Select(RaceResultDto.FromEntity<RaceResultDto>).ToList();
	}

	/// <summary>
	/// Finds a runner's results across events by matching name, age, and hometown.
	/// </summary>
	public async Task<List<MatchedRunnerResult>> FindRunnerAcrossEventsAsync(long raceResultId)
	{
		var sourceResult = await _resultRepository.GetByIdAsync(raceResultId);
		if (sourceResult == null)
			return [];

		var sourceRace = await _raceRepository.GetByIdAsync(sourceResult.RaceId);
		if (sourceRace == null)
			return [];

		var sourceYear = sourceRace.RaceDate.Year;
		var matched = new List<MatchedRunnerResult>();
		var allEvents = await _eventRepository.GetAllWithRacesAsync();

		foreach (var evt in allEvents)
		{
			foreach (var targetRace in evt.Races)
			{
				if (targetRace.Id == sourceResult.RaceId)
					continue;

				var yearDiff = sourceYear - targetRace.RaceDate.Year;
				var expectedAge = sourceResult.Age - yearDiff;

				var matches = await _resultRepository.FindMatchingResultsAsync(
					targetRace.Id, sourceResult.Name, expectedAge - 1, expectedAge + 1);

				RaceResult? match = null;
				if (matches.Count == 1)
				{
					match = matches[0];
				}
				else if (matches.Count > 1 && !string.IsNullOrEmpty(sourceResult.Hometown))
				{
					var hometownMatches = await _resultRepository.FindMatchingResultsAsync(
						targetRace.Id, sourceResult.Name, expectedAge - 1, expectedAge + 1, sourceResult.Hometown);
					if (hometownMatches.Count == 1)
						match = hometownMatches[0];
				}

				if (match != null)
				{
					matched.Add(new MatchedRunnerResult
					{
						EventName = evt.Name,
						EventSeries = evt.EventSeries,
                        RaceName = targetRace.Name,
						RaceDate = targetRace.RaceDate,
						Distance = targetRace.Distance,
						ResultId = match.Id,
						OverallPlace = match.OverallPlace,
						NetTime = match.NetTime,
						OverallPace = match.OverallPace
					});
				}
			}
		}

		return matched;
	}

	/// <summary>
	/// Gets closest starters and finishers for a race result.
	/// </summary>
	public async Task<(RaceResult? Target, List<RaceResult> ClosestStarters, List<RaceResult> ClosestFinishers)> GetClosestResultsAsync(long raceResultId, int fieldSize)
	{
		var target = await _resultRepository.GetByIdAsync(raceResultId);
		if (target == null)
			return (null, [], []);

		var (starters, finishers) = await _resultRepository.GetClosestResultsAsync(raceResultId, fieldSize);
		return (target, starters, finishers);
	}

	/// <summary>
	/// Gets filtered results for a race (no search/paging wrapper � returns all matching as DTOs).
	/// </summary>
	public async Task<List<RaceResultDto>> GetFilteredResultsAsync(
		int raceId,
		int? divisionId = null,
		Gender? gender = null,
		RunnerType? runnerType = null,
		RaceResultColumn sortBy = RaceResultColumn.OverallPlace,
		string sortDirection = "asc",
		int page = 1,
		int pageSize = 50000)
	{
		var direction = sortDirection.Equals("desc", StringComparison.OrdinalIgnoreCase)
			? SortDirection.Descending
			: SortDirection.Ascending;

		var results = await _resultRepository.GetFilteredResultsAsync(
			raceId, divisionId, gender, runnerType, sortBy, direction, page, pageSize);

		return results.Select(RaceResultDto.FromEntity<RaceResultDto>).ToList();
	}

	/// <summary>
	/// Gets paged results with pagination metadata.
	/// </summary>
	public async Task<PagedResultsDto<RaceResultDto>> GetPagedResultsAsync(
		int raceId,
		int? divisionId = null,
		Gender? gender = null,
		string? searchTerm = null,
		RaceResultColumn sortBy = RaceResultColumn.OverallPlace,
		string sortDirection = "asc",
		int page = 1,
		int pageSize = 50,
		string? region = null)
	{
		var direction = sortDirection.Equals("desc", StringComparison.OrdinalIgnoreCase)
			? SortDirection.Descending
			: SortDirection.Ascending;

		var (results, totalCount) = await _resultRepository.GetFilteredPagedResultsAsync(
			raceId, divisionId, gender, searchTerm, sortBy, direction, page, pageSize, region);

		var dtos = results.Select(RaceResultDto.FromEntity<RaceResultDto>).ToList();
		return new PagedResultsDto<RaceResultDto>
		{
			Items = dtos,
			Page = page,
			PageSize = pageSize,
			TotalCount = totalCount,
			TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
		};
	}

	/// <summary>
	/// Builds closest results DTOs with proximity information.
	/// </summary>
	public async Task<ClosestResultsDto?> GetClosestResultsDtoAsync(long raceResultId, int fieldSize)
	{
		var (target, closestStarters, closestFinishers) = await GetClosestResultsAsync(raceResultId, fieldSize);
		if (target == null)
			return null;

		var closestStartersDto = new List<RaceResultWithProximityDto>();
		if (target.StartTime.HasValue)
		{
			closestStartersDto = closestStarters
				.Select(r => RaceResultWithProximityDto.FromEntityWithProximity(
					r,
					TimeSpan.FromSeconds(Math.Abs((r.StartTime!.Value - target.StartTime.Value).TotalSeconds))))
				.OrderBy(r => r.TimeDifference)
				.ToList();
		}

		var closestFinishersDto = new List<RaceResultWithProximityDto>();
		if (target.NetTime.HasValue)
		{
			closestFinishersDto = closestFinishers
				.Select(r => RaceResultWithProximityDto.FromEntityWithProximity(
					r,
					TimeSpan.FromSeconds(Math.Abs((r.NetTime!.Value - target.NetTime.Value).TotalSeconds))))
				.OrderBy(r => r.TimeDifference)
				.ToList();
		}

		return new ClosestResultsDto
		{
			TargetResult = RaceResultDto.FromEntity<RaceResultDto>(target),
			ClosestStarters = closestStartersDto,
			ClosestFinishers = closestFinishersDto
		};
	}

	/// <summary>
	/// Finds related results for a runner, optionally scoped to a specific event.
	/// </summary>
	public async Task<RelatedRaceResultsDto?> GetRelatedResultsAsync(long raceResultId, int? eventId = null)
	{
		var sourceResult = await _resultRepository.GetByIdAsync(raceResultId);
		if (sourceResult == null)
			return null;

		var sourceRace = await _raceRepository.GetByIdAsync(sourceResult.RaceId);
		if (sourceRace == null)
			return null;

		var sourceYear = sourceRace.RaceDate.Year;
		var response = new RelatedRaceResultsDto
		{
			SourceResultId = raceResultId,
			SourceRaceId = sourceResult.RaceId
		};

		if (eventId.HasValue)
		{
			var targetEvent = await _eventRepository.GetByIdAsync(eventId.Value);
			if (targetEvent == null)
				return response;

			var eventDto = new RelatedEventResultsDto
			{
				EventId = targetEvent.Id,
				EventName = targetEvent.Name
			};

			foreach (var targetRace in targetEvent.Races)
			{
				if (targetRace.Id == sourceResult.RaceId)
					continue;

				var match = await FindMatchInRace(targetRace, sourceResult, sourceResult.Age, sourceResult.Age, useBibFallback: true);
				if (match.HasValue)
				{
					eventDto.Races.Add(new RelatedRaceResultItemDto
					{
						RaceId = targetRace.Id,
						RaceName = targetRace.Name,
						Distance = targetRace.Distance,
						RaceDate = targetRace.RaceDate,
						ResultId = match.Value
					});
				}
			}

			if (eventDto.Races.Count > 0)
				response.Events.Add(eventDto);
		}
		else
		{
			var allEvents = await _eventRepository.GetAllWithRacesAsync();

			foreach (var evt in allEvents)
			{
				var eventDto = new RelatedEventResultsDto
				{
					EventId = evt.Id,
					EventName = evt.Name
				};

				foreach (var targetRace in evt.Races)
				{
					if (targetRace.Id == sourceResult.RaceId)
						continue;

					var yearDiff = sourceYear - targetRace.RaceDate.Year;
					var expectedAge = sourceResult.Age - yearDiff;

					var match = await FindMatchInRace(targetRace, sourceResult, expectedAge - 1, expectedAge + 1, useBibFallback: false);
					if (match.HasValue)
					{
						eventDto.Races.Add(new RelatedRaceResultItemDto
						{
							RaceId = targetRace.Id,
							RaceName = targetRace.Name,
							Distance = targetRace.Distance,
							RaceDate = targetRace.RaceDate,
							ResultId = match.Value
						});
					}
				}

				if (eventDto.Races.Count > 0)
					response.Events.Add(eventDto);
			}
		}

		return response;
	}

	/// <summary>
	/// Attempts to find a unique match for a runner in a target race.
	/// </summary>
	private async Task<long?> FindMatchInRace(Race targetRace, RaceResult sourceResult, int minAge, int maxAge, bool useBibFallback)
	{
		var matches = useBibFallback
			? await _resultRepository.FindMatchingResultsAsync(targetRace.Id, sourceResult.Name, minAge, maxAge, sourceResult.Hometown)
			: await _resultRepository.FindMatchingResultsAsync(targetRace.Id, sourceResult.Name, minAge, maxAge);

		if (matches.Count == 1)
			return matches[0].Id;

		if (matches.Count > 1)
		{
			if (useBibFallback)
			{
				var bibMatches = matches.Where(m => m.BibNumber == sourceResult.BibNumber).ToList();
				if (bibMatches.Count == 1)
					return bibMatches[0].Id;
			}
			else if (!string.IsNullOrEmpty(sourceResult.Hometown))
			{
				var hometownMatches = await _resultRepository.FindMatchingResultsAsync(
					targetRace.Id, sourceResult.Name, minAge, maxAge, sourceResult.Hometown);
				if (hometownMatches.Count == 1)
					return hometownMatches[0].Id;
			}
		}

		return null;
	}

	/// <summary>
	/// Gets the total count of results for a race with optional filters.
	/// </summary>
	public Task<int> GetRaceResultsCountAsync(int raceId, int? divisionId = null, Gender? gender = null, RunnerType? runnerType = null)
		=> _resultRepository.GetRaceResultsCountAsync(raceId, divisionId, gender, runnerType);

	/// <summary>
	/// Gets all results for a race sorted by the specified field. Used for export/streaming.
	/// Returns raw entities for custom processing.
	/// </summary>
	public async Task<List<RaceResult>> GetFilteredPagedResultsRawAsync(
		int raceId,
		int? divisionId,
		Gender? gender,
		string? searchTerm,
		RaceResultColumn sortBy,
		string sortDirection,
		int page,
		int pageSize)
	{
		var direction = sortDirection.Equals("desc", StringComparison.OrdinalIgnoreCase)
			? SortDirection.Descending
			: SortDirection.Ascending;

		var (results, _) = await _resultRepository.GetFilteredPagedResultsAsync(
			raceId, divisionId, gender, searchTerm, sortBy, direction, page, pageSize);

		return results;
	}

	/// <summary>
	/// Analyzes a runner's split times for a race, computing per-segment pace and identifying
	/// negative/positive splits.
	/// </summary>
	public async Task<RunnerSplitAnalysis?> GetRunnerSplitAnalysisAsync(long raceResultId)
	{
		var result = await _resultRepository.GetByIdAsync(raceResultId);
		if (result == null)
			return null;

		var race = await _raceRepository.GetByIdAsync(result.RaceId);
		if (race == null)
			return null;

		var metadata = RaceMetadata.FromJson(race.MetadataJson);
		if (metadata.SplitTimes.Count == 0)
			return new RunnerSplitAnalysis { RaceResultId = raceResultId, HasSplitData = false };

		var splits = GetSplitValues(result);
		var segments = new List<SplitSegment>();
		var totalDistanceMiles = race.Distance.GetMiles();
		var previousCumulativeTime = TimeSpan.Zero;
		var previousDistanceMiles = 0.0;

		for (int i = 0; i < metadata.SplitTimes.Count; i++)
		{
			if (i >= splits.Count || !splits[i].HasValue)
				continue;

			var splitInfo = metadata.SplitTimes[i];
			var splitDistanceMiles = splitInfo.IsKilometers
				? PaceHelpers.ConvertToMiles(splitInfo.Distance, true)
				: splitInfo.Distance;
			var segmentDistance = splitDistanceMiles - previousDistanceMiles;
			var segmentTime = splits[i]!.Value - previousCumulativeTime;
			var segmentPace = segmentDistance > 0 ? PaceHelpers.CalculatePace(segmentTime, segmentDistance) : (TimeSpan?)null;

			segments.Add(new SplitSegment
			{
				Label = splitInfo.Label,
				CumulativeTime = splits[i]!.Value,
				SegmentTime = segmentTime,
				SegmentDistanceMiles = Math.Round(segmentDistance, 2),
				SegmentPace = segmentPace
			});

			previousCumulativeTime = splits[i]!.Value;
			previousDistanceMiles = splitDistanceMiles;
		}

		// Add finish segment if there's remaining distance after the last split
		if (result.NetTime.HasValue && previousDistanceMiles < totalDistanceMiles)
		{
			var remainingDistance = totalDistanceMiles - previousDistanceMiles;
			var remainingTime = result.NetTime.Value - previousCumulativeTime;
			var finishPace = remainingDistance > 0 ? PaceHelpers.CalculatePace(remainingTime, remainingDistance) : (TimeSpan?)null;

			segments.Add(new SplitSegment
			{
				Label = "Finish",
				CumulativeTime = result.NetTime.Value,
				SegmentTime = remainingTime,
				SegmentDistanceMiles = Math.Round(remainingDistance, 2),
				SegmentPace = finishPace
			});
		}

		// Determine if negative split (second half faster than first half)
		bool? isNegativeSplit = null;
		if (segments.Count >= 2 && result.NetTime.HasValue)
		{
			var halfDistance = totalDistanceMiles / 2.0;
			var firstHalfTime = TimeSpan.Zero;
			var runningDistance = 0.0;

			foreach (var seg in segments)
			{
				if (runningDistance + seg.SegmentDistanceMiles <= halfDistance + 0.1)
				{
					firstHalfTime += seg.SegmentTime;
					runningDistance += seg.SegmentDistanceMiles;
				}
				else
					break;
			}

			var secondHalfTime = result.NetTime.Value - firstHalfTime;
			isNegativeSplit = secondHalfTime < firstHalfTime;
		}

		return new RunnerSplitAnalysis
		{
			RaceResultId = raceResultId,
			HasSplitData = true,
			Segments = segments,
			IsNegativeSplit = isNegativeSplit,
			OverallPace = result.OverallPace
		};
	}

	/// <summary>
	/// Compares two runners' results side-by-side within the same race.
	/// </summary>
	public async Task<RunnerComparison?> CompareRunnersAsync(long resultId1, long resultId2)
	{
		var result1 = await _resultRepository.GetByIdAsync(resultId1);
		var result2 = await _resultRepository.GetByIdAsync(resultId2);

		if (result1 == null || result2 == null)
			return null;

		if (result1.RaceId != result2.RaceId)
			return null;

		var race = await _raceRepository.GetByIdAsync(result1.RaceId);
		if (race == null)
			return null;

		var metadata = RaceMetadata.FromJson(race.MetadataJson);

		var splitComparisons = new List<SplitComparison>();
		var splits1 = GetSplitValues(result1);
		var splits2 = GetSplitValues(result2);

		for (int i = 0; i < metadata.SplitTimes.Count; i++)
		{
			if (i >= splits1.Count || i >= splits2.Count)
				break;

			splitComparisons.Add(new SplitComparison
			{
				Label = metadata.SplitTimes[i].Label,
				Runner1Time = splits1[i],
				Runner2Time = splits2[i],
				Difference = splits1[i].HasValue && splits2[i].HasValue
					? splits1[i]!.Value - splits2[i]!.Value
					: null
			});
		}

		return new RunnerComparison
		{
			RaceId = result1.RaceId,
			RaceName = race.Name,
			Runner1 = ToComparisonRunner(result1),
			Runner2 = ToComparisonRunner(result2),
			NetTimeDifference = result1.NetTime.HasValue && result2.NetTime.HasValue
				? result1.NetTime.Value - result2.NetTime.Value
				: null,
			SplitComparisons = splitComparisons
		};
	}

	/// <summary>
	/// Gets the top runners from a specific hometown or region within a race.
	/// When region is provided, matches all hometowns ending with ", REGION".
	/// When hometown is provided, matches the exact hometown string.
	/// </summary>
	public async Task<List<RaceResultDto>> GetHometownLeaderboardAsync(int raceId, string? hometown, int limit, string? region = null)
	{
		List<RaceResult> results;

		if (!string.IsNullOrWhiteSpace(region))
			results = await _resultRepository.GetResultsByRegionAsync(raceId, region, limit);
		else if (!string.IsNullOrWhiteSpace(hometown))
			results = await _resultRepository.GetResultsByHometownAsync(raceId, hometown, limit);
		else
			return [];

		return results.Select(RaceResultDto.FromEntity<RaceResultDto>).ToList();
	}

	/// <summary>
	/// Searches for runners by name across all races, optionally scoped to a race or event.
	/// Returns results with event/race context for cross-race discovery.
	/// </summary>
	public async Task<List<MatchedRunnerResult>> SearchRunnerByNameAsync(string name, int? raceId = null, int? eventId = null, EventSeries? eventSeries = null, int limit = 20, int skip = 0, HashSet<long>? excludeResultIds = null)
	{
		var results = await _resultRepository.SearchByNameAsync(name, raceId, eventId, eventSeries, limit, skip, excludeResultIds);

		return results.Select(r => new MatchedRunnerResult
		{
			EventName = r.Race.Event.Name,
			EventSeries = r.Race.EventSeries,
            RaceName = r.Race.Name,
			RaceDate = r.Race.RaceDate,
			Distance = r.Race.Distance,
			ResultId = r.Id,
			OverallPlace = r.OverallPlace,
			NetTime = r.NetTime,
			OverallPace = r.OverallPace,
			Hometown = r.Hometown
		}).ToList();
	}

	/// <summary>
	/// Calculates a runner's percentile ranking (overall, by gender, and by division).
	/// </summary>
	public async Task<RunnerPercentiles?> GetRunnerPercentilesAsync(long raceResultId)
	{
		var detailed = await GetRaceResultDetailedAsync(raceResultId);
		if (detailed == null)
			return null;

		var genderTotal = detailed.ResultData?.Rankings?.GenderTotal;

		return new RunnerPercentiles
		{
			RaceResultId = raceResultId,
			OverallPercentile = CalculatePercentile(detailed.OverallPlace, detailed.RaceRunners),
			GenderPercentile = genderTotal.HasValue
				? CalculatePercentile(detailed.GenderPlace, genderTotal.Value)
				: null,
			DivisionPercentile = CalculatePercentile(detailed.DivisionPlace, detailed.DivisionRunners),
			OverallPlace = detailed.OverallPlace,
			TotalRunners = detailed.RaceRunners,
			GenderPlace = detailed.GenderPlace,
			GenderRunners = genderTotal ?? 0,
			DivisionPlace = detailed.DivisionPlace,
			DivisionRunners = detailed.DivisionRunners
		};
	}

	/// <summary>
	/// Gets race weather data from the stored JSON.
	/// </summary>
	public async Task<string?> GetRaceWeatherJsonAsync(int raceId)
	{
		var race = await _raceRepository.GetByIdAsync(raceId);
		return race?.WeatherDataJson;
	}

	/// <summary>
	/// Gets distinct regions (states/countries) represented in race results with runner counts
	/// broken down by runner type (runner, push rim, hand cycle, duo).
	/// Scope: raceId for a single race, eventId for all races in an event, neither for all results.
	/// </summary>
	public async Task<List<HometownRegion>> GetHometownRegionsAsync(int? raceId = null, int? eventId = null)
	{
		var counts = await _resultRepository.GetHometownRunnerTypeCountsAsync(raceId, eventId);

		var regionGroups = counts
			.Select(c => (Parsed: ParseHometown(c.Hometown), c.RunnerType, c.Count))
			.Where(c => !string.IsNullOrEmpty(c.Parsed.Region))
			.GroupBy(c => c.Parsed.Region, StringComparer.OrdinalIgnoreCase)
			.Select(g =>
			{
				var region = g.Key;
				var isUsState = region.Length == 2 && region.All(char.IsLetter);
				return new HometownRegion
				{
					Region = region,
					Country = isUsState ? "United States" : region,
					IsUsState = isUsState,
					CityCount = g.Select(c => c.Parsed.City).Distinct(StringComparer.OrdinalIgnoreCase).Count(),
					RunnerCount = g.Sum(c => c.Count),
					Runners = g.Where(c => c.RunnerType == Enums.RunnerType.Runner).Sum(c => c.Count),
					PushRim = g.Where(c => c.RunnerType == Enums.RunnerType.PushRim).Sum(c => c.Count),
					HandCycle = g.Where(c => c.RunnerType == Enums.RunnerType.HandCycle).Sum(c => c.Count),
					Duo = g.Where(c => c.RunnerType == Enums.RunnerType.Duo).Sum(c => c.Count)
				};
			})
			.OrderByDescending(r => r.RunnerCount)
			.ToList();

		return regionGroups;
	}

	/// <summary>
	/// Gets the distinct cities within a specific region (state/country) with runner counts
	/// broken down by runner type (runner, push rim, hand cycle, duo).
	/// Scope: raceId for a single race, eventId for all races in an event, neither for all results.
	/// </summary>
	public async Task<List<HometownCity>> GetHometownCitiesAsync(string region, int? raceId = null, int? eventId = null)
	{
		var counts = await _resultRepository.GetHometownRunnerTypeCountsAsync(raceId, eventId);

		var normalizedRegion = region.Trim();

		var cities = counts
			.Select(c => (Parsed: ParseHometown(c.Hometown), c.RunnerType, c.Count))
			.Where(c => c.Parsed.Region.Equals(normalizedRegion, StringComparison.OrdinalIgnoreCase))
			.GroupBy(c => c.Parsed.City, StringComparer.OrdinalIgnoreCase)
			.Select(g => new HometownCity
			{
				City = g.Key,
				FullHometown = g.First().Parsed.FullHometown,
				RunnerCount = g.Sum(c => c.Count),
				Runners = g.Where(c => c.RunnerType == Enums.RunnerType.Runner).Sum(c => c.Count),
				PushRim = g.Where(c => c.RunnerType == Enums.RunnerType.PushRim).Sum(c => c.Count),
				HandCycle = g.Where(c => c.RunnerType == Enums.RunnerType.HandCycle).Sum(c => c.Count),
				Duo = g.Where(c => c.RunnerType == Enums.RunnerType.Duo).Sum(c => c.Count)
			})
			.OrderByDescending(c => c.RunnerCount)
			.ToList();

		return cities;
	}

	private static ParsedHometown ParseHometown(string hometown)
	{
		var lastComma = hometown.LastIndexOf(',');
		if (lastComma < 0)
			return new ParsedHometown { City = hometown.Trim(), Region = "", FullHometown = hometown };

		var city = hometown[..lastComma].Trim();
		var region = hometown[(lastComma + 1)..].Trim();
		return new ParsedHometown { City = city, Region = region, FullHometown = hometown };
	}

	private record ParsedHometown
	{
		public string City { get; init; } = string.Empty;
		public string Region { get; init; } = string.Empty;
		public string FullHometown { get; init; } = string.Empty;
	}

	private static double? CalculatePercentile(int? place, int total)
	{
		if (!place.HasValue || total <= 0)
			return null;

		return Math.Round((1.0 - (double)(place.Value - 1) / total) * 100, 1);
	}

	private static ComparisonRunner ToComparisonRunner(RaceResult r) => new()
	{
		ResultId = r.Id,
		Name = r.Name,
		BibNumber = r.BibNumber,
		Age = r.Age,
		Gender = r.Gender,
		OverallPlace = r.OverallPlace,
		GenderPlace = r.GenderPlace,
		DivisionPlace = r.DivisionPlace,
		NetTime = r.NetTime,
		ClockTime = r.ClockTime,
		OverallPace = r.OverallPace,
		Hometown = r.Hometown
	};

	private static List<TimeSpan?> GetSplitValues(RaceResult r) =>
	[
		r.Split1, r.Split2, r.Split3, r.Split4, r.Split5,
		r.Split6, r.Split7, r.Split8, r.Split9, r.Split10
	];

	/// <summary>
	/// Gets race statistics for all races in a year range, optionally filtered by distance.
	/// Returns summary stats (runner counts by type/gender, DNF) for each race, grouped by event.
	/// Uses pre-calculated StatisticsJson when available to avoid expensive re-computation.
	/// </summary>
	public async Task<List<BulkRaceStatsResult>> GetBulkRaceStatsAsync(
		int? startYear = null,
		int? endYear = null,
		int? eventId = null,
		RaceDistance? distance = null,
		EventSeries? eventSeries = null)
	{
		List<Event> events;

		if (eventId.HasValue)
		{
			var evt = await _eventRepository.GetByIdAsync(eventId.Value);
			events = evt != null ? [evt] : [];
		}
		else
		{
			events = await _eventRepository.GetAllWithRacesAsync();
		}

		var results = new List<BulkRaceStatsResult>();

		foreach (var evt in events)
		{
			foreach (var race in evt.Races)
			{
				var year = race.RaceDate.Year;
				if (startYear.HasValue && year < startYear.Value) continue;
				if (endYear.HasValue && year > endYear.Value) continue;
				if (distance.HasValue && race.Distance != distance.Value) continue;
				if (eventSeries.HasValue && race.EventSeries != eventSeries.Value) continue;

				var stats = RaceStats.FromJson(race.StatisticsJson);
				if (stats == null)
				{
					stats = await _raceRepository.BuildRaceStats(race.Id);
				}

				results.Add(new BulkRaceStatsResult
				{
					EventId = evt.Id,
					EventName = evt.Name,
					EventSeries = evt.EventSeries,
					RaceId = race.Id,
					RaceName = race.Name,
					RaceDate = race.RaceDate,
					Distance = race.Distance,
					TotalRunners = stats.TotalRunners,
					MaleRunners = stats.MaleRunners,
					FemaleRunners = stats.FemaleRunners,
					RunnerTypeRunner = stats.RunnerTypeRunner,
					RunnerTypePushRim = stats.RunnerTypePushRim,
					RunnerTypeHandCycle = stats.RunnerTypeHandCycle,
					RunnerTypeDuo = stats.RunnerTypeDuo,
					DNFCount = stats.DNFCount,
					RunnersOver16minPace = stats.RunnersOver16minPace
				});
			}
		}

		return results.OrderBy(r => r.RaceDate).ToList();
	}
}
