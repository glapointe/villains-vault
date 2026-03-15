using System.Text.Json;

namespace Falchion.Villains.Vault.Api.Models;

/// <summary>
/// Metadata for a race, stored as JSON in the database.
/// Contains information about available splits and other race-specific data.
/// </summary>
public class RaceMetadata
{
	/// <summary>
	/// List of split time information available in this race.
	/// Each entry contains the distance, label, and unit (miles/kilometers).
	/// Used to determine which split columns contain data when querying results.
	/// </summary>
	public List<SplitTimeInfo> SplitTimes { get; set; } = new();

	/// <summary>
	/// Deserializes JSON string to RaceMetadata.
	/// Returns empty instance if deserialization fails.
	/// </summary>
	public static RaceMetadata FromJson(string json)
	{
		try
		{
			return JsonSerializer.Deserialize<RaceMetadata>(json) ?? new RaceMetadata();
		}
		catch
		{
			return new RaceMetadata();
		}
	}

	/// <summary>
	/// Serializes this instance to JSON string.
	/// </summary>
	public string ToJson()
	{
		return JsonSerializer.Serialize(this);
	}
}
