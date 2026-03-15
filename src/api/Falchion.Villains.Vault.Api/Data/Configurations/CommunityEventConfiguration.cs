/**
 * Community Event Entity Configuration
 * 
 * Configures the CommunityEvents table schema, indexes, and relationships.
 */

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.Data.Configurations;

/// <summary>
/// Entity Framework configuration for the CommunityEvent entity
/// </summary>
public class CommunityEventConfiguration : IEntityTypeConfiguration<CommunityEvent>
{
	/// <summary>
	/// Configure the CommunityEvents table
	/// </summary>
	public void Configure(EntityTypeBuilder<CommunityEvent> builder)
	{
		builder.ToTable("CommunityEvents");

		builder.HasKey(e => e.Id);

		builder.Property(e => e.Title)
			.IsRequired()
			.HasMaxLength(200);

		builder.Property(e => e.Link)
			.HasMaxLength(500);

		builder.Property(e => e.Comments)
			.HasMaxLength(1000);

		builder.Property(e => e.Location)
			.HasMaxLength(300);

		builder.Property(e => e.CreatedAt)
			.HasDefaultValueSql("GETUTCDATE()");

		builder.Property(e => e.ModifiedAt)
			.HasDefaultValueSql("GETUTCDATE()");

		// Index on creator for "my events" queries
		builder.HasIndex(e => e.CreatedByUserId);

		// Relationships
		builder.HasOne(e => e.CreatedBy)
			.WithMany()
			.HasForeignKey(e => e.CreatedByUserId)
			.OnDelete(DeleteBehavior.Restrict);

		builder.HasMany(e => e.Races)
			.WithOne(r => r.CommunityEvent)
			.HasForeignKey(r => r.CommunityEventId)
			.OnDelete(DeleteBehavior.Cascade);
	}
}
