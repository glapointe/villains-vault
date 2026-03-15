using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.Data.Entities;

/// <summary>
/// Represents a runner's result for a specific race.
/// </summary>
public class RaceResult
{
	/// <summary>
	/// Primary key. Using long for scalability with large datasets.
	/// </summary>
	public long Id { get; set; }

	/// <summary>
	/// Foreign key to the race.
	/// </summary>
	public int RaceId { get; set; }

	/// <summary>
	/// Foreign key to the division this result belongs to.
	/// A runner can only be in one division per race.
	/// </summary>
	public int DivisionId { get; set; }

	/// <summary>
	/// Runner's bib number. Combined with RaceId forms a unique constraint.
	/// </summary>
	public int BibNumber { get; set; } = 0;

	/// <summary>
	/// Runner's name as it appears on Track Shack.
	/// </summary>
	public string Name { get; set; } = string.Empty;

	/// <summary>
	/// Runner's age at time of race.
	/// </summary>
	public int Age { get; set; }

	/// <summary>
	/// Runner's gender (Male, Female, Unknown).
	/// Determined from division label.
	/// </summary>
	public Gender Gender { get; set; }

	/// <summary>
	/// Type of runner (Runner, PushRim, HandCycle, Duo).
	/// Determined from division name.
	/// </summary>
	public RunnerType RunnerType { get; set; }

	/// <summary>
	/// Runner's place within their division.
	/// </summary>
	public int? DivisionPlace { get; set; }

	/// <summary>
	/// Runner's overall place in the race.
	/// </summary>
	public int? OverallPlace { get; set; }

	/// <summary>
	/// Runner's place within their gender category.
	/// </summary>
	public int? GenderPlace { get; set; }

	/// <summary>
	/// Runner's net time (chip time from crossing start to finish).
	/// </summary>
	public TimeSpan? NetTime { get; set; }

	/// <summary>
	/// Runner's clock time (gun time from official start to finish).
	/// </summary>
	public TimeSpan? ClockTime { get; set; }

    /// <summary>
    /// The effective start time from zero based on NetTime and ClockTime.
    /// </summary>
    public TimeSpan? StartTime { get; set; }

	/// <summary>
	/// Average pace per mile (calculated from NetTime and race distance).
	/// Stored to avoid recalculating for every query.
	/// Format: TimeSpan representing time per mile (e.g., 00:08:30 for 8:30/mile pace).
	/// </summary>
	public TimeSpan? OverallPace { get; set; }

	/// <summary>
	/// Runner's hometown as listed on Track Shack.
	/// </summary>
	public string? Hometown { get; set; }

	// Generic split times - up to 10 splits can be stored per race
	// The actual split distances/labels are defined in Race.Metadata.SplitTimes
	/// <summary>Split time 1 (see Race.Metadata.SplitTimes for label/distance)</summary>
	public TimeSpan? Split1 { get; set; }
	
	/// <summary>Split time 2 (see Race.Metadata.SplitTimes for label/distance)</summary>
	public TimeSpan? Split2 { get; set; }
	
	/// <summary>Split time 3 (see Race.Metadata.SplitTimes for label/distance)</summary>
	public TimeSpan? Split3 { get; set; }
	
	/// <summary>Split time 4 (see Race.Metadata.SplitTimes for label/distance)</summary>
	public TimeSpan? Split4 { get; set; }
	
	/// <summary>Split time 5 (see Race.Metadata.SplitTimes for label/distance)</summary>
	public TimeSpan? Split5 { get; set; }
	
	/// <summary>Split time 6 (see Race.Metadata.SplitTimes for label/distance)</summary>
	public TimeSpan? Split6 { get; set; }
	
	/// <summary>Split time 7 (see Race.Metadata.SplitTimes for label/distance)</summary>
	public TimeSpan? Split7 { get; set; }
	
	/// <summary>Split time 8 (see Race.Metadata.SplitTimes for label/distance)</summary>
	public TimeSpan? Split8 { get; set; }
	
	/// <summary>Split time 9 (see Race.Metadata.SplitTimes for label/distance)</summary>
	public TimeSpan? Split9 { get; set; }
	
	/// <summary>Split time 10 (see Race.Metadata.SplitTimes for label/distance)</summary>
	public TimeSpan? Split10 { get; set; }

	/// <summary>
	/// Number of runners this runner passed during the race ("kills").
	/// A pass occurs when a runner starts later but finishes with a faster clock time.
	/// Calculated post-parse from StartTime and ClockTime comparisons.
	/// </summary>
	public int? Passes { get; set; }

	/// <summary>
	/// Number of runners who passed this runner during the race ("assassins").
	/// A passer is a runner who started later but finished with a faster clock time.
	/// Calculated post-parse from StartTime and ClockTime comparisons.
	/// </summary>
	public int? Passers { get; set; }

	/// <summary>
	/// JSON-serialized breakdown and ranking data for this result.
	/// Contains pass/passer breakdowns by division, gender, hometown, and region,
	/// plus rank within those groupings. Strongly typed as <see cref="Models.ResultBreakdownData"/>.
	/// </summary>
	public string? ResultDataJson { get; set; }

	/// <summary>
	/// When this result was first created.
	/// </summary>
	public DateTime CreatedAt { get; set; }

	/// <summary>
	/// When this result was last modified.
	/// Updated only when data changes during reparse.
	/// </summary>
	public DateTime ModifiedAt { get; set; }

	// Navigation properties
	public Race Race { get; set; } = null!;
	public Division Division { get; set; } = null!;
}
