/**
 * PushToken Entity Configuration
 * 
 * Configures the PushToken entity mapping, indexes, and constraints.
 */

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.Data.Configurations;

/// <summary>
/// Entity Framework configuration for PushToken entity
/// </summary>
public class PushTokenConfiguration : IEntityTypeConfiguration<PushToken>
{
	/// <summary>
	/// Configure the PushToken entity
	/// </summary>
	/// <param name="builder">Entity type builder</param>
	public void Configure(EntityTypeBuilder<PushToken> builder)
	{
		// Unique constraint on Token to prevent duplicate registrations
		builder.HasIndex(pt => pt.Token)
			.IsUnique();

		// Index on UserId for fast lookups by user
		builder.HasIndex(pt => pt.UserId);

		// Configure relationship to User
		builder.HasOne(pt => pt.User)
			.WithMany()
			.HasForeignKey(pt => pt.UserId)
			.OnDelete(DeleteBehavior.Cascade);

		// Set default values
		builder.Property(pt => pt.CreatedAt)
			.HasDefaultValueSql("GETUTCDATE()");

		builder.Property(pt => pt.UpdatedAt)
			.HasDefaultValueSql("GETUTCDATE()");
	}
}
