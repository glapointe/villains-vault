/**
 * RaceResultFollow Entity Configuration
 * 
 * Configures the RaceResultFollow entity mapping, indexes, and constraints.
 * Ensures a user can only follow a given race result once.
 */

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.Data.Configurations;

/// <summary>
/// Entity Framework configuration for RaceResultFollow entity
/// </summary>
public class RaceResultFollowConfiguration : IEntityTypeConfiguration<RaceResultFollow>
{
	/// <summary>
	/// Configure the RaceResultFollow entity
	/// </summary>
	/// <param name="builder">Entity type builder</param>
	public void Configure(EntityTypeBuilder<RaceResultFollow> builder)
	{
		builder.ToTable("RaceResultFollows");

		builder.HasKey(f => f.Id);

		// A user can only follow a given race result once
		builder.HasIndex(f => new { f.UserId, f.RaceResultId })
			.IsUnique();

		// Index for querying all follows for a user
		builder.HasIndex(f => f.UserId);

		// Index for querying all followers of a result
		builder.HasIndex(f => f.RaceResultId);

		builder.Property(f => f.FollowType)
			.HasConversion<int>();

		builder.Property(f => f.CreatedAt)
			.HasDefaultValueSql("GETUTCDATE()");

		builder.Property(f => f.ModifiedAt)
			.HasDefaultValueSql("GETUTCDATE()");

		// Relationships
		builder.HasOne(f => f.User)
			.WithMany()
			.HasForeignKey(f => f.UserId)
			.OnDelete(DeleteBehavior.Cascade);

		builder.HasOne(f => f.RaceResult)
			.WithMany()
			.HasForeignKey(f => f.RaceResultId)
			.OnDelete(DeleteBehavior.Cascade);
	}
}
