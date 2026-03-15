using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace Falchion.Villains.Vault.Api.Models
{
    public class AgeGroupItem
    {
        public string AgeGroupLabel { get; set; } = string.Empty;
        public int Count { get; set; }
        public List<int> AgeRange { get; set; } = new List<int> { 0, 0 };
        public TimeSpan AverageNetTime { get; set; } = TimeSpan.Zero;
        public TimeSpan AveragePace { get; set; } = TimeSpan.Zero;
        public TimeSpan MedianPace { get; set; } = TimeSpan.Zero;
        public int DNFCount { get; set; }
    }
    public class SplitTimeStats
    {
        /// <summary>
        /// The label for this split as it appears in the race results.
        /// Examples: "5K", "10K", "Half Marathon", "5 Mile", "11.5 Mile"
        /// </summary>
        public string Label { get; set; } = string.Empty;

        /// <summary>
        /// The average pace achieved from the previous split (start if this is the first split) to the split marker.
        /// </summary>
        public TimeSpan AveragePace { get; set; } = TimeSpan.Zero;

        /// <summary>
        /// The median pace achieved from the previous split (start if this is the first split) to the split marker.
        /// </summary>
        public TimeSpan MedianPace { get; set; } = TimeSpan.Zero;

        /// <summary>
        /// The total distance from the start line to the split marker. If the finish split then this will be the total race distance.
        /// </summary>
        public double TotalDistanceToSplitInMiles { get; set; }

        /// <summary>
        /// The total distance from the previous split (start if this is the first split) to the split marker. If the finish split then this will be from the last available split to the finish line.
        /// </summary>
        public double SegmentDistanceInMiles { get; set; }

        /// <summary>
        /// The total number of runners that have no data for the split. If this is the finish split then this will be all of the DNF runners.
        /// </summary>
        public int Misses { get; set; } = 0;
    }
    public class RaceStats
    {
        /// <summary>
        /// The total number of all runners that participated including DNF, Hand Cycle, Push Rim, Duo, and Unknown
        /// </summary>
        public int TotalRunners { get; set; }

        /// <summary>
        /// The total number of all male runners that participated including DNF, Hand Cycle, Push Rim. Does not include Duo runners since we cannot determine their gender.
        /// </summary>
        public int MaleRunners { get; set; }

        /// <summary>
        /// The total number of all female runners that participated including DNF, Hand Cycle, Push Rim. Does not include Duo runners since we cannot determine their gender.
        /// </summary>
        public int FemaleRunners { get; set; }

        /// <summary>
        /// The total number of runners with unknown gender. Includes DNF runners whose gender could not be determined.
        /// </summary>
        public int UnknownRunners { get; set; }

        /// <summary>
        /// The total number of all runners, including DNF. Hand Cycle, Push Rim, Duo, and Unknown runner types are not included.
        /// </summary>
        public int RunnerTypeRunner { get; set; }

        /// <summary>
        /// The total number of all Push Rim runners that participated. Does not include DNF as we can't determine their runner type so we assume runner.
        /// </summary>
        public int RunnerTypePushRim { get; set; }

        /// <summary>
        /// The total number of all Hand Cycle runners that participated. Does not include DNF as we can't determine their runner type so we assume runner.
        /// </summary>
        public int RunnerTypeHandCycle { get; set; }

        /// <summary>
        /// The total number of all Duo runners that participated. Does not include DNF as we can't determine their runner type so we assume runner.
        /// </summary>
        public int RunnerTypeDuo { get; set; }

        /// <summary>
        /// The total number of DNF runners that participated. DNF runners are stored in a special division and excluded from normal queries, so we have to query them separately.
        /// </summary>
        public int DNFCount { get; set; }

        /// <summary>
        /// For each available split time, break it up into segments so if you have 4 splits there will be five segments where Split1 is from 0mi to Split1.Distance and the last split is from SplitN.Distance to the finish which would be the total race distance.
        /// </summary>
        public List<SplitTimeStats> Splits { get; set; } = new List<SplitTimeStats>();

        /// <summary>
        /// The total number of runners with an overall pace slower than 16 min/mile.
        /// </summary>
        public int RunnersOver16minPace { get; set; }

        /// <summary>
        /// How long was the start line open (from the first to the last starter crossing)?
        /// </summary>
        public TimeSpan LaunchTime { get; set; }

        /// <summary>
        /// Calculate the launch congestion factor as the ratio of total runners to launch time in minutes.
        /// </summary>
        public decimal LaunchCongestionFactor { get; set; }

        /// <summary>
        /// How long was the finish line open (from the first to the last finisher crossing)?
        /// Don't include DNF runners in this calculation since they never crossed the finish line.
        /// Don't include Hand Cycle and Push Rim runners since they have different pace profiles and will potentially finish considerably earlier than the first runners.
        /// </summary>
        public TimeSpan LandingTime { get; set; }

        /// <summary>
        /// Calculate the landing congestion factor as the ratio of total runners to landing time in minutes.
        /// </summary>
        public decimal LandingCongestionFactor { get; set; }

        /// <summary>
        /// The slowest finisher (excluding DNF) with a valid net time.
        /// </summary>
        public long? SlowestFinisherResultId { get; set; }

        /// <summary>
        /// The last person to cross the finish line (excluding DNF).
        /// </summary>
        public long? LastFinisherResultId { get; set; }

        /// <summary>
        /// Stats for each male age group. Age groups are broken down to 5 year increments (e.g., 0-4, 5-9, 10-14, etc.) with the final group being 80+. Each age group includes the count of runners in that group, the average net time, and the average pace.
        /// </summary>
        public List<AgeGroupItem> MaleAgeGroupStats { get; set; } = new List<AgeGroupItem>();

        /// <summary>
        /// Stats for each female age group. Age groups are broken down to 5 year increments (e.g., 0-4, 5-9, 10-14, etc.) with the final group being 80+. Each age group includes the count of runners in that group, the average net time, and the average pace.
        /// </summary>
        public List<AgeGroupItem> FemaleAgeGroupStats { get; set; } = new List<AgeGroupItem>();

        /// <summary>
        /// Serializes this instance to JSON string.
        /// </summary>
        public string ToJson()
        {
            return JsonSerializer.Serialize(this, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        }

        /// <summary>
        /// Deserializes a JSON string to a RaceStats instance.
        /// </summary>
        public static RaceStats? FromJson(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return null;

            return JsonSerializer.Deserialize<RaceStats>(json, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        }
    }
}
