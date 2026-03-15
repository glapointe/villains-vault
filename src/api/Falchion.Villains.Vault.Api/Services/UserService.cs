/**
 * User Service
 * 
 * Business logic for user management including user creation and admin assignment.
 * Handles the "first user becomes admin" logic automatically.
 * Uses repository pattern for data access to separate concerns.
 * Provider-agnostic - works with any authentication provider that provides a unique identifier.
 */

using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Repositories;

namespace Falchion.Villains.Vault.Api.Services;

/// <summary>
/// Service for managing user operations
/// </summary>
public class UserService
{
	private readonly IUserRepository _userRepository;
	private readonly ILogger<UserService> _logger;

	/// <summary>
	/// Constructor with dependency injection
	/// </summary>
	/// <param name="userRepository">User repository for data access</param>
	/// <param name="logger">Logger instance</param>
	public UserService(IUserRepository userRepository, ILogger<UserService> logger)
	{
		_userRepository = userRepository;
		_logger = logger;
	}

	/// <summary>
	/// Get or create a user based on authentication provider claims
	/// If user doesn't exist, creates them. First user becomes admin automatically.
	/// </summary>
	/// <param name="subjectId">Subject identifier from authentication provider (JWT 'sub' claim)</param>
	/// <param name="email">User's email address</param>
	/// <param name="displayName">User's display name (optional)</param>
	/// <returns>User entity</returns>
	public async Task<User> GetOrCreateUserAsync(string subjectId, string email, string? displayName = null)
	{
		// Try to find existing user by subject identifier
		var user = await _userRepository.GetBySubjectIdAsync(subjectId);

		if (user != null)
		{
			_logger.LogInformation("Existing user found: {SubjectId}", subjectId);
			
			// Update email or display name if changed
			bool updated = false;
			if (user.Email != email)
			{
				user.Email = email;
				updated = true;
			}
			// We allow the user to alter their display name so don't replace with what Auth0 provides.

			if (updated)
			{
				await _userRepository.UpdateAsync(user);
				_logger.LogInformation("User profile updated: {SubjectId}", subjectId);
			}

			return user;
		}

		// Check if this is the first user in the system
		var userCount = await _userRepository.GetCountAsync();
		var isFirstUser = userCount == 0;

		// Create new user
		user = new User
		{
			SubjectId = subjectId,
			Email = email,
			DisplayName = displayName,
			IsAdmin = isFirstUser, // First user is automatically admin
			CreatedAt = DateTime.UtcNow,
			UpdatedAt = DateTime.UtcNow
		};

		await _userRepository.AddAsync(user);

		if (isFirstUser)
		{
			_logger.LogInformation("First user created with admin privileges: {SubjectId} ({Email})", 
				subjectId, email);
		}
		else
		{
			_logger.LogInformation("New user created: {SubjectId} ({Email})", subjectId, email);
		}

		return user;
	}

	/// <summary>
	/// Get user by subject identifier from authentication provider
	/// </summary>
	/// <param name="subjectId">Subject identifier from auth provider (JWT 'sub' claim)</param>
	/// <returns>User entity or null if not found</returns>
	public async Task<User?> GetUserBySubjectIdAsync(string subjectId)
	{
		return await _userRepository.GetBySubjectIdAsync(subjectId);
	}

	/// <summary>
	/// Get user by ID
	/// </summary>
	/// <param name="userId">User ID</param>
	/// <returns>User entity or null if not found</returns>
	public async Task<User?> GetUserByIdAsync(int userId)
	{
		return await _userRepository.GetByIdAsync(userId);
	}

	/// <summary>
	/// Update user's admin status
	/// </summary>
	/// <param name="userId">User ID</param>
	/// <param name="isAdmin">New admin status</param>
	/// <returns>True if successful, false if user not found</returns>
	public async Task<bool> UpdateAdminStatusAsync(int userId, bool isAdmin)
	{
		var user = await _userRepository.GetByIdAsync(userId);
		if (user == null)
		{
			return false;
		}

		user.IsAdmin = isAdmin;
		await _userRepository.UpdateAsync(user);

		_logger.LogInformation("User admin status updated: {UserId} -> {IsAdmin}", userId, isAdmin);
		return true;
	}

	/// <summary>
	/// Get all users (for admin purposes)
	/// </summary>
	/// <returns>List of all users</returns>
	public async Task<List<User>> GetAllUsersAsync()
	{
		return await _userRepository.GetAllAsync();
	}

	/// <summary>
	/// Get paged users with optional search and sorting (for admin purposes)
	/// </summary>
	public async Task<(List<User> Items, int TotalCount)> GetPagedUsersAsync(
		int page, int pageSize, string? search = null, string? sortBy = null, string? sortDirection = null)
	{
		return await _userRepository.GetPagedAsync(page, pageSize, search, sortBy, sortDirection);
	}

	/// <summary>
	/// Update user profile (admin operation - can change email, displayName, isAdmin)
	/// </summary>
	public async Task<User?> UpdateUserAsync(int userId, string? email, string? displayName, bool? isAdmin)
	{
		var user = await _userRepository.GetByIdAsync(userId);
		if (user == null) return null;

		if (email != null) user.Email = email;
		if (displayName != null) user.DisplayName = displayName;
		if (isAdmin.HasValue) user.IsAdmin = isAdmin.Value;

		await _userRepository.UpdateAsync(user);
		_logger.LogInformation("User updated by admin: {UserId}", userId);
		return user;
	}

	/// <summary>
	/// Update current user's own profile (non-admin operation - can only change displayName, not email)
	/// </summary>
	public async Task<User?> UpdateOwnProfileAsync(string subjectId, string? displayName)
	{
		var user = await _userRepository.GetBySubjectIdAsync(subjectId);
		if (user == null) return null;

		if (displayName != null) user.DisplayName = displayName;

		await _userRepository.UpdateAsync(user);
		_logger.LogInformation("User updated own profile: {SubjectId}", subjectId);
		return user;
	}

	/// <summary>
	/// Delete the current user's own account.
	/// Admin accounts cannot be self-deleted to prevent lockout.
	/// </summary>
	/// <param name="subjectId">Subject identifier of the authenticated user</param>
	/// <returns>True if deleted, null if not found, false if admin</returns>
	public async Task<bool?> DeleteOwnAccountAsync(string subjectId)
	{
		var user = await _userRepository.GetBySubjectIdAsync(subjectId);
		if (user == null) return null;

		if (user.IsAdmin)
		{
			_logger.LogWarning("Blocked self-deletion of admin account: {SubjectId}", subjectId);
			return false;
		}

		await _userRepository.DeleteAsync(user);
		_logger.LogInformation("User deleted own account: {SubjectId}", subjectId);
		return true;
	}

	/// <summary>
	/// Delete a user (admin operation)
	/// </summary>
	public async Task<bool> DeleteUserAsync(int userId)
	{
		var user = await _userRepository.GetByIdAsync(userId);
		if (user == null) return false;

		await _userRepository.DeleteAsync(user);
		_logger.LogInformation("User deleted by admin: {UserId}", userId);
		return true;
	}
}
