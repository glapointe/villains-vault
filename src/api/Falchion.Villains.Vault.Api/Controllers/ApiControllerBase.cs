using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace Falchion.Villains.Vault.Api.Controllers;

/// <summary>
/// Base controller for all API endpoints.
/// Provides common functionality such as cache bypass support via the X-Bypass-Cache header.
/// All controllers should inherit from this base class for consistency.
/// </summary>
public abstract class ApiControllerBase : ControllerBase
{
	private const string ClaimNamespace = "https://falchion.villains.vault";

	/// <summary>
	/// Checks if the X-Bypass-Cache header is present in the request.
	/// When present with value "true", indicates that cached values should be ignored.
	/// This allows administrators to force fresh data retrieval from the database.
	/// </summary>
	/// <returns>True if cache should be bypassed, false otherwise</returns>
	protected bool ShouldBypassCache()
	{
		return Request.Headers.ContainsKey("X-Bypass-Cache") &&
		       Request.Headers["X-Bypass-Cache"].ToString().Equals("true", StringComparison.OrdinalIgnoreCase);
	}

	/// <summary>
	/// Gets the Auth0 subject ID from the current user's JWT claims.
	/// Prioritizes the raw "sub" claim (standard in Auth0 access tokens, preserved by JsonWebTokenHandler).
	/// Falls back to ClaimTypes.NameIdentifier for compatibility with older JwtSecurityTokenHandler mapping.
	/// </summary>
	/// <returns>The subject ID, or null if not present</returns>
	protected string? GetSubjectId() =>
		User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

	/// <summary>
	/// Gets the email address from the current user's JWT claims.
	/// Prioritizes the Auth0 namespaced claim, as access tokens carry email only via the custom namespace.
	/// Falls back to standard claim types for compatibility with other token formats.
	/// </summary>
	/// <returns>The email address, or null if not present</returns>
	protected string? GetCurrentUserEmail() =>
		User.FindFirstValue($"{ClaimNamespace}/email")
		?? User.FindFirstValue(ClaimTypes.Email)
		?? User.FindFirstValue("email");

	/// <summary>
	/// Gets the display name from the current user's JWT claims.
	/// Prioritizes the Auth0 namespaced claim, as access tokens carry name only via the custom namespace.
	/// Falls back to standard claim types and nickname for compatibility with other token formats.
	/// </summary>
	/// <returns>The display name, or null if not present</returns>
	protected string? GetCurrentUserDisplayName() =>
		User.FindFirstValue($"{ClaimNamespace}/name")
		?? User.FindFirstValue(ClaimTypes.Name)
		?? User.FindFirstValue("name")
		?? User.FindFirstValue("nickname");
}
