/**
 * Community Race Entity Configuration
 * 
 * Configures the CommunityRaces table schema, indexes, and relationships.
 */

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.Data.Configurations;

/// <summary>
/// Entity Framework configuration for the CommunityRace entity
/// </summary>
public class CommunityRaceConfiguration : IEntityTypeConfiguration<CommunityRace>
{
	/// <summary>
	/// Configure the CommunityRaces table
	/// </summary>
	public void Configure(EntityTypeBuilder<CommunityRace> builder)
	{
		builder.ToTable("CommunityRaces");

		builder.HasKey(r => r.Id);

		builder.Property(r => r.RaceDate)
			.IsRequired();

		builder.Property(r => r.Distance)
			.IsRequired()
			.HasPrecision(8, 3);

		builder.Property(r => r.Comments)
			.HasMaxLength(500);

		builder.Property(r => r.CreatedAt)
			.HasDefaultValueSql("GETUTCDATE()");

		builder.Property(r => r.ModifiedAt)
			.HasDefaultValueSql("GETUTCDATE()");

		// Index on race date for upcoming queries
		builder.HasIndex(r => r.RaceDate);

		// Index on parent event
		builder.HasIndex(r => r.CommunityEventId);

		// Relationships
		builder.HasMany(r => r.Participations)
			.WithOne(p => p.CommunityRace)
			.HasForeignKey(p => p.CommunityRaceId)
			.OnDelete(DeleteBehavior.Cascade);
	}
}
