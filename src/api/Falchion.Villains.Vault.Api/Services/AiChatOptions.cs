namespace Falchion.Villains.Vault.Api.Services;

/// <summary>
/// Configuration options for the AI Chat feature.
/// Bound from the "AiChat" section of appsettings.json / environment variables.
/// </summary>
public sealed class AiChatOptions
{
	public const string SectionName = "AiChat";

	/// <summary>
	/// Kill switch for the entire AI Chat feature. When false, all chat endpoints return 404.
	/// </summary>
	public bool Enabled { get; set; }

	/// <summary>
	/// Whether authentication is required to use chat.
	/// When false, anonymous users can chat (with lower rate limits).
	/// When true, unauthenticated requests receive 401.
	/// </summary>
	public bool RequireAuth { get; set; }

	/// <summary>
	/// Azure AI Foundry project endpoint URL.
	/// </summary>
	public string ProjectEndpoint { get; set; } = string.Empty;

	/// <summary>
	/// Azure tenant ID for the resource. Required when DefaultAzureCredential
	/// picks up a token from the wrong tenant (e.g. personal vs org account).
	/// Leave empty to use the default tenant.
	/// </summary>
	public string? TenantId { get; set; }

	/// <summary>
	/// The pre-created Foundry agent name (connected to MCP tools).
	/// This is the human-readable agent name configured in the Foundry portal
	/// (e.g. "villains-vault"), without a version suffix.
	/// </summary>
	public string AgentId { get; set; } = string.Empty;

	/// <summary>
	/// The agent version number (e.g. "1"). Combined with <see cref="AgentId"/>
	/// to form the full agent reference "name:version" for the Responses API.
	/// </summary>
	public string AgentVersion { get; set; } = "1";

	/// <summary>
	/// Rate limit for authenticated users (requests per minute).
	/// </summary>
	public int RateLimitAuthPerMinute { get; set; } = 10;

	/// <summary>
	/// Rate limit for anonymous users (requests per minute).
	/// </summary>
	public int RateLimitAnonPerMinute { get; set; } = 5;

	/// <summary>
	/// Conversation cache sliding expiration in minutes.
	/// </summary>
	public int ConversationCacheExpirationMinutes { get; set; } = 30;

	/// <summary>
	/// Network timeout in seconds for the Azure AI client.
	/// MCP tool calls can take a while (especially with slow DBs), so set this high.
	/// Default: 300 (5 minutes).
	/// </summary>
	public int NetworkTimeoutSeconds { get; set; } = 300;
}
