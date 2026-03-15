/**
 * User Entity Configuration
 * 
 * Configures the User entity mapping, indexes, and constraints.
 * Separates configuration from DbContext to keep it clean and maintainable.
 */

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.Data.Configurations;

/// <summary>
/// Entity Framework configuration for User entity
/// </summary>
public class UserConfiguration : IEntityTypeConfiguration<User>
{
	/// <summary>
	/// Configure the User entity
	/// </summary>
	/// <param name="builder">Entity type builder</param>
	public void Configure(EntityTypeBuilder<User> builder)
	{
		// Create unique index on SubjectId for fast lookups
		builder.HasIndex(u => u.SubjectId)
			.IsUnique();

		// Create index on Email for searching
		builder.HasIndex(u => u.Email);

		// Set default values
		builder.Property(u => u.IsAdmin)
			.HasDefaultValue(false);

		builder.Property(u => u.CreatedAt)
			.HasDefaultValueSql("GETUTCDATE()");

		builder.Property(u => u.UpdatedAt)
			.HasDefaultValueSql("GETUTCDATE()");
	}
}
