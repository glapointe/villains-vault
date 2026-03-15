/**
 * Community Participation Entity Configuration
 * 
 * Configures the CommunityParticipations table schema, indexes, and relationships.
 */

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.Data.Configurations;

/// <summary>
/// Entity Framework configuration for the CommunityParticipation entity
/// </summary>
public class CommunityParticipationConfiguration : IEntityTypeConfiguration<CommunityParticipation>
{
	/// <summary>
	/// Configure the CommunityParticipations table
	/// </summary>
	public void Configure(EntityTypeBuilder<CommunityParticipation> builder)
	{
		builder.ToTable("CommunityParticipations");

		builder.HasKey(p => p.Id);

		builder.Property(p => p.Notes)
			.HasMaxLength(500);

		builder.Property(p => p.CreatedAt)
			.HasDefaultValueSql("GETUTCDATE()");

		builder.Property(p => p.ModifiedAt)
			.HasDefaultValueSql("GETUTCDATE()");

		// Unique constraint: one participation per user per race
		builder.HasIndex(p => new { p.CommunityRaceId, p.UserId })
			.IsUnique();

		// Index on user for "my participations" queries
		builder.HasIndex(p => p.UserId);

		// Relationships
		builder.HasOne(p => p.User)
			.WithMany()
			.HasForeignKey(p => p.UserId)
			.OnDelete(DeleteBehavior.Cascade);
	}
}
