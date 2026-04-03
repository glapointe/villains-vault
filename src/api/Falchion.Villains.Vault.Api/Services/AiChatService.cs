#pragma warning disable OPENAI001 // Azure.AI.Projects and OpenAI Responses API types are in preview

using System.Runtime.CompilerServices;
using Azure.AI.Projects;
using Azure.AI.Extensions.OpenAI;
using Azure.Identity;
using Falchion.Villains.Vault.Api.DTOs;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using OpenAI.Responses;

namespace Falchion.Villains.Vault.Api.Services;

/// <summary>
/// Manages Azure AI Foundry Agent interactions — conversation lifecycle and streaming responses.
/// Uses the Responses API via <see cref="AIProjectClient"/> to communicate with a Foundry agent
/// that has MCP tools pre-connected. MCP tool calls are auto-approved server-side.
/// </summary>
public sealed class AiChatService
{
	private readonly AIProjectClient _projectClient;
	private readonly AiChatOptions _options;
	private readonly AgentInstructions _instructions;
	private readonly IMemoryCache _cache;
	private readonly ILogger<AiChatService> _logger;

	public AiChatService(
		IOptions<AiChatOptions> options,
		AgentInstructions instructions,
		IMemoryCache cache,
		ILogger<AiChatService> logger)
	{
		_options = options.Value;
		_instructions = instructions;
		_cache = cache;
		_logger = logger;

		var credential = string.IsNullOrEmpty(_options.TenantId)
			? new DefaultAzureCredential()
			: new DefaultAzureCredential(new DefaultAzureCredentialOptions { TenantId = _options.TenantId });

		var clientOptions = new AIProjectClientOptions
		{
			NetworkTimeout = TimeSpan.FromSeconds(_options.NetworkTimeoutSeconds)
		};

		_projectClient = new AIProjectClient(new Uri(_options.ProjectEndpoint), credential, clientOptions);
	}

	/// <summary>
	/// Gets or creates a Foundry conversation for the given session key (userId or chatSessionId).
	/// Cached with sliding expiration so conversations are reused for multi-turn chats.
	/// </summary>
	public async Task<string> GetOrCreateConversationAsync(string sessionKey)
	{
		var cacheKey = $"chat_conversation:{sessionKey}";

		if (_cache.TryGetValue(cacheKey, out string? conversationId) && !string.IsNullOrEmpty(conversationId))
		{
			_logger.LogDebug("Reusing conversation {ConversationId} for session {SessionKey}", conversationId, sessionKey);
			return conversationId;
		}

		var conversation = await _projectClient.ProjectOpenAIClient.GetProjectConversationsClient()
			.CreateProjectConversationAsync(new ProjectConversationCreationOptions());
		conversationId = conversation.Value.Id;

		var cacheOptions = new MemoryCacheEntryOptions
		{
			SlidingExpiration = TimeSpan.FromMinutes(_options.ConversationCacheExpirationMinutes)
		};
		_cache.Set(cacheKey, conversationId, cacheOptions);

		_logger.LogInformation("Created new conversation {ConversationId} for session {SessionKey}", conversationId, sessionKey);
		return conversationId;
	}

	/// <summary>
	/// Clears the cached conversation for the given session key, forcing a new conversation next time.
	/// </summary>
	public void ClearConversation(string sessionKey)
	{
		var cacheKey = $"chat_conversation:{sessionKey}";
		_cache.Remove(cacheKey);
		_logger.LogInformation("Cleared conversation for session {SessionKey}", sessionKey);
	}

