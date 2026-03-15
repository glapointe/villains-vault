using Microsoft.EntityFrameworkCore;
using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Models;

namespace Falchion.Villains.Vault.Api.Utils
{
    public class RaceAnalyzer
    {
        public static RaceStats BuildRaceStats(Race race, List<RaceResult> results)
        {
            var raceStats = new RaceStats();

            // Total runners (all participants including DNF, all runner types)
            raceStats.TotalRunners = results.Count;

            // Gender counts (excluding Duo runners since gender is unknown for them)
            raceStats.MaleRunners = results.Where(r => r.Gender == Gender.Male).Count();
            raceStats.FemaleRunners = results.Where(r => r.Gender == Gender.Female).Count();
            raceStats.UnknownRunners = results.Where(r => r.Gender == Gender.Unknown).Count();

            // Runner type counts (excluding DNF since we can't determine runner type for DNF)
            var nonDnfResults = results.Where(r => r.OverallPlace.HasValue && r.OverallPlace.Value > 0).ToList();
            raceStats.RunnerTypeRunner = nonDnfResults.Where(r => r.RunnerType == RunnerType.Runner).Count();
            raceStats.RunnerTypePushRim = nonDnfResults.Where(r => r.RunnerType == RunnerType.PushRim).Count();
            raceStats.RunnerTypeHandCycle = nonDnfResults.Where(r => r.RunnerType == RunnerType.HandCycle).Count();
            raceStats.RunnerTypeDuo = nonDnfResults.Where(r => r.RunnerType == RunnerType.Duo).Count();

            // DNFCount
            raceStats.DNFCount = results.Where(r => !r.OverallPlace.HasValue || r.OverallPlace.Value == 0).Count();

            // Build split time statistics
            // Use metadata to construct segments from start to each split, and from last split to finish
            var metadata = RaceMetadata.FromJson(race.MetadataJson);
            raceStats.Splits = BuildSplitTimeStats(metadata, results, race.Distance);

            // Runners over 16 min/mile pace


            var sixteenMinutePace = TimeSpan.FromMinutes(16);
            raceStats.RunnersOver16minPace = nonDnfResults.Where(r => r.OverallPace.HasValue && r.OverallPace.Value > sixteenMinutePace).Count();

            // Launch time (start line congestion) - from first to last starter
            var resultsWithStartTime = results.Where(r => r.StartTime.HasValue).ToList();
            if (resultsWithStartTime.Any())
            {
                var firstStart = resultsWithStartTime.Min(r => r.StartTime!.Value);
                var lastStart = resultsWithStartTime.Max(r => r.StartTime!.Value);
                raceStats.LaunchTime = lastStart - firstStart;

                // Calculate launch congestion factor
                if (raceStats.LaunchTime.TotalMinutes > 0)
                {
                    raceStats.LaunchCongestionFactor = (decimal)raceStats.TotalRunners / (decimal)raceStats.LaunchTime.TotalMinutes;
                }
            }

            // Landing time (finish line congestion) - exclude DNF, HandCycle, and PushRim
            var landingResults = nonDnfResults
                .Where(r => r.RunnerType == RunnerType.Runner || r.RunnerType == RunnerType.Duo)
                .Where(r => r.ClockTime.HasValue)
                .ToList();

            if (landingResults.Any())
            {
                var firstFinish = landingResults.Min(r => r.ClockTime!.Value);
                var lastFinish = landingResults.Max(r => r.ClockTime!.Value);
                raceStats.LandingTime = lastFinish - firstFinish;

                // Calculate landing congestion factor
                if (raceStats.LandingTime.TotalMinutes > 0)
                {
                    raceStats.LandingCongestionFactor = (decimal)landingResults.Count / (decimal)raceStats.LandingTime.TotalMinutes;
                }
            }

            // Slowest finisher (by net time, excluding DNF)
            var slowestByNetTime = nonDnfResults
                .Where(r => r.NetTime.HasValue)
                .OrderByDescending(r => r.NetTime!.Value)
                .FirstOrDefault();
            raceStats.SlowestFinisherResultId = slowestByNetTime?.Id;

            // Last finisher (by clock time, excluding DNF)
            var lastByClock = nonDnfResults
                .Where(r => r.ClockTime.HasValue)
                .OrderByDescending(r => r.ClockTime!.Value)
                .FirstOrDefault();
            raceStats.LastFinisherResultId = lastByClock?.Id;

            // Age group stats for males
            raceStats.MaleAgeGroupStats = BuildAgeGroupStats(
                results.Where(r => r.Gender == Gender.Male || r.Gender == Gender.Unknown).ToList()
            );

            // Age group stats for females
            raceStats.FemaleAgeGroupStats = BuildAgeGroupStats(
                results.Where(r => r.Gender == Gender.Female || r.Gender == Gender.Unknown).ToList()
            );

            return raceStats;
        }

