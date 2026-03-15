namespace Falchion.Villains.Vault.Api.Enums;

/// <summary>
/// Represents the possible columns in a race results table.
/// Used for dynamic column mapping when parsing Track Shack results.
/// </summary>
public enum RaceResultColumn
{
	/// <summary>Division placement (1st in age group, etc.)</summary>
	DivisionPlace,
	
	/// <summary>Runner's full name</summary>
	Name,
	
	/// <summary>Bib number (unique identifier for race)</summary>
	BibNumber,
	
	/// <summary>Runner's age</summary>
	Age,

    /// <summary>Runner's gender (Male, Female, Unknown)</summary>
    Gender,
	
	/// <summary>Overall placement in race</summary>
	OverallPlace,
	
	/// <summary>Gender-based placement</summary>
	GenderPlace,
	
	/// <summary>Generic split time 1 (see Race.Metadata.SplitTimes for label/distance)</summary>
	Split1,
	
	/// <summary>Generic split time 2 (see Race.Metadata.SplitTimes for label/distance)</summary>
	Split2,
	
	/// <summary>Generic split time 3 (see Race.Metadata.SplitTimes for label/distance)</summary>
	Split3,
	
	/// <summary>Generic split time 4 (see Race.Metadata.SplitTimes for label/distance)</summary>
	Split4,
	
	/// <summary>Generic split time 5 (see Race.Metadata.SplitTimes for label/distance)</summary>
	Split5,
	
	/// <summary>Generic split time 6 (see Race.Metadata.SplitTimes for label/distance)</summary>
	Split6,
	
	/// <summary>Generic split time 7 (see Race.Metadata.SplitTimes for label/distance)</summary>
	Split7,
	
	/// <summary>Generic split time 8 (see Race.Metadata.SplitTimes for label/distance)</summary>
	Split8,
	
	/// <summary>Generic split time 9 (see Race.Metadata.SplitTimes for label/distance)</summary>
	Split9,
	
	/// <summary>Generic split time 10 (see Race.Metadata.SplitTimes for label/distance)</summary>
	Split10,
	
	/// <summary>Clock/Gun time (official race time from start gun)</summary>
	ClockTime,
	
	/// <summary>Net/Chip time (time from crossing start line to finish)</summary>
	NetTime,

    /// <summary>Calculated start time from zero based on NetTime and ClockTime</summary>
	StartTime,

    /// <summary>Average pace per mile</summary>
    OverallPace,
	
	/// <summary>Runner's hometown/city</summary>
	Hometown,

	/// <summary>Number of runners passed during the race (kills)</summary>
	Passes,

	/// <summary>Number of runners who passed this runner (assassins)</summary>
	Passers
}
