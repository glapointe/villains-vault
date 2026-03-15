/**
 * Update User Request Data Transfer Objects
 */

namespace Falchion.Villains.Vault.Api.DTOs;

/// <summary>
/// Request DTO for admin updating a user
/// </summary>
public class UpdateUserRequest
{
	/// <summary>
	/// Updated email address
	/// </summary>
	public string? Email { get; set; }

	/// <summary>
	/// Updated display name
	/// </summary>
	public string? DisplayName { get; set; }

	/// <summary>
	/// Updated admin status
	/// </summary>
	public bool? IsAdmin { get; set; }
}

/// <summary>
/// Request DTO for a user updating their own profile
/// Email cannot be changed by the user themselves (admin only)
/// </summary>
public class UpdateOwnProfileRequest
{
	/// <summary>
	/// Updated display name
	/// </summary>
	public string? DisplayName { get; set; }
}
