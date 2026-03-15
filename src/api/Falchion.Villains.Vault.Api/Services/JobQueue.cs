using System.Threading.Channels;

namespace Falchion.Villains.Vault.Api.Services;

/// <summary>
/// Thread-safe in-memory queue for job processing.
/// Uses Channel<T> to provide efficient producer-consumer pattern.
/// </summary>
public class JobQueue
{
	private readonly Channel<int> _queue;

	public JobQueue()
	{
		// Create unbounded channel for job IDs
		_queue = Channel.CreateUnbounded<int>(new UnboundedChannelOptions
		{
			SingleReader = true, // Only one background service will read
			SingleWriter = false // Multiple requests can enqueue jobs
		});
	}

	/// <summary>
	/// Enqueues a job ID for processing.
	/// </summary>
	public async Task EnqueueAsync(int jobId)
	{
		await _queue.Writer.WriteAsync(jobId);
	}

	/// <summary>
	/// Dequeues the next job ID to process.
	/// Blocks until a job is available or cancellation is requested.
	/// </summary>
	public async Task<int> DequeueAsync(CancellationToken cancellationToken)
	{
		return await _queue.Reader.ReadAsync(cancellationToken);
	}
}
