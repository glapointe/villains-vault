using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Models;
using System.Text.Json;

namespace Falchion.Villains.Vault.Api.Data.Configurations;

/// <summary>
/// EF Core configuration for the Race entity.
/// </summary>
public class RaceConfiguration : IEntityTypeConfiguration<Entities.Race>
{
	public void Configure(EntityTypeBuilder<Entities.Race> builder)
	{
		builder.ToTable("Races");

		builder.HasKey(r => r.Id);

		builder.Property(r => r.TrackShackUrl)
			.IsRequired()
			.HasMaxLength(500);

		builder.Property(r => r.Name)
			.IsRequired()
			.HasMaxLength(100);

		builder.Property(r => r.RaceDate)
			.IsRequired();

		builder.Property(r => r.Distance)
			.IsRequired()
			.HasMaxLength(50);

		builder.Property(r => r.EventSeries)
			.IsRequired()
			.HasDefaultValue(EventSeries.Unknown);

		builder.Property(r => r.Notes)
			.HasMaxLength(int.MaxValue); // nvarchar(max) equivalent

		// JSON conversion for MetadataJson property
		builder.Property(r => r.MetadataJson)
			.IsRequired()
			.HasConversion(
				v => v,
				v => v)
			.HasDefaultValue("{}");

		builder.Property(r => r.CreatedAt)
			.IsRequired()
			.HasDefaultValueSql("GETUTCDATE()");

		builder.Property(r => r.ModifiedAt)
			.IsRequired()
			.HasDefaultValueSql("GETUTCDATE()");

		// Unique index on TrackShackUrl to prevent duplicate races
		builder.HasIndex(r => r.TrackShackUrl)
			.IsUnique();

		// Index on RaceDate and Distance for duplicate detection
		builder.HasIndex(r => new { r.RaceDate, r.Distance });

		// Index on EventSeries for filtering races by series
		builder.HasIndex(r => r.EventSeries);

		// Relationship to Event
		builder.HasOne(r => r.Event)
			.WithMany(e => e.Races)
			.HasForeignKey(r => r.EventId)
			.OnDelete(DeleteBehavior.Cascade);

		// Relationship to RaceResults
		builder.HasMany(r => r.Results)
			.WithOne(rr => rr.Race)
			.HasForeignKey(rr => rr.RaceId)
			.OnDelete(DeleteBehavior.Cascade);

		// Relationship to Jobs
		builder.HasMany(r => r.Jobs)
			.WithOne(j => j.Race)
			.HasForeignKey(j => j.RaceId)
			.OnDelete(DeleteBehavior.Cascade);
	}
}