        /// <summary>
        /// Helper method to find the index of the last recorded split for a runner.
        /// Returns -1 if no splits are recorded.
        /// </summary>
        private static int GetLastRecordedSplitIndex(RaceResult result, string[] splitProperties)
        {
            for (int i = splitProperties.Length - 1; i >= 0; i--)
            {
                var property = typeof(RaceResult).GetProperty(splitProperties[i]);
                if (property != null && property.GetValue(result) != null)
                {
                    return i;
                }
            }
            return -1; // No splits recorded
        }

        /// <summary>
        /// Helper method to build age group statistics for a given set of results.
        /// Age groups are in 5-year increments: 0-4, 5-9, 10-14, ..., 75-79, 80+
        /// </summary>
        private static List<AgeGroupItem> BuildAgeGroupStats(List<RaceResult> results)
        {
            var ageGroups = new List<AgeGroupItem>();

            // Define age group ranges
            var ageRanges = new List<(int Min, int Max, string Label)>();
            for (int i = 0; i < 80; i += 5)
            {
                ageRanges.Add((i, i + 4, $"{i}-{i + 4}"));
            }
            ageRanges.Add((80, int.MaxValue, "80+"));

            foreach (var (min, max, label) in ageRanges)
            {
                var groupResults = results.Where(r => r.Age >= min && r.Age <= max).ToList();

                if (groupResults.Count == 0)
                {
                    continue; // Skip empty age groups
                }

                var dnfCount = groupResults.Where(r => !r.OverallPlace.HasValue || r.OverallPlace.Value == 0).Count();
                var finishedResults = groupResults.Where(r => r.OverallPlace.HasValue && r.OverallPlace.Value > 0 && r.NetTime.HasValue).ToList();

                var ageGroupItem = new AgeGroupItem
                {
                    AgeGroupLabel = label,
                    Count = groupResults.Count,
                    AgeRange = new List<int> { min, max },
                    DNFCount = dnfCount
                };

                // Calculate average net time
                if (finishedResults.Any())
                {
                    var avgNetTimeTicks = (long)finishedResults.Average(r => r.NetTime!.Value.Ticks);
                    ageGroupItem.AverageNetTime = TimeSpan.FromTicks(avgNetTimeTicks);
                }

                // Calculate average pace
                if (finishedResults.Any(r => r.OverallPace.HasValue))
                {
                    var avgPaceTicks = (long)finishedResults
                        .Where(r => r.OverallPace.HasValue)
                        .Average(r => r.OverallPace!.Value.Ticks);
                    ageGroupItem.AveragePace = TimeSpan.FromTicks(avgPaceTicks);
                }

                // Calculate median pace
                if (finishedResults.Any(r => r.OverallPace.HasValue))
                {
                    var paces = finishedResults
                        .Where(r => r.OverallPace.HasValue)
                        .Select(r => r.OverallPace!.Value)
                        .OrderBy(p => p)
                        .ToList();

                    if (paces.Count > 0)
                    {
                        int middleIndex = paces.Count / 2;
                        if (paces.Count % 2 == 0)
                        {
                            // Even number of elements - average the two middle values
                            var medianTicks = (paces[middleIndex - 1].Ticks + paces[middleIndex].Ticks) / 2;
                            ageGroupItem.MedianPace = TimeSpan.FromTicks(medianTicks);
                        }
                        else
                        {
                            // Odd number of elements - take the middle value
                            ageGroupItem.MedianPace = paces[middleIndex];
                        }
                    }
                }

                ageGroups.Add(ageGroupItem);
            }

            return ageGroups;
        }

