/**
 * User Repository Implementation
 * 
 * Implements data access operations for User entity using Entity Framework Core.
 * Handles all database interactions for the User table.
 */

using Microsoft.EntityFrameworkCore;
using Falchion.Villains.Vault.Api.Data;
using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.Repositories;

/// <summary>
/// Repository implementation for User entity data access
/// </summary>
public class UserRepository : IUserRepository
{
	private readonly ApplicationDbContext _context;

	/// <summary>
	/// Constructor with dependency injection
	/// </summary>
	/// <param name="context">Database context</param>
	public UserRepository(ApplicationDbContext context)
	{
		_context = context;
	}

    /// <inheritdoc/>
    public async Task<User?> GetBySubjectIdAsync(string subjectId)
	{
		return await _context.Users
			.FirstOrDefaultAsync(u => u.SubjectId == subjectId);
	}

    /// <inheritdoc/>
    public async Task<User?> GetByIdAsync(int id)
	{
		return await _context.Users.FindAsync(id);
	}

    /// <inheritdoc/>
    public async Task<List<User>> GetAllAsync()
	{
		return await _context.Users
			.OrderBy(u => u.CreatedAt)
			.ToListAsync();
	}

    /// <inheritdoc/>
    public async Task<int> GetCountAsync()
	{
		return await _context.Users.CountAsync();
	}

    /// <inheritdoc/>
    public async Task<(List<User> Items, int TotalCount)> GetPagedAsync(
		int page, int pageSize, string? search = null, string? sortBy = null, string? sortDirection = null)
	{
		var query = _context.Users.AsQueryable();

		// Apply search filter on email and display name
		if (!string.IsNullOrWhiteSpace(search))
		{
			var searchLower = search.ToLower();
			query = query.Where(u =>
				u.Email.ToLower().Contains(searchLower) ||
				(u.DisplayName != null && u.DisplayName.ToLower().Contains(searchLower)));
		}

		// Get total count before paging
		var totalCount = await query.CountAsync();

		// Apply sorting
		var isDescending = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);
		query = sortBy?.ToLower() switch
		{
			"email" => isDescending ? query.OrderByDescending(u => u.Email) : query.OrderBy(u => u.Email),
			"displayname" => isDescending ? query.OrderByDescending(u => u.DisplayName) : query.OrderBy(u => u.DisplayName),
			"subjectid" => isDescending ? query.OrderByDescending(u => u.SubjectId) : query.OrderBy(u => u.SubjectId),
			"isadmin" => isDescending ? query.OrderByDescending(u => u.IsAdmin) : query.OrderBy(u => u.IsAdmin),
			"createdat" => isDescending ? query.OrderByDescending(u => u.CreatedAt) : query.OrderBy(u => u.CreatedAt),
			_ => query.OrderBy(u => u.CreatedAt)
		};

		// Apply paging
		var items = await query
			.Skip((page - 1) * pageSize)
			.Take(pageSize)
			.ToListAsync();

		return (items, totalCount);
	}

    /// <inheritdoc/>
    public async Task<User> AddAsync(User user)
	{
		_context.Users.Add(user);
		await _context.SaveChangesAsync();
		return user;
	}

    /// <inheritdoc/>
    public async Task<User> UpdateAsync(User user)
	{
		_context.Users.Update(user);
		await _context.SaveChangesAsync();
		return user;
	}

    /// <inheritdoc/>
    public async Task DeleteAsync(User user)
	{
		_context.Users.Remove(user);
		await _context.SaveChangesAsync();
	}

    /// <inheritdoc/>
    public async Task<User?> GetUserByDisplayNameAsync(string name)
	{
		var users = await _context.Users
			.Where(u => u.DisplayName == name)
			.ToListAsync();
		if (users.Count == 1)
		{
			return users[0];
		}
		return null;
	}
}
