using System.Text.Json;

namespace Falchion.Villains.Vault.Api.Models;

/// <summary>
/// Represents the detailed progress data for a job, stored as JSON in the database.
/// Tracks division-level progress and aggregate statistics.
/// </summary>
public class JobProgressData
{
	/// <summary>
	/// List of divisions discovered in the race with their individual progress.
	/// </summary>
	public List<DivisionProgress> Divisions { get; set; } = new();

	/// <summary>
	/// Total number of new records added across all divisions.
	/// Separately tracked for quick access without recalculating from divisions.
	/// </summary>
	public int TotalAdded { get; set; }

	/// <summary>
	/// Total number of existing records updated across all divisions.
	/// Separately tracked for quick access without recalculating from divisions.
	/// </summary>
	public int TotalUpdated { get; set; }

	/// <summary>
	/// Deserializes JSON string to JobProgressData.
	/// Returns empty instance if deserialization fails.
	/// </summary>
	public static JobProgressData FromJson(string json)
	{
		try
		{
			return JsonSerializer.Deserialize<JobProgressData>(json) ?? new JobProgressData();
		}
		catch
		{
			return new JobProgressData();
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
