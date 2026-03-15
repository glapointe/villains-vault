namespace Falchion.Villains.Vault.Api.Enums;

/// <summary>
/// Represents the type of runner participating in a race.
/// This is determined from the division name (e.g., "Duo Division", "Wheelchair -- Men Hand Cycle").
/// </summary>
public enum RunnerType
{
	/// <summary>
	/// Standard runner (default, no special category).
	/// </summary>
	Runner = 0,

	/// <summary>
	/// Wheelchair push rim athlete.
	/// </summary>
	PushRim = 1,

	/// <summary>
	/// Hand cycle athlete.
	/// </summary>
	HandCycle = 2,

	/// <summary>
	/// Duo team (visually impaired runner with guide).
	/// </summary>
	Duo = 3
}

/// <summary>
/// Extension methods for RunnerType enum.
/// </summary>
public static class RunnerTypeExtensions
{
	/// <summary>
	/// Determines the RunnerType from a division name.
	/// </summary>
	/// <param name="divisionName">The division name (e.g., "Duo Division", "Wheelchair -- Men Hand Cycle")</param>
	/// <returns>The appropriate RunnerType, defaulting to Runner if no match found</returns>
	public static RunnerType FromDivisionName(string divisionName)
	{
		if (string.IsNullOrWhiteSpace(divisionName))
			return RunnerType.Runner;

		var normalized = divisionName.ToLower().Trim();

		// Check for Duo division
		if (normalized.Contains("duo"))
			return RunnerType.Duo;

		// Check for wheelchair categories
		if (normalized.Contains("wheelchair") || normalized.Contains("hand cycle") || normalized.Contains("handcycle"))
		{
			// Hand cycle is typically indicated by "hand cycle" in the division name
			if (normalized.Contains("hand cycle") || normalized.Contains("handcycle"))
				return RunnerType.HandCycle;

			// Push rim is indicated by "push rim" or just "wheelchair" without "hand cycle"
			if (normalized.Contains("push rim") || normalized.Contains("pushrim"))
				return RunnerType.PushRim;

			// Default wheelchair category to push rim
			return RunnerType.PushRim;
		}

		// Default to standard runner
		return RunnerType.Runner;
	}
}
