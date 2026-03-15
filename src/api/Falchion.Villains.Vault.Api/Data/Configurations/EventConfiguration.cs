using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Falchion.Villains.Vault.Api.Enums;

namespace Falchion.Villains.Vault.Api.Data.Configurations;

/// <summary>
/// EF Core configuration for the Event entity.
/// </summary>
public class EventConfiguration : IEntityTypeConfiguration<Entities.Event>
{
	public void Configure(EntityTypeBuilder<Entities.Event> builder)
	{
		builder.ToTable("Events");

		builder.HasKey(e => e.Id);

		builder.Property(e => e.TrackShackUrl)
			.IsRequired()
			.HasMaxLength(500);

		builder.Property(e => e.Name)
			.IsRequired()
			.HasMaxLength(200);

		builder.Property(e => e.EventSeries)
			.IsRequired()
			.HasDefaultValue(EventSeries.Unknown);

		builder.Property(e => e.CreatedAt)
			.IsRequired()
			.HasDefaultValueSql("GETUTCDATE()");

		builder.Property(e => e.ModifiedAt)
			.IsRequired()
			.HasDefaultValueSql("GETUTCDATE()");

		// Unique index on TrackShackUrl to prevent duplicate events
		builder.HasIndex(e => e.TrackShackUrl)
			.IsUnique();

		// Index on EventSeries for filtering events by series
		builder.HasIndex(e => e.EventSeries);

		// Relationship to User (submitted by)
		builder.HasOne(e => e.SubmittedBy)
			.WithMany()
			.HasForeignKey(e => e.SubmittedByUserId)
			.OnDelete(DeleteBehavior.Restrict);

		// Relationship to Races
		builder.HasMany(e => e.Races)
			.WithOne(r => r.Event)
			.HasForeignKey(r => r.EventId)
			.OnDelete(DeleteBehavior.Cascade);
	}
}
