namespace Falchion.Villains.Vault.Api.Enums;

/// <summary>
/// Represents standard full race distances for runDisney events.
/// Split distances are now tracked dynamically via RaceMetadata.SplitTimes.
/// </summary>
public enum RaceDistance
{
    FiveK = 1,
    TenK = 2,
    TenMile = 3,
    HalfMarathon = 4,
    FullMarathon = 5
}

/// <summary>
/// Extension methods for RaceDistance enum.
/// </summary>
public static class RaceDistanceExtensions
{
	/// <summary>
	/// Gets the distance in miles for the race distance.
	/// </summary>
	public static double GetMiles(this RaceDistance distance)
	{
		return distance switch
		{
			RaceDistance.FiveK => 3.10686,
			RaceDistance.TenK => 6.21371,
			RaceDistance.TenMile => 10.0,
			RaceDistance.HalfMarathon => 13.1,
			RaceDistance.FullMarathon => 26.2,
			_ => throw new ArgumentOutOfRangeException(nameof(distance))
		};
	}

	/// <summary>
	/// Gets a display-friendly name for the race distance.
	/// </summary>
	public static string ToDisplayName(this RaceDistance distance)
	{
		return distance switch
		{
			RaceDistance.FiveK => "5K",
			RaceDistance.TenK => "10K",
			RaceDistance.TenMile => "10 Mile",
			RaceDistance.HalfMarathon => "Half Marathon",
			RaceDistance.FullMarathon => "Marathon",
			_ => distance.ToString()
		};
	}

	/// <summary>
	/// Parses a distance string to a RaceDistance enum using fuzzy matching.
	/// Supports various formats and common variations.
	/// </summary>
	/// <param name="distanceString">Distance string (e.g., "5K", "Half Marathon", "10 Mile")</param>
	/// <returns>RaceDistance enum value, or null if unable to parse</returns>
	public static RaceDistance? ParseDistance(string? distanceString)
	{
		if (string.IsNullOrWhiteSpace(distanceString))
			return null;

		var normalized = distanceString.Trim().ToLower()
			.Replace("-", " ")
			.Replace("_", " ");

		// 5K variations
		if (normalized.Contains("5") && normalized.Contains("k"))
			return RaceDistance.FiveK;

		// 10K variations
		if (normalized.Contains("10") && normalized.Contains("k"))
			return RaceDistance.TenK;

		// 10 Mile variations
		if (normalized.Contains("10") && (normalized.Contains("mile") || normalized.Contains("mi")))
			return RaceDistance.TenMile;

		// Half Marathon variations
		if (normalized.Contains("half") || normalized.Contains("13.1"))
			return RaceDistance.HalfMarathon;

		// Full Marathon variations
		if ((normalized.Contains("marathon") || normalized.Contains("26.2")) && !normalized.Contains("half"))
			return RaceDistance.FullMarathon;

		// Exact matches as fallback
		return normalized switch
		{
			"5k" => RaceDistance.FiveK,
			"10k" => RaceDistance.TenK,
			"half" => RaceDistance.HalfMarathon,
			"marathon" => RaceDistance.FullMarathon,
			"full" => RaceDistance.FullMarathon,
			_ => null
		};
	}
}
