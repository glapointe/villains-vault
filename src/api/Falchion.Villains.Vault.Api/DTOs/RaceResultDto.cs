using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Models;

namespace Falchion.Villains.Vault.Api.DTOs;

/// <summary>
/// DTO for a race result returned to the frontend.
/// </summary>
public class RaceResultDto
{
	/// <summary>
	/// Result ID.
	/// </summary>
	public long Id { get; set; }

	/// <summary>
	/// Race ID this result belongs to.
	/// </summary>
	public int RaceId { get; set; }

	/// <summary>
	/// Division ID this result belongs to.
	/// </summary>
	public int DivisionId { get; set; }

	/// <summary>
	/// Runner's bib number.
	/// </summary>
	public int BibNumber { get; set; } = 0;

	/// <summary>
	/// Runner's name.
	/// </summary>
	public string Name { get; set; } = string.Empty;

	/// <summary>
	/// Runner's age at time of race.
	/// </summary>
	public int Age { get; set; }

	/// <summary>
	/// Runner's gender (Male, Female, Unknown).
	/// </summary>
	public Gender Gender { get; set; }

	/// <summary>
	/// Type of runner (Runner, PushRim, HandCycle, Duo).
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
	/// Runner's net time (chip time).
	/// </summary>
	public TimeSpan? NetTime { get; set; }

	/// <summary>
	/// Runner's clock time (gun time).
	/// </summary>
	public TimeSpan? ClockTime { get; set; }

	/// <summary>
	/// Calculate the start time by subtracting the NetTime from the ClockTime.
	/// </summary>
	public TimeSpan? StartTime { get; set; }

	/// <summary>
	/// Average pace per mile.
	/// </summary>
	public TimeSpan? OverallPace { get; set; }

	/// <summary>
	/// Runner's hometown.
	/// </summary>
	public string? Hometown { get; set; }

	/// <summary>Split time 1</summary>
	public TimeSpan? Split1 { get; set; }

	/// <summary>Split time 2</summary>
	public TimeSpan? Split2 { get; set; }

	/// <summary>Split time 3</summary>
	public TimeSpan? Split3 { get; set; }

	/// <summary>Split time 4</summary>
	public TimeSpan? Split4 { get; set; }

	/// <summary>Split time 5</summary>
	public TimeSpan? Split5 { get; set; }

	/// <summary>Split time 6</summary>
	public TimeSpan? Split6 { get; set; }

	/// <summary>Split time 7</summary>
	public TimeSpan? Split7 { get; set; }

	/// <summary>Split time 8</summary>
	public TimeSpan? Split8 { get; set; }

	/// <summary>Split time 9</summary>
	public TimeSpan? Split9 { get; set; }

	/// <summary>Split time 10</summary>
	public TimeSpan? Split10 { get; set; }

	/// <summary>
	/// Number of runners this runner passed during the race (kills).
	/// </summary>
	public int? Passes { get; set; }

	/// <summary>
	/// Number of runners who passed this runner (assassins).
	/// </summary>
	public int? Passers { get; set; }

	/// <summary>
	/// Deserialized breakdown data (pass/passer breakdowns and rankings by dimension).
	/// Null if not yet computed.
	/// </summary>
	public ResultBreakdownData? ResultData { get; set; }

	/// <summary>
	/// When this result was last modified.
	/// </summary>
	public DateTime ModifiedAt { get; set; }

	/// <summary>
	/// Converts a RaceResult entity to a DTO.
	/// </summary>
	public static T FromEntity<T>(RaceResult result) where T : RaceResultDto, new()
    {
		return new T
		{
			Id = result.Id,
			RaceId = result.RaceId,
			DivisionId = result.DivisionId,
			BibNumber = result.BibNumber,
			Name = result.Name,
			Age = result.Age,
			Gender = result.Gender,
			RunnerType = result.RunnerType,
			DivisionPlace = result.DivisionPlace,
			OverallPlace = result.OverallPlace,
			GenderPlace = result.GenderPlace,
			NetTime = result.NetTime,
			ClockTime = result.ClockTime,
			OverallPace = result.OverallPace,
			StartTime = result.StartTime,
			Hometown = result.Hometown,
			Split1 = result.Split1,
			Split2 = result.Split2,
			Split3 = result.Split3,
			Split4 = result.Split4,
			Split5 = result.Split5,
			Split6 = result.Split6,
			Split7 = result.Split7,
			Split8 = result.Split8,
			Split9 = result.Split9,
			Split10 = result.Split10,
			Passes = result.Passes,
			Passers = result.Passers,
			ResultData = ResultBreakdownData.FromJson(result.ResultDataJson),
			ModifiedAt = result.ModifiedAt
		};
	}
}
