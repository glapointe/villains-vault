using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.Utils;

/// <summary>
/// Utility class for calculating pace from time and distance.
/// </summary>
public static class PaceHelpers
{
	/// <summary>
	/// Calculates pace per mile from finish time and race distance.
	/// </summary>
	/// <param name="time">Total time (typically NetTime)</param>
	/// <param name="distance">Race distance enum</param>
	/// <returns>Pace per mile as TimeSpan, or null if time is null</returns>
	public static TimeSpan? CalculateOverallPace(TimeSpan? time, RaceDistance distance)
	{
		if (!time.HasValue)
			return null;

		var miles = distance.GetMiles();
		return CalculatePace(time.Value, miles);
    }

    /// <summary>
    /// Calculates pace per mile from time and distance in miles.
    /// </summary>
    /// <param name="time"></param>
    /// <param name="distanceInMiles"></param>
    /// <returns></returns>
    /// <exception cref="ArgumentException"></exception>
    public static TimeSpan CalculatePace(TimeSpan time, double distanceInMiles)
	{
		if (distanceInMiles <= 0)
			throw new ArgumentException("Distance must be positive.", nameof(distanceInMiles));

		// Pace = Total Time / Miles
		var paceInSeconds = time.TotalSeconds / distanceInMiles;
		return TimeSpan.FromSeconds(paceInSeconds);
	}

    /// <summary>
    /// Helper method to convert distance to miles.
    /// </summary>
    public static double ConvertToMiles(double distance, bool isKilometers)
    {
        return isKilometers ? distance * 0.621371 : distance;
    }

    /// <summary>
    /// Formats TimeSpan for CSV output (HH:MM:SS)
    /// </summary>
    public static string FormatTime(TimeSpan? time)
    {
        if (!time.HasValue)
            return "";

        return time.Value.ToString(@"hh\:mm\:ss");
    }

    /// <summary>
    /// Formats pace (minutes per mile) for CSV output
    /// </summary>
    public static string FormatPace(TimeSpan? pace)
    {
        if (!pace.HasValue)
            return "";

        return pace.Value.ToString(@"m\:ss");
    }
}
