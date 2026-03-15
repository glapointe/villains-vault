using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Falchion.Villains.Vault.Api.DTOs;
using Falchion.Villains.Vault.Api.Services;

namespace Falchion.Villains.Vault.Api.Controllers;

/// <summary>
/// AI Chat endpoints powered by Azure AI Foundry Agent.
/// Supports both SSE streaming (web) and non-streaming fallback (mobile).
/// Authentication is optional when <c>AiChat:RequireAuth</c> is <c>false</c>.
/// </summary>
[ApiController]
[ApiExplorerSettings(GroupName = "public")]
[Tags("Chat")]
[Route("api/v1.0/chat")]
public class ChatController : ApiControllerBase
{
	private readonly AiChatService _chatService;
	private readonly AiChatOptions _options;
	private readonly ILogger<ChatController> _logger;

	private static readonly JsonSerializerOptions JsonOptions = new()
	{
		PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
		DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
	};

	public ChatController(
		AiChatService chatService,
		IOptions<AiChatOptions> options,
		ILogger<ChatController> logger)
	{
		_chatService = chatService;
		_options = options.Value;
		_logger = logger;
	}

	/// <summary>
	/// Returns whether AI Chat is enabled and whether authentication is required.
	/// Called by the frontend on load to decide whether to show chat UI.
	/// </summary>
	[HttpGet("status")]
	public IActionResult GetStatus()
	{
		return Ok(new ChatStatusResponse
		{
			Enabled = _options.Enabled,
			RequiresAuth = _options.RequireAuth
		});
	}

	/// <summary>
	/// Streaming chat endpoint. Sends SSE events as the agent processes the request.
	/// Used by web clients that support ReadableStream / EventSource.
	/// </summary>
	[HttpPost("stream")]
	public async Task StreamChat([FromBody] ChatRequest request, CancellationToken cancellationToken)
	{
		if (!ValidateAuth(out var sessionKey, out var userName, out var errorResult))
		{
			Response.StatusCode = 401;
			Response.ContentType = "application/json";
			await Response.WriteAsync(
				JsonSerializer.Serialize(new { error = "Authentication required" }, JsonOptions),
				cancellationToken);
			return;
		}

		if (string.IsNullOrWhiteSpace(request.Message))
		{
			Response.StatusCode = 400;
			Response.ContentType = "application/json";
			await Response.WriteAsync(
				JsonSerializer.Serialize(new { error = "Message is required" }, JsonOptions),
				cancellationToken);
			return;
		}

		Response.Headers.Append("Content-Type", "text/event-stream");
		Response.Headers.Append("Cache-Control", "no-cache");
		Response.Headers.Append("Connection", "keep-alive");
		Response.Headers.Append("X-Accel-Buffering", "no");

		try
		{
			var conversationId = await _chatService.GetOrCreateConversationAsync(sessionKey!);

			await foreach (var evt in _chatService.StreamResponseAsync(
				conversationId, request.Message, userName, request.Context, cancellationToken))
			{
				var json = JsonSerializer.Serialize(evt, JsonOptions);
				await Response.WriteAsync($"data: {json}\n\n", cancellationToken);
				await Response.Body.FlushAsync(cancellationToken);
			}

			await Response.WriteAsync("data: [DONE]\n\n", cancellationToken);
			await Response.Body.FlushAsync(cancellationToken);
		}
		catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
		{
			// Client disconnected or request was cancelled by the framework
			_logger.LogDebug("Chat stream cancelled by client for session {SessionKey}", sessionKey);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error streaming chat for session {SessionKey}", sessionKey);

			var errorEvt = new ChatStreamEvent
			{
				Type = "error",
				Content = "An unexpected error occurred. Please try again."
			};
			var errorJson = JsonSerializer.Serialize(errorEvt, JsonOptions);

			try
			{
				await Response.WriteAsync($"data: {errorJson}\n\n", cancellationToken);
				await Response.WriteAsync("data: [DONE]\n\n", cancellationToken);
				await Response.Body.FlushAsync(cancellationToken);
			}
			catch
			{
				// Client may have disconnected — nothing more we can do
			}
		}
	}

	/// <summary>
	/// Non-streaming chat endpoint. Returns the full response as JSON.
	/// Used as a fallback for clients that don't support SSE (React Native mobile).
	/// </summary>
	[HttpPost]
	public async Task<IActionResult> Chat([FromBody] ChatRequest request, CancellationToken cancellationToken)
	{
		if (!ValidateAuth(out var sessionKey, out var userName, out _))
			return Unauthorized(new { error = "Authentication required" });

		if (string.IsNullOrWhiteSpace(request.Message))
			return BadRequest(new { error = "Message is required" });

		try
		{
			var conversationId = await _chatService.GetOrCreateConversationAsync(sessionKey!);

			var response = await _chatService.GetResponseAsync(
				conversationId, request.Message, userName, request.Context, cancellationToken);

			return Ok(response);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error processing chat for session {SessionKey}", sessionKey);
			return StatusCode(500, new { error = "An unexpected error occurred. Please try again." });
		}
	}

	/// <summary>
	/// Clears the current conversation for the user/session.
	/// Next message will start a fresh conversation.
	/// </summary>
	[HttpDelete("conversation")]
	public IActionResult ClearConversation()
	{
		if (!ValidateAuth(out var sessionKey, out _, out _))
			return Unauthorized(new { error = "Authentication required" });

		_chatService.ClearConversation(sessionKey!);
		return NoContent();
	}

	/// <summary>
	/// Validates auth requirements and extracts session key + user name.
	/// Returns false if auth is required but missing.
	/// </summary>
	private bool ValidateAuth(out string? sessionKey, out string? userName, out IActionResult? errorResult)
	{
		errorResult = null;
		userName = null;

		// Try to get authenticated user info
		var userId = GetSubjectId();
		var isAuthenticated = !string.IsNullOrEmpty(userId);

		if (isAuthenticated)
		{
			userName = GetCurrentUserDisplayName();
			sessionKey = userId;
			return true;
		}

		// Not authenticated — check if auth is required
		if (_options.RequireAuth)
		{
			sessionKey = null;
			errorResult = Unauthorized(new { error = "Authentication required" });
			return false;
		}

		// Anonymous: use X-Chat-Session-Id header for session tracking
		sessionKey = Request.Headers["X-Chat-Session-Id"].FirstOrDefault();
		if (string.IsNullOrWhiteSpace(sessionKey))
		{
			sessionKey = Guid.NewGuid().ToString("N");
			_logger.LogDebug("No session ID provided, generated: {SessionKey}", sessionKey);
		}

		return true;
	}
}
