/**
 * DlsRace Entity Configuration
 * 
 * Configures the DlsRace entity mapping, indexes, and constraints.
 */

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.Data.Configurations;

/// <summary>
/// Entity Framework configuration for DlsRace entity
/// </summary>
public class DlsRaceConfiguration : IEntityTypeConfiguration<DlsRace>
{
	/// <summary>
	/// Configure the DlsRace entity
	/// </summary>
	/// <param name="builder">Entity type builder</param>
	public void Configure(EntityTypeBuilder<DlsRace> builder)
	{
		builder.ToTable("DlsRaces");

		builder.HasKey(r => r.Id);

		builder.Property(r => r.Name)
			.IsRequired()
			.HasMaxLength(200);

		builder.Property(r => r.RaceDate)
			.IsRequired();

		// Index on RaceDate for filtering upcoming races
		builder.HasIndex(r => r.RaceDate);

		// Optional link to actual Race once scraped
		builder.HasIndex(r => r.RaceId);

		builder.Property(r => r.CreatedAt)
			.HasDefaultValueSql("GETUTCDATE()");

		builder.Property(r => r.ModifiedAt)
			.HasDefaultValueSql("GETUTCDATE()");

		// Relationships
		builder.HasOne(r => r.Race)
			.WithMany()
			.HasForeignKey(r => r.RaceId)
			.OnDelete(DeleteBehavior.SetNull);

		builder.HasOne(r => r.CreatedBy)
			.WithMany()
			.HasForeignKey(r => r.CreatedByUserId)
			.OnDelete(DeleteBehavior.Restrict);

		builder.HasMany(r => r.Declarations)
			.WithOne(d => d.DlsRace)
			.HasForeignKey(d => d.DlsRaceId)
			.OnDelete(DeleteBehavior.Cascade);
	}
}
