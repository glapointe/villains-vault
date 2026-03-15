/**
 * User Profile Data Transfer Object
 */

namespace Falchion.Villains.Vault.Api.DTOs;

/// <summary>
/// Data Transfer Object for user profile responses
/// </summary>
public class UserProfileDto
{
	/// <summary>
	/// User ID (string representation)
	/// </summary>
	public required string Id { get; set; }

	/// <summary>
	/// User's email address
	/// </summary>
	public required string Email { get; set; }

	/// <summary>
	/// User's display name
	/// </summary>
	public string? DisplayName { get; set; }

	/// <summary>
	/// 
	/// </summary>
	public string? SubjectId { get; set; }

    /// <summary>
    /// Whether user has admin privileges
    /// </summary>
    public bool IsAdmin { get; set; }

	/// <summary>
	/// When user was created
	/// </summary>
	public DateTime CreatedAt { get; set; }
}
