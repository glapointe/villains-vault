/**
 * DlsDeclaration Entity Configuration
 * 
 * Configures the DlsDeclaration entity mapping, indexes, and constraints.
 * Ensures proper uniqueness constraints for declarations.
 */

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.Data.Configurations;

/// <summary>
/// Entity Framework configuration for DlsDeclaration entity
/// </summary>
public class DlsDeclarationConfiguration : IEntityTypeConfiguration<DlsDeclaration>
{
	/// <summary>
	/// Configure the DlsDeclaration entity
	/// </summary>
	/// <param name="builder">Entity type builder</param>
	public void Configure(EntityTypeBuilder<DlsDeclaration> builder)
	{
		builder.ToTable("DlsDeclarations");

		builder.HasKey(d => d.Id);

		// Index for querying declarations by DLS race
		builder.HasIndex(d => d.DlsRaceId);

		// Index for querying declarations by user
		builder.HasIndex(d => d.UserId);

		// Unique constraint: a user can only declare once per DLS race
		builder.HasIndex(d => new { d.DlsRaceId, d.UserId })
			.IsUnique()
			.HasFilter("[UserId] IS NOT NULL");

		// Unique constraint: a bib number can only be declared once per DLS race
		builder.HasIndex(d => new { d.DlsRaceId, d.BibNumber })
			.IsUnique()
			.HasFilter("[BibNumber] IS NOT NULL");

		builder.Property(d => d.CreatedAt)
			.HasDefaultValueSql("GETUTCDATE()");

		builder.Property(d => d.ModifiedAt)
			.HasDefaultValueSql("GETUTCDATE()");

		builder.Property(d => d.Comments)
			.HasMaxLength(500);

		// Relationships
		builder.HasOne(d => d.DlsRace)
			.WithMany(r => r.Declarations)
			.HasForeignKey(d => d.DlsRaceId)
			.OnDelete(DeleteBehavior.Cascade);

		builder.HasOne(d => d.User)
			.WithMany()
			.HasForeignKey(d => d.UserId)
			.OnDelete(DeleteBehavior.SetNull);
	}
}
