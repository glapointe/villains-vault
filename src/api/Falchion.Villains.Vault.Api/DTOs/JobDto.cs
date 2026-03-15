using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Models;
using System.Text.Json;

namespace Falchion.Villains.Vault.Api.DTOs;

public class JobDto
{
	public int Id { get; set; }
    public string EventName { get; set; } = string.Empty;
	public int RaceId { get; set; }
	public string RaceName { get; set; } = string.Empty;
	public JobType JobType { get; set; }
	public JobStatus Status { get; set; }
	public JobProgressData? ProgressData { get; set; }
	public bool CancellationRequested { get; set; }
	public DateTime CreatedAt { get; set; }
	public DateTime? CompletedAt { get; set; }

	/// <summary>
	/// Maps a Job entity to a JobDto.
	/// </summary>
	public static JobDto FromEntity(Job job)
	{
		return new JobDto
		{
			Id = job.Id,
            EventName = job.Race.Event.Name,
			RaceId = job.RaceId,
			RaceName = job.Race?.Name ?? "Unknown Race",
			JobType = job.JobType,
			Status = job.Status,
			ProgressData = JsonSerializer.Deserialize<JobProgressData>(job.ProgressDataJson),
			CancellationRequested = job.CancellationRequested,
			CreatedAt = job.CreatedAt,
			CompletedAt = job.CompletedAt
		};
	}
}
