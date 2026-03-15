/**
 * User Repository Interface
 * 
 * Defines the contract for user data access operations.
 * Separates data access logic from business logic.
 */

using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.Repositories;

/// <summary>
/// Repository interface for User entity data access
/// </summary>
public interface IUserRepository
{
	/// <summary>
	/// Get user by subject identifier from authentication provider
	/// </summary>
	/// <param name="subjectId">Subject identifier from auth provider (JWT 'sub' claim)</param>
	/// <returns>User entity or null if not found</returns>
	Task<User?> GetBySubjectIdAsync(string subjectId);

	/// <summary>
	/// Get user by ID
	/// </summary>
	/// <param name="id">User ID</param>
	/// <returns>User entity or null if not found</returns>
	Task<User?> GetByIdAsync(int id);

	/// <summary>
	/// Get all users
	/// </summary>
	/// <returns>List of all users ordered by creation date</returns>
	Task<List<User>> GetAllAsync();

	/// <summary>
	/// Get paged users with optional search and sorting
	/// </summary>
	/// <param name="page">Page number (1-based)</param>
	/// <param name="pageSize">Number of items per page</param>
	/// <param name="search">Optional search term for email or display name</param>
	/// <param name="sortBy">Optional sort field (email, displayName, createdAt, isAdmin)</param>
	/// <param name="sortDirection">Sort direction (asc or desc)</param>
	/// <returns>Tuple of paged items and total count</returns>
	Task<(List<User> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, string? search = null, string? sortBy = null, string? sortDirection = null);

	/// <summary>
	/// Get total count of users in database
	/// </summary>
	/// <returns>Number of users</returns>
	Task<int> GetCountAsync();

	/// <summary>
	/// Add a new user to the database
	/// </summary>
	/// <param name="user">User entity to add</param>
	/// <returns>Created user with generated ID</returns>
	Task<User> AddAsync(User user);

	/// <summary>
	/// Update an existing user
	/// </summary>
	/// <param name="user">User entity to update</param>
	/// <returns>Updated user</returns>
	Task<User> UpdateAsync(User user);

	/// <summary>
	/// Delete a user
	/// </summary>
	/// <param name="user">User entity to delete</param>
	Task DeleteAsync(User user);
    
	/// <summary>
	/// Asynchronously retrieves the unique identifier of a user based on the specified display name.
	/// </summary>
	/// <param name="name">The display name of the user whose identifier is to be retrieved. Cannot be null or empty.</param>
	/// <returns>A task that represents the asynchronous operation. The task result contains the user if
	/// found; otherwise, null. If more than one user is matched then returns null.</returns>
	Task<User?> GetUserByDisplayNameAsync(string name);
}