        /// <summary>
        /// Helper method to build split time statistics for each segment of the race.
        /// Creates segments from start to each split, and from last split to finish line.
        /// </summary>
        private static List<SplitTimeStats> BuildSplitTimeStats(RaceMetadata metadata, List<RaceResult> results, RaceDistance raceDistance)
        {
            var splitStats = new List<SplitTimeStats>();

            if (metadata.SplitTimes == null || !metadata.SplitTimes.Any())
            {
                return splitStats;
            }

            var totalRaceDistanceInMiles = raceDistance.GetMiles();
            var splitProperties = new[] { "Split1", "Split2", "Split3", "Split4", "Split5", "Split6", "Split7", "Split8", "Split9", "Split10" };

            // Build segments for each split
            for (int i = 0; i < metadata.SplitTimes.Count; i++)
            {
                var currentSplit = metadata.SplitTimes[i];
                var previousSplitDistance = i > 0 ? PaceHelpers.ConvertToMiles(metadata.SplitTimes[i - 1].Distance, metadata.SplitTimes[i - 1].IsKilometers) : 0.0;
                var currentSplitDistance = PaceHelpers.ConvertToMiles(currentSplit.Distance, currentSplit.IsKilometers);

                var segmentDistance = (double)(currentSplitDistance - previousSplitDistance);

                // Get the property for this split (Split1, Split2, etc.)
                var property = typeof(RaceResult).GetProperty(splitProperties[i]);
                if (property == null)
                {
                    continue;
                }

                // Get results that have data for this split and are not DNF
                var resultsWithSplit = results
                    .Where(r => r.OverallPlace.HasValue && r.OverallPlace.Value > 0)
                    .Where(r => property.GetValue(r) != null)
                    .ToList();

                // Count misses (results without this split time)
                // For DNF runners, only count missed splits that occur before their last recorded split
                var missCount = results.Count(r =>
                {
                    if (property.GetValue(r) != null)
                        return false; // Has this split, not a miss

                    // Missing this split - check if it's a legitimate miss
                    var isDnf = !r.OverallPlace.HasValue || r.OverallPlace.Value == 0;

                    if (!isDnf)
                        return true; // Non-DNF runner missing a split is always a miss

                    // For DNF runners, only count as miss if this split is before their last recorded split
                    var lastRecordedSplitIndex = GetLastRecordedSplitIndex(r, splitProperties);
                    return i <= lastRecordedSplitIndex; // Only count if current split is at or before last recorded
                });

                // Calculate segment times (time from previous split to this split)
                var segmentTimes = new List<TimeSpan>();

                if (i == 0)
                {
                    // First split: segment time is just the split time itself
                    segmentTimes = resultsWithSplit
                        .Select(r => (TimeSpan?)property.GetValue(r))
                        .Where(t => t.HasValue)
                        .Select(t => t!.Value)
                        .ToList();
                }
                else
                {
                    // Subsequent splits: segment time = current split - previous split
                    var previousProperty = typeof(RaceResult).GetProperty(splitProperties[i - 1]);
                    if (previousProperty != null)
                    {
                        segmentTimes = resultsWithSplit
                            .Where(r => previousProperty.GetValue(r) != null)
                            .Select(r => new
                            {
                                Current = (TimeSpan?)property.GetValue(r),
                                Previous = (TimeSpan?)previousProperty.GetValue(r)
                            })
                            .Where(x => x.Current.HasValue && x.Previous.HasValue)
                            .Select(x => x.Current!.Value - x.Previous!.Value)
                            .Where(t => t > TimeSpan.Zero) // Filter out negative times (data errors)
                            .ToList();
                    }
                }

                // Calculate paces for this segment
                var segmentPaces = segmentTimes
                    .Where(t => segmentDistance > 0)
                    .Select(t => TimeSpan.FromMinutes(t.TotalMinutes / (double)segmentDistance))
                    .ToList();

                var splitStat = new SplitTimeStats
                {
                    TotalDistanceToSplitInMiles = Math.Round(currentSplitDistance, 1),
                    Label = currentSplit.Label,
                    SegmentDistanceInMiles = Math.Round(segmentDistance, 1),
                    Misses = missCount
                };

                // Calculate average pace for this segment
                if (segmentPaces.Any())
                {
                    var avgPaceTicks = (long)segmentPaces.Average(p => p.Ticks);
                    splitStat.AveragePace = TimeSpan.FromTicks(avgPaceTicks);
                }

                // Calculate median pace for this segment
                if (segmentPaces.Any())
                {
                    var orderedPaces = segmentPaces.OrderBy(p => p).ToList();
                    int middleIndex = orderedPaces.Count / 2;
                    if (orderedPaces.Count % 2 == 0)
                    {
                        var medianTicks = (orderedPaces[middleIndex - 1].Ticks + orderedPaces[middleIndex].Ticks) / 2;
                        splitStat.MedianPace = TimeSpan.FromTicks(medianTicks);
                    }
                    else
                    {
                        splitStat.MedianPace = orderedPaces[middleIndex];
                    }
                }

                splitStats.Add(splitStat);
            }

            // Add final segment from last split to finish line
            if (metadata.SplitTimes.Any())
            {
                var lastSplit = metadata.SplitTimes.Last();
                var lastSplitIndex = metadata.SplitTimes.Count - 1;
                var lastSplitDistance = PaceHelpers.ConvertToMiles(lastSplit.Distance, lastSplit.IsKilometers);
                var finalSegmentDistance = (double)(totalRaceDistanceInMiles - lastSplitDistance);

                if (finalSegmentDistance > 0)
                {
                    // Get the property for the last split
                    var lastProperty = typeof(RaceResult).GetProperty(splitProperties[lastSplitIndex]);

                    if (lastProperty != null)
                    {
                        // Calculate finish segment times (NetTime - last split time)
                        var finishSegmentTimes = results
                            .Where(r => r.OverallPlace.HasValue && r.OverallPlace.Value > 0)
                            .Where(r => r.NetTime.HasValue && lastProperty.GetValue(r) != null)
                            .Select(r => new
                            {
                                NetTime = r.NetTime!.Value,
                                LastSplit = (TimeSpan?)lastProperty.GetValue(r)
                            })
                            .Where(x => x.LastSplit.HasValue)
                            .Select(x => x.NetTime - x.LastSplit!.Value)
                            .Where(t => t > TimeSpan.Zero)
                            .ToList();

                        // Calculate paces for the final segment
                        var finishSegmentPaces = finishSegmentTimes
                            .Select(t => TimeSpan.FromMinutes(t.TotalMinutes / (double)finalSegmentDistance))
                            .ToList();

                        // Count DNF as misses for the finish segment
                        var finishMisses = results.Count(r => r.OverallPlace.HasValue && r.OverallPlace.Value > 0 && r.NetTime == TimeSpan.Zero);

                        var finishStat = new SplitTimeStats
                        {
                            TotalDistanceToSplitInMiles = Math.Round(totalRaceDistanceInMiles, 1),
                            Label = "Finish",
                            SegmentDistanceInMiles = Math.Round(finalSegmentDistance, 1),
                            Misses = finishMisses
                        };

                        // Calculate average pace for finish segment
                        if (finishSegmentPaces.Any())
                        {
                            var avgPaceTicks = (long)finishSegmentPaces.Average(p => p.Ticks);
                            finishStat.AveragePace = TimeSpan.FromTicks(avgPaceTicks);
                        }

                        // Calculate median pace for finish segment
                        if (finishSegmentPaces.Any())
                        {
                            var orderedPaces = finishSegmentPaces.OrderBy(p => p).ToList();
                            int middleIndex = orderedPaces.Count / 2;
                            if (orderedPaces.Count % 2 == 0)
                            {
                                var medianTicks = (orderedPaces[middleIndex - 1].Ticks + orderedPaces[middleIndex].Ticks) / 2;
                                finishStat.MedianPace = TimeSpan.FromTicks(medianTicks);
                            }
                            else
                            {
                                finishStat.MedianPace = orderedPaces[middleIndex];
                            }
                        }

                        splitStats.Add(finishStat);
                    }
                }
            }

            return splitStats;
        }
    }
}
