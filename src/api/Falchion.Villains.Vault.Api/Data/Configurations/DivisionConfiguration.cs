using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.Data.Configurations;

/// <summary>
/// EF Core configuration for Division entity.
/// </summary>
public class DivisionConfiguration : IEntityTypeConfiguration<Division>
{
	public void Configure(EntityTypeBuilder<Division> builder)
	{
		builder.ToTable("Divisions");

		builder.HasKey(d => d.Id);

		// Foreign key to Race
		builder.Property(d => d.RaceId)
			.IsRequired();

		// Division value (Track Shack parameter)
		builder.Property(d => d.DivisionValue)
			.IsRequired()
			.HasMaxLength(10);

		// Division label (human-readable name)
		builder.Property(d => d.DivisionLabel)
			.IsRequired()
			.HasMaxLength(100);

		// Unique constraint: A race cannot have duplicate division values
		builder.HasIndex(d => new { d.RaceId, d.DivisionValue })
			.IsUnique();

		// CreatedAt timestamp
		builder.Property(d => d.CreatedAt)
			.IsRequired();

		// Relationship: Division belongs to one Race
		builder.HasOne(d => d.Race)
			.WithMany(r => r.Divisions)
			.HasForeignKey(d => d.RaceId)
			.OnDelete(DeleteBehavior.Cascade);

		// Relationship: Division has many Results
		builder.HasMany(d => d.Results)
			.WithOne(r => r.Division)
			.HasForeignKey(r => r.DivisionId)
			.OnDelete(DeleteBehavior.Restrict);
	}
}
