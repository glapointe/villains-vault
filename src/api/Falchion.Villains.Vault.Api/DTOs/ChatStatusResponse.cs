namespace Falchion.Villains.Vault.Api.DTOs;

/// <summary>
/// Response from the /chat/status endpoint.
/// Used by the frontend to determine if chat is available and if auth is required.
/// </summary>
public sealed class ChatStatusResponse
{
	/// <summary>Whether the AI chat feature is enabled on this server.</summary>
	public required bool Enabled { get; init; }

	/// <summary>Whether authentication is required to use chat.</summary>
	public required bool RequiresAuth { get; init; }
}
