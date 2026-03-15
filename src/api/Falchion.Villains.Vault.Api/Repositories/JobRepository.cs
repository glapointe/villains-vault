using Microsoft.EntityFrameworkCore;
using Falchion.Villains.Vault.Api.Data;
using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Models;
using System.Text.Json;

namespace Falchion.Villains.Vault.Api.Repositories;

/// <summary>
/// Repository implementation for Job entity operations.
/// </summary>
public class JobRepository : IJobRepository
{
	private readonly ApplicationDbContext _context;

	public JobRepository(ApplicationDbContext context)
	{
		_context = context;
	}

    /// <inheritdoc/>
    public async Task ForceUpdateAsync(Job job)
    {
        _context.ChangeTracker.Clear();
        _context.Jobs.Update(job);
        await _context.SaveChangesAsync();
    }

    /// <inheritdoc/>
    public async Task<Job?> GetByIdAsync(int id)
	{
		return await _context.Jobs
			.Include(j => j.Race)
			.ThenInclude(r => r.Event)
            .FirstOrDefaultAsync(j => j.Id == id);
	}

    /// <inheritdoc/>
    public async Task<List<Job>> GetByIdsAsync(List<int> ids)
	{
		return await _context.Jobs
			.Include(j => j.Race)            
            .ThenInclude(r => r.Event)
			.Where(j => ids.Contains(j.Id))
			.ToListAsync();
	}

    /// <inheritdoc/>
    public async Task<List<Job>> GetByRaceIdAsync(int raceId)
	{
		return await _context.Jobs
			.Include(j => j.Race)
            .ThenInclude(r => r.Event)
			.Where(j => j.RaceId == raceId)
			.OrderByDescending(j => j.CreatedAt)
			.ToListAsync();
	}

    /// <inheritdoc/>
    public async Task<List<Job>> GetRecentJobsAsync(int page, int pageSize)
	{
		return await _context.Jobs
			.Include(j => j.Race)
            .ThenInclude(r => r.Event)
			.OrderByDescending(j => j.CreatedAt)
			.Skip((page - 1) * pageSize)
			.Take(pageSize)
			.ToListAsync();
	}

    /// <inheritdoc/>
    public async Task<Job> CreateAndEnqueueAsync(Job newJob, Func<int, Task> enqueueAction)
	{
		// Use a transaction to ensure atomicity
		using var transaction = await _context.Database.BeginTransactionAsync();
		try
		{
			newJob.CreatedAt = DateTime.UtcNow;
			_context.Jobs.Add(newJob);
			await _context.SaveChangesAsync();

			// Enqueue the job
			await enqueueAction(newJob.Id);

			await transaction.CommitAsync();
			return newJob;
		}
		catch
		{
			await transaction.RollbackAsync();
			throw;
		}
	}

    /// <inheritdoc/>
    public async Task UpdateAsync(Job job)
	{
		await _context.SaveChangesAsync();
	}

    /// <inheritdoc/>
    public async Task SetCancellationRequestedAsync(int jobId)
	{
		var job = await _context.Jobs.FindAsync(jobId);
		if (job != null)
		{
			job.CancellationRequested = true;
			await _context.SaveChangesAsync();
		}
	}

    /// <inheritdoc/>
    public async Task<Job> CreateJobForRaceAsync(int raceId, int userId, JobType jobType = JobType.Scrape)
	{
		var job = new Job
		{
			RaceId = raceId,
			JobType = jobType,
			Status = JobStatus.Queued,
			ProgressDataJson = JsonSerializer.Serialize(new JobProgressData()),
			SubmittedByUserId = userId,
			CancellationRequested = false,
			CreatedAt = DateTime.UtcNow
		};

		_context.Jobs.Add(job);
		await _context.SaveChangesAsync();

		return job;
	}
}
