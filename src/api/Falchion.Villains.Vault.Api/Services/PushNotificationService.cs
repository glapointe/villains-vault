/**
 * Push Notification Service
 * 
 * Sends push notifications to users via the Expo Push API.
 * Handles batching, error responses, and invalid token cleanup.
 * Does NOT call Expo directly — enqueues messages for the background dispatcher.
 */

using System.Threading.Channels;
using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Repositories;

namespace Falchion.Villains.Vault.Api.Services;

/// <summary>
/// Represents a notification message to be dispatched
/// </summary>
public class NotificationMessage
{
	/// <summary>
	/// The notification type (used to filter by user preference)
	/// </summary>
	public required NotificationType Type { get; set; }

	/// <summary>
	/// Notification title
	/// </summary>
	public required string Title { get; set; }

	/// <summary>
	/// Notification body text
	/// </summary>
	public required string Body { get; set; }

	/// <summary>
	/// Optional data payload for deep linking
	/// </summary>
	public Dictionary<string, string>? Data { get; set; }
}

/// <summary>
/// Service for queueing push notifications. Notifications are dispatched
/// asynchronously by NotificationDispatchBackgroundService.
/// </summary>
public class PushNotificationService
{
	private readonly Channel<NotificationMessage> _channel;
	private readonly ILogger<PushNotificationService> _logger;

	public PushNotificationService(
		Channel<NotificationMessage> channel,
		ILogger<PushNotificationService> logger)
	{
		_channel = channel;
		_logger = logger;
	}

	/// <summary>
	/// Queue a notification for dispatch to all opted-in users
	/// </summary>
	public async Task QueueNotificationAsync(NotificationMessage message)
	{
		_logger.LogInformation("Queueing {Type} notification: {Title}", message.Type, message.Title);
		await _channel.Writer.WriteAsync(message);
	}

	/// <summary>
	/// Queue a race results notification
	/// </summary>
	public async Task NotifyRaceResultsAvailableAsync(string raceName, int raceId)
	{
		await QueueNotificationAsync(new NotificationMessage
		{
			Type = NotificationType.RaceResults,
			Title = "New Race Results",
			Body = $"Results are now available for {raceName}!",
			Data = new Dictionary<string, string>
			{
				["type"] = "raceResults",
				["raceId"] = raceId.ToString(),
				["route"] = $"/race/{raceId}"
			},
		});
	}

	/// <summary>
	/// Queue a DLS declaration event notification
	/// </summary>
	public async Task NotifyDlsRaceCreatedAsync(string eventName)
	{
		await QueueNotificationAsync(new NotificationMessage
		{
			Type = NotificationType.DlsDeclarations,
			Title = "New DLS Declaration Event",
			Body = $"A new Dead Last Started declaration event is open: {eventName}",
			Data = new Dictionary<string, string>
			{
				["type"] = "dlsDeclarations",
				["route"] = "/(tabs)",
			},
		});
	}

	/// <summary>
	/// Queue a community event notification
	/// </summary>
	public async Task NotifyCommunityEventCreatedAsync(string eventTitle, int eventId)
	{
		await QueueNotificationAsync(new NotificationMessage
		{
			Type = NotificationType.CommunityEvents,
			Title = "New Community Event",
			Body = $"Check out the new community event: {eventTitle}",
			Data = new Dictionary<string, string>
			{
				["type"] = "communityEvents",
				["eventId"] = eventId.ToString(),
				["route"] = "/(tabs)/community",
            },
		});
	}
}