	/// <summary>
	/// Streams the agent's response as an async enumerable of <see cref="ChatStreamEvent"/>.
	/// MCP tool calls are auto-approved server-side. The stream loops until the agent
	/// completes without pending tool approvals.
	/// </summary>
	public async IAsyncEnumerable<ChatStreamEvent> StreamResponseAsync(
		string conversationId,
		string message,
		string? userName = null,
		ChatContext? context = null,
		[EnumeratorCancellation] CancellationToken cancellationToken = default)
	{
		// The agent's base instructions (agent-instructions.md) must be configured in the
		// Foundry portal agent definition — per-request Instructions are rejected when an
		// AgentReference is specified. We prepend per-request context (user name, page) to
		// the user message so the agent can personalize responses.
		var contextPrefix = _instructions.BuildContextPrefix(userName, context);
		var enrichedMessage = string.IsNullOrEmpty(contextPrefix)
			? message
			: $"{contextPrefix}\n\n{message}";

		// Track tool calls by approval ID for correlation
		var toolCallNames = new Dictionary<string, string>();

		// Build the initial request (no Instructions — agent has its own in Foundry)
		var options = new CreateResponseOptions { StreamingEnabled = true };
		options.InputItems.Add(ResponseItem.CreateUserMessageItem(enrichedMessage));

		var pendingApprovals = new List<(string Id, string? Name)>();

		do
		{
			pendingApprovals.Clear();

			var responsesClient = _projectClient.ProjectOpenAIClient
				.GetProjectResponsesClientForAgent(
					new AgentReference(_options.AgentId, _options.AgentVersion),
					conversationId);

			// Manual enumerator iteration with try/catch to work around a deserialization
			// bug in OpenAI SDK 2.8.0: McpToolFilter.DeserializeMcpToolFilter expects an
			// Object but the Foundry API returns an Array for allowed_tools.
			// The failing event is response.created (informational) — the content events
			// (text deltas, tool approvals, completion) deserialize correctly.
			var enumerator = responsesClient
				.CreateResponseStreamingAsync(options, cancellationToken)
				.GetAsyncEnumerator(cancellationToken);

			try
			{
				while (true)
				{
					StreamingResponseUpdate update;
					try
					{
						if (!await enumerator.MoveNextAsync())
							break;
						update = enumerator.Current;
					}
					catch (InvalidOperationException ex) when (ex.Message.Contains("element of type"))
					{
						// SDK deserialization bug — skip this event and continue with the next
						_logger.LogDebug("Skipping SSE event with McpToolFilter deserialization error: {Message}", ex.Message);
						continue;
					}

					ChatStreamEvent? evt = null;

					switch (update)
					{
						// Incremental text from the agent's response
						case StreamingResponseOutputTextDeltaUpdate textDelta:
							evt = new ChatStreamEvent
							{
								Type = "message_delta",
								Content = textDelta.Delta
							};
							break;

						// An output item completed — check for MCP approval requests
						case StreamingResponseOutputItemDoneUpdate outputItemDone:
							switch (outputItemDone.Item)
							{
								// MCP tool needs approval before execution
								case McpToolCallApprovalRequestItem mcpApproval:
								{
									var toolName = mcpApproval.ToolName ?? "mcp_tool";
									pendingApprovals.Add((mcpApproval.Id, toolName));

									_logger.LogDebug(
										"MCP approval requested for tool {ToolName} ({ApprovalId})",
										toolName, mcpApproval.Id);

									toolCallNames[mcpApproval.Id] = toolName;
									evt = new ChatStreamEvent
									{
										Type = "thinking",
										ToolName = toolName,
										ToolCallId = mcpApproval.Id
									};
									break;
								}

								default:
									_logger.LogDebug(
										"Output item done: {ItemType}",
										outputItemDone.Item?.GetType().Name ?? "null");
									break;
							}
							break;

						// Response completed — capture ID for potential follow-up
						case StreamingResponseCompletedUpdate completed:
							if (pendingApprovals.Count == 0)
							{
								evt = new ChatStreamEvent { Type = "message_complete" };
							}
							break;

						// Error from the agent
						case StreamingResponseErrorUpdate errorUpdate:
							_logger.LogError("Agent response error: {Error}", errorUpdate.Message);
							evt = new ChatStreamEvent
							{
								Type = "error",
								Content = errorUpdate.Message ?? "The agent encountered an error."
							};
							break;
					}

					if (evt is not null)
					{
						yield return evt;
					}
				}
			}
			finally
			{
				await enumerator.DisposeAsync();
			}

			// Auto-approve pending MCP tool calls and continue the stream.
			// Do NOT set PreviousResponseId — we're using conversations, which already
			// track response state. The API rejects requests with both fields set.
			if (pendingApprovals.Count > 0)
			{
				_logger.LogInformation(
					"Auto-approving {Count} MCP tool call(s), continuing conversation {ConversationId}",
					pendingApprovals.Count, conversationId);

				options = new CreateResponseOptions { StreamingEnabled = true };
				foreach (var (approvalId, _) in pendingApprovals)
				{
					options.InputItems.Add(
						ResponseItem.CreateMcpApprovalResponseItem(approvalId, approved: true));
				}
			}
		} while (pendingApprovals.Count > 0);
	}

	/// <summary>
	/// Non-streaming version: collects all events and returns a complete <see cref="ChatResponse"/>.
	/// Used as a fallback for clients that don't support SSE (e.g., React Native mobile).
	/// </summary>
	public async Task<ChatResponse> GetResponseAsync(
		string conversationId,
		string message,
		string? userName = null,
		ChatContext? context = null,
		CancellationToken cancellationToken = default)
	{
		var steps = new List<ChatStep>();
		var textParts = new List<string>();

		await foreach (var evt in StreamResponseAsync(conversationId, message, userName, context, cancellationToken))
		{
			switch (evt.Type)
			{
				case "thinking":
					steps.Add(new ChatStep
					{
						Type = "thinking",
						ToolName = evt.ToolName,
						Arguments = evt.Arguments
					});
					break;

				case "tool_result":
					steps.Add(new ChatStep
					{
						Type = "tool_result",
						ToolName = evt.ToolName,
						Result = evt.Result
					});
					break;

				case "message_delta":
					if (evt.Content is not null)
						textParts.Add(evt.Content);
					break;

				case "error":
					steps.Add(new ChatStep
					{
						Type = "error",
						Result = evt.Content
					});
					break;
			}
		}

		return new ChatResponse
		{
			Steps = steps,
			Message = string.Concat(textParts)
		};
	}
}
