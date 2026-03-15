using System.Text.Json;

namespace Falchion.Villains.Vault.Api.Models;

/// <summary>
/// Strongly-typed breakdown data stored as JSON on each RaceResult.
/// Contains per-result pass/passer breakdowns and rank data by various dimensions.
/// </summary>
public class ResultBreakdownData
{
	/// <summary>
	/// Pass (kill) breakdowns by category.
	/// </summary>
	public PassBreakdown PassBreakdowns { get; set; } = new();

	/// <summary>
	/// Passer (assassin) breakdowns by category.
	/// </summary>
	public PassBreakdown PasserBreakdowns { get; set; } = new();

	/// <summary>
	/// Rank data within various groupings (by net time).
	/// </summary>
	public RankData Rankings { get; set; } = new();

	/// <summary>
	/// Serializes this instance to a JSON string.
	/// </summary>
	public string ToJson()
	{
		return JsonSerializer.Serialize(this, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
	}

	/// <summary>
	/// Deserializes a JSON string to a ResultBreakdownData instance.
	/// </summary>
	public static ResultBreakdownData? FromJson(string? json)
	{
		if (string.IsNullOrWhiteSpace(json))
			return null;

		return JsonSerializer.Deserialize<ResultBreakdownData>(json, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
	}
}

/// <summary>
/// Breakdown of pass (or passer) counts by various dimensions.
/// </summary>
public class PassBreakdown
{
	/// <summary>
	/// Passes/passers within the same division.
	/// </summary>
	public int? ByDivision { get; set; }

	/// <summary>
	/// Passes/passers within the same gender.
	/// </summary>
	public int? ByGender { get; set; }

	/// <summary>
	/// Passes/passers from the same hometown (city + region).
	/// </summary>
	public int? ByHometown { get; set; }

	/// <summary>
	/// Passes/passers from the same region (state/country).
	/// </summary>
	public int? ByRegion { get; set; }
}

/// <summary>
/// Rank data within various groupings, ordered by net time.
/// </summary>
public class RankData
{
	/// <summary>
	/// Total runners of the same gender and runner type in this race.
	/// Scoped by exact runner type (Runner, Duo, HandCycle, PushRim).
	/// </summary>
	public int? GenderTotal { get; set; }

	/// <summary>
	/// Place among runners from the same hometown (city + region), ordered by net time.
	/// Replaces the previously on-the-fly hometownPlace calculation.
	/// </summary>
	public int? HometownPlace { get; set; }

	/// <summary>
	/// Total runners from the same hometown.
	/// </summary>
	public int? HometownTotal { get; set; }

	/// <summary>
	/// Place among runners from the same region (state/country), ordered by net time.
	/// </summary>
	public int? RegionPlace { get; set; }

	/// <summary>
	/// Total runners from the same region.
	/// </summary>
	public int? RegionTotal { get; set; }
}
