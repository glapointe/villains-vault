namespace Falchion.Villains.Vault.Api.DTOs;

/// <summary>
/// Generic paged results DTO with pagination metadata.
/// </summary>
/// <typeparam name="T">Type of items in the result set</typeparam>
public class PagedResultsDto<T>
{
	/// <summary>
	/// The items for the current page.
	/// </summary>
	public List<T> Items { get; set; } = new();

	/// <summary>
	/// Current page number (1-indexed).
	/// </summary>
	public int Page { get; set; }

	/// <summary>
	/// Number of items per page.
	/// </summary>
	public int PageSize { get; set; }

	/// <summary>
	/// Total number of items across all pages.
	/// </summary>
	public int TotalCount { get; set; }

	/// <summary>
	/// Total number of pages.
	/// </summary>
	public int TotalPages { get; set; }

	/// <summary>
	/// Whether there is a next page.
	/// </summary>
	public bool HasNextPage => Page < TotalPages;

	/// <summary>
	/// Whether there is a previous page.
	/// </summary>
	public bool HasPreviousPage => Page > 1;
}
