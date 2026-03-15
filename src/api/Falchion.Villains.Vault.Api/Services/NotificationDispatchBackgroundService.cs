/**
 * Notification Dispatch Background Service
 * 
 * Consumes NotificationMessages from a Channel and sends them
 * to device push tokens via the Expo Push API.
 * Handles batching (max 100 per request), error responses,
 * and automatic cleanup of invalid tokens.
 */

using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Channels;
using Falchion.Villains.Vault.Api.Repositories;

namespace Falchion.Villains.Vault.Api.Services;

/// <summary>
/// Background service that reads from the notification channel and sends
/// push notifications via the Expo Push API
/// </summary>
public class NotificationDispatchBackgroundService : BackgroundService
{
	private readonly Channel<NotificationMessage> _channel;
	private readonly IServiceProvider _serviceProvider;
	private readonly IHttpClientFactory _httpClientFactory;
	private readonly ILogger<NotificationDispatchBackgroundService> _logger;

	private const string ExpoPushApiUrl = "https://exp.host/--/api/v2/push/send";
	private const int MaxBatchSize = 100;

	public NotificationDispatchBackgroundService(
		Channel<NotificationMessage> channel,
		IServiceProvider serviceProvider,
		IHttpClientFactory httpClientFactory,
		ILogger<NotificationDispatchBackgroundService> logger)
	{
		_channel = channel;
		_serviceProvider = serviceProvider;
		_httpClientFactory = httpClientFactory;
		_logger = logger;
	}

	protected override async Task ExecuteAsync(CancellationToken stoppingToken)
	{
		_logger.LogInformation("Notification Dispatch Background Service started");

		await foreach (var message in _channel.Reader.ReadAllAsync(stoppingToken))
		{
			try
			{
				await DispatchNotificationAsync(message, stoppingToken);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error dispatching {Type} notification: {Title}",
					message.Type, message.Title);
			}
		}

		_logger.LogInformation("Notification Dispatch Background Service stopped");
	}

	private async Task DispatchNotificationAsync(NotificationMessage message, CancellationToken stoppingToken)
	{
		using var scope = _serviceProvider.CreateScope();
		var tokenRepo = scope.ServiceProvider.GetRequiredService<IPushTokenRepository>();

		// Single join query: get push tokens for users who haven't opted out of this notification type
		var pushTokens = await tokenRepo.GetTokensForOptedInUsersAsync(message.Type);
		if (pushTokens.Count == 0)
		{
			_logger.LogInformation("No opted-in push tokens for {Type} notification", message.Type);
			return;
		}

		var tokenStrings = pushTokens.Select(pt => pt.Token).ToList();
		_logger.LogInformation("Sending {Type} notification to {Count} devices: {Title}",
			message.Type, tokenStrings.Count, message.Title);

		// Batch tokens in groups of MaxBatchSize
		var invalidTokens = new List<string>();
		for (var i = 0; i < tokenStrings.Count; i += MaxBatchSize)
		{
			if (stoppingToken.IsCancellationRequested) break;

			var batch = tokenStrings.Skip(i).Take(MaxBatchSize).ToList();
			var batchInvalid = await SendBatchAsync(batch, message);
			invalidTokens.AddRange(batchInvalid);
		}

		// Clean up invalid tokens
		if (invalidTokens.Count > 0)
		{
			_logger.LogWarning("Removing {Count} invalid push tokens", invalidTokens.Count);
			await tokenRepo.RemoveTokensByValueAsync(invalidTokens);
		}
	}

	private async Task<List<string>> SendBatchAsync(List<string> tokens, NotificationMessage message)
	{
		var invalidTokens = new List<string>();

		try
		{
			var client = _httpClientFactory.CreateClient("ExpoPush");

			var payload = tokens.Select(token => new ExpoPushMessage
			{
				To = token,
				Title = message.Title,
				Body = message.Body,
				Data = message.Data,
				Sound = "default",
				ChannelId = "default",
			}).ToList();

			var response = await client.PostAsJsonAsync(ExpoPushApiUrl, payload, new JsonSerializerOptions
			{
				PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
				DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
			});

			if (!response.IsSuccessStatusCode)
			{
				var errorBody = await response.Content.ReadAsStringAsync();
				_logger.LogWarning("Expo Push API returned {StatusCode}: {Body}",
					response.StatusCode, errorBody);
				return invalidTokens;
			}

			var result = await response.Content.ReadFromJsonAsync<ExpoPushResponse>(new JsonSerializerOptions
			{
				PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
			});

			if (result?.Data != null)
			{
				for (var i = 0; i < result.Data.Count && i < tokens.Count; i++)
				{
					var ticket = result.Data[i];
					if (ticket.Status == "error")
					{
						_logger.LogWarning("Push delivery error for token {Token}: {Message} ({Detail})",
							tokens[i], ticket.Message, ticket.Details?.Error);

						// "DeviceNotRegistered" means the token is invalid and should be removed
						if (ticket.Details?.Error == "DeviceNotRegistered")
						{
							invalidTokens.Add(tokens[i]);
						}
					}
				}
			}
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error sending push notification batch of {Count} tokens", tokens.Count);
		}

		return invalidTokens;
	}

	#region Expo Push API Models

	private class ExpoPushMessage
	{
		public required string To { get; set; }
		public string? Title { get; set; }
		public string? Body { get; set; }
		public Dictionary<string, string>? Data { get; set; }
		public string? Sound { get; set; }
		public string? ChannelId { get; set; }
	}

	private class ExpoPushResponse
	{
		public List<ExpoPushTicket>? Data { get; set; }
	}

	private class ExpoPushTicket
	{
		public string? Status { get; set; }
		public string? Id { get; set; }
		public string? Message { get; set; }
		public ExpoPushTicketDetails? Details { get; set; }
	}

	private class ExpoPushTicketDetails
	{
		public string? Error { get; set; }
	}

	#endregion
}
