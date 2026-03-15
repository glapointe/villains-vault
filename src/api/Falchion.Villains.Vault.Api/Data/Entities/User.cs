/**
 * User Entity Model
 * 
 * Represents a user in the system with authentication provider integration.
 * The first user to authenticate automatically becomes an admin.
 */

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Falchion.Villains.Vault.Api.Data.Entities;

/// <summary>
/// User entity representing an authenticated user in the system
/// </summary>
public class User
{
	/// <summary>
	/// Primary key - auto-incrementing integer ID
	/// </summary>
	[Key]
	[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
	public int Id { get; set; }

	/// <summary>
	/// Subject identifier from authentication provider (JWT 'sub' claim)
	/// Provider-agnostic unique identifier for this user
	/// </summary>
	[Required]
	[MaxLength(255)]
	public required string SubjectId { get; set; }

	/// <summary>
	/// User's email address (from Auth0)
	/// </summary>
	[Required]
	[MaxLength(255)]
	[EmailAddress]
	public required string Email { get; set; }

	/// <summary>
	/// User's display name (from Auth0 'name' claim)
	/// </summary>
	[MaxLength(255)]
	public string? DisplayName { get; set; }

	/// <summary>
	/// Indicates if user has admin privileges
	/// First user in system is automatically set to true
	/// </summary>
	public bool IsAdmin { get; set; }

	/// <summary>
	/// Timestamp when user was created (first login)
	/// </summary>
	public DateTime CreatedAt { get; set; }

	/// <summary>
	/// Timestamp when user record was last updated
	/// </summary>
	public DateTime UpdatedAt { get; set; }
}
