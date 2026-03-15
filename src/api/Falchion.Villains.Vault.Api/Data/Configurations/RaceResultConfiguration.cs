using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Falchion.Villains.Vault.Api.Data.Configurations;

/// <summary>
/// EF Core configuration for the RaceResult entity.
/// </summary>
public class RaceResultConfiguration : IEntityTypeConfiguration<Entities.RaceResult>
{
	public void Configure(EntityTypeBuilder<Entities.RaceResult> builder)
	{
		builder.ToTable("RaceResults");

		builder.HasKey(rr => rr.Id);

		builder.Property(rr => rr.BibNumber)
			.IsRequired();

		builder.Property(rr => rr.Name)
			.IsRequired()
			.HasMaxLength(200);

		builder.Property(rr => rr.Age)
			.IsRequired();

		builder.Property(rr => rr.Hometown)
			.HasMaxLength(200);

		builder.Property(rr => rr.CreatedAt)
			.IsRequired()
			.HasDefaultValueSql("GETUTCDATE()");

		builder.Property(rr => rr.ModifiedAt)
			.IsRequired()
			.HasDefaultValueSql("GETUTCDATE()");

		// TimeSpan properties map natively to SQL Server time(7) — no ValueConverter needed.
		// All race durations (net time, pace, splits) are under 24 hours.

		// Composite unique index on RaceId and BibNumber to prevent duplicates
		builder.HasIndex(rr => new { rr.RaceId, rr.BibNumber })
			.IsUnique();

		// Index on DivisionId for filtering results by division
		builder.HasIndex(rr => rr.DivisionId);

		// Composite index on RaceId + OverallPlace — covers the most common query pattern
		// (paged grid, count queries, DNF exclusion). Replaces standalone OverallPlace index.
		builder.HasIndex(rr => new { rr.RaceId, rr.OverallPlace });

		// Composite index for hometown-based queries and ranking
		builder.HasIndex(rr => new { rr.RaceId, rr.Hometown });

		// Composite index for name + age search (runner matching across events)
		builder.HasIndex(rr => new { rr.RaceId, rr.Name, rr.Age });

		// Index for gender-based filtering
		builder.HasIndex(rr => new { rr.RaceId, rr.Gender });

		// Composite index on RaceId + StartTime for pass calculations and closest-starter queries
		builder.HasIndex(rr => new { rr.RaceId, rr.StartTime });

		// Composite index on RaceId + NetTime for closest-finisher queries (SQL-side ORDER BY ABS diff)
		builder.HasIndex(rr => new { rr.RaceId, rr.NetTime });

		// Index on Name for cross-race name search (supports LIKE 'name%' and full-text queries)
		builder.HasIndex(rr => rr.Name);

		// Index on Hometown for cross-race hometown filtering
		builder.HasIndex(rr => rr.Hometown);

		// Relationship to Race
		builder.HasOne(rr => rr.Race)
			.WithMany(r => r.Results)
			.HasForeignKey(rr => rr.RaceId)
			.OnDelete(DeleteBehavior.Cascade);

		// Relationship to Division
		builder.HasOne(rr => rr.Division)
			.WithMany(d => d.Results)
			.HasForeignKey(rr => rr.DivisionId)
			.OnDelete(DeleteBehavior.Restrict);
	}
}
