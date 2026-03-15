using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Repositories;

namespace Falchion.Villains.Vault.Api.Services;

/// <summary>
/// Background service that processes jobs from the job queue.
/// Runs continuously, pulling jobs from the queue and dispatching to the appropriate handler based on job type.
/// </summary>
public class JobProcessorBackgroundService : BackgroundService
{
	private readonly IServiceProvider _serviceProvider;
	private readonly JobQueue _jobQueue;
	private readonly ILogger<JobProcessorBackgroundService> _logger;

	public JobProcessorBackgroundService(
		IServiceProvider serviceProvider,
		JobQueue jobQueue,
		ILogger<JobProcessorBackgroundService> logger)
	{
		_serviceProvider = serviceProvider;
		_jobQueue = jobQueue;
		_logger = logger;
	}

	protected override async Task ExecuteAsync(CancellationToken stoppingToken)
	{
		_logger.LogInformation("Job Processor Background Service started");

		while (!stoppingToken.IsCancellationRequested)
		{
			try
			{
				// Wait for next job from queue
				var jobId = await _jobQueue.DequeueAsync(stoppingToken);
				_logger.LogInformation("Processing job {JobId}", jobId);

				// Create a new scope for scoped services
				using var scope = _serviceProvider.CreateScope();
				var jobRepository = scope.ServiceProvider.GetRequiredService<IJobRepository>();
				var raceRepository = scope.ServiceProvider.GetRequiredService<IRaceRepository>();

				// Get job and race details
				var job = await jobRepository.GetByIdAsync(jobId);
				if (job == null)
				{
					_logger.LogWarning("Job {JobId} not found", jobId);
					continue;
				}

				var race = await raceRepository.GetByIdAsync(job.RaceId);
				if (race == null)
				{
					_logger.LogWarning("Race {RaceId} not found for job {JobId}", job.RaceId, jobId);
					continue;
				}

				// Dispatch to appropriate handler based on job type
				switch (job.JobType)
				{
					case JobType.Scrape:
						var scraperService = scope.ServiceProvider.GetRequiredService<TrackShackScraperService>();
						await scraperService.ParseRaceAsync(jobId, race);
						break;

					case JobType.RecalculateStats:
						await ProcessRecalculateStatsJobAsync(scope.ServiceProvider, job, race);
						break;

					default:
						_logger.LogWarning("Unknown job type {JobType} for job {JobId}", job.JobType, jobId);
						break;
				}

				_logger.LogInformation("Completed processing job {JobId} (type: {JobType})", jobId, job.JobType);
			}
			catch (OperationCanceledException)
			{
				// Expected when stopping
				break;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error processing job");
			}
		}

		_logger.LogInformation("Job Processor Background Service stopped");
	}

	/// <summary>
	/// Processes a RecalculateStats job: recalculates pass counts (kills/assassins)
	/// and regenerates race statistics.
	/// </summary>
	private async Task ProcessRecalculateStatsJobAsync(IServiceProvider services, Data.Entities.Job job, Data.Entities.Race race)
	{
		var jobRepository = services.GetRequiredService<IJobRepository>();
		var raceRepository = services.GetRequiredService<IRaceRepository>();
		var resultEnrichmentService = services.GetRequiredService<ResultEnrichmentService>();

		try
		{
			// Mark job as in progress
			job.Status = JobStatus.InProgress;
			await jobRepository.UpdateAsync(job);

			// Recalculate pass counts
			_logger.LogInformation("Enriching results for race {RaceId}", job.RaceId);
			var resultsEnriched = await resultEnrichmentService.EnrichRaceResultsAsync(job.RaceId);
			_logger.LogInformation("Enriched {Count} results for race {RaceId}", resultsEnriched, job.RaceId);

			// Regenerate race statistics
			_logger.LogInformation("Regenerating statistics for race {RaceId}", job.RaceId);
			var stats = await raceRepository.BuildRaceStats(job.RaceId);
			race.StatisticsJson = stats.ToJson();
			await raceRepository.UpdateAsync(race);

			// Mark job as completed
			job.Status = JobStatus.Completed;
			job.CompletedAt = DateTime.UtcNow;
			await jobRepository.UpdateAsync(job);

			_logger.LogInformation("RecalculateStats job {JobId} completed for race {RaceId}", job.Id, job.RaceId);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error processing RecalculateStats job {JobId} for race {RaceId}", job.Id, job.RaceId);

			job.Status = JobStatus.Failed;
			job.CompletedAt = DateTime.UtcNow;
			await jobRepository.UpdateAsync(job);
		}
	}
}
