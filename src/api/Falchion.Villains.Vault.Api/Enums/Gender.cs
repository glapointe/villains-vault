namespace Falchion.Villains.Vault.Api.Enums;

/// <summary>
/// Represents the gender category of a runner.
/// Determined from the division label (e.g., "MEN -- 50 THROUGH 54", "WOMEN -- 30 THROUGH 34").
/// </summary>
public enum Gender
{
	/// <summary>
	/// Gender cannot be determined (e.g., Duo Division).
	/// </summary>
	Unknown = 0,

	/// <summary>
	/// Male runner.
	/// </summary>
	Male = 1,

	/// <summary>
	/// Female runner.
	/// </summary>
	Female = 2
}

/// <summary>
/// Helper methods for Gender enum operations.
/// </summary>
public static class GenderHelpers
{
	/// <summary>
	/// Parses gender from division label.
	/// </summary>
	/// <param name="divisionLabel">The division label (e.g., "MEN -- 50 THROUGH 54", "WOMEN -- 30 THROUGH 34")</param>
	/// <returns>Parsed gender (defaults to Unknown if cannot determine)</returns>
	public static Gender ParseFromDivisionLabel(string divisionLabel)
	{
		if (string.IsNullOrWhiteSpace(divisionLabel))
		{
			return Gender.Unknown;
		}

		var upperLabel = divisionLabel.ToUpper();

		// Check for WOMEN first (to avoid matching "WOMEN" in "MEN")
		if (upperLabel.Contains("WOMEN") || upperLabel.Contains("FEMALE"))
		{
			return Gender.Female;
		}

		// Check for MEN (but not WOMEN)
		if (upperLabel.Contains("MEN") || upperLabel.Contains("MALE"))
		{
			return Gender.Male;
		}

		// Default to Unknown (e.g., Duo Division)
		return Gender.Unknown;
	}
}
