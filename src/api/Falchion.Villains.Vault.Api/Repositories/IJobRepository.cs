using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.Repositories;

/// <summary>
/// Repository interface for Job entity operations.
/// </summary>
public interface IJobRepository
{
    /// <summary>
    /// Updates a job's status and progress data, clearing any pending context changes first.
    /// Use this in exception handlers where prior operations may have left the context in a dirty state.
    /// </summary>
    Task ForceUpdateAsync(Job job);

    /// <summary>
    /// Gets a job by its ID.
    /// </summary>
    Task<Job?> GetByIdAsync(int id);

	/// <summary>
	/// Gets multiple jobs by their IDs.
	/// </summary>
	Task<List<Job>> GetByIdsAsync(List<int> ids);

	/// <summary>
	/// Gets all jobs for a specific race, ordered by creation date descending.
	/// </summary>
	Task<List<Job>> GetByRaceIdAsync(int raceId);

	/// <summary>
	/// Gets recent jobs with pagination, ordered by creation date descending.
	/// </summary>
	/// <param name="page">Page number (1-based)</param>
	/// <param name="pageSize">Number of jobs per page</param>
	Task<List<Job>> GetRecentJobsAsync(int page, int pageSize);

	/// <summary>
	/// Creates a new job and enqueues it atomically within a transaction.
	/// </summary>
	/// <param name="newJob">The job to create</param>
	/// <param name="enqueueAction">Action to enqueue the job ID (called within transaction)</param>
	Task<Job> CreateAndEnqueueAsync(Job newJob, Func<int, Task> enqueueAction);

	/// <summary>
	/// Updates a job's status and progress data.
	/// </summary>
	Task UpdateAsync(Job job);

	/// <summary>
	/// Sets the cancellation requested flag on a job.
	/// </summary>
	Task SetCancellationRequestedAsync(int jobId);

	/// <summary>
	/// Creates a new job for a race with default initial state.
	/// Encapsulates the job creation logic with proper initialization.
	/// </summary>
	/// <param name="raceId">The race ID to create the job for</param>
	/// <param name="userId">The user ID submitting the job</param>
	/// <param name="jobType">The type of job to create (defaults to Scrape)</param>
	/// <returns>The created job</returns>
	Task<Job> CreateJobForRaceAsync(int raceId, int userId, JobType jobType = JobType.Scrape);
}
