using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.DTOs;

/// <summary>
/// DTO for a race division.
/// </summary>
public class DivisionDto
{
	/// <summary>
	/// Division ID.
	/// </summary>
	public int Id { get; set; }

	/// <summary>
	/// Division name (e.g., "M25-29", "F50-54").
	/// </summary>
	public string Name { get; set; } = string.Empty;

	/// <summary>
	/// Converts a Division entity to a DTO.
	/// </summary>
	public static DivisionDto FromEntity(Division division)
	{
		return new DivisionDto
		{
			Id = division.Id,
			Name = division.DivisionLabel
		};
	}
}
