using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Falchion.Villains.Vault.Api.Models;
using System.Text.Json;

namespace Falchion.Villains.Vault.Api.Data.Configurations;

/// <summary>
/// EF Core configuration for the Job entity.
/// </summary>
public class JobConfiguration : IEntityTypeConfiguration<Entities.Job>
{
	public void Configure(EntityTypeBuilder<Entities.Job> builder)
	{
		builder.ToTable("Jobs");

		builder.HasKey(j => j.Id);

		builder.Property(j => j.Status)
			.IsRequired()
			.HasConversion<string>() // Store enum as string in database
			.HasMaxLength(50);

		// JSON conversion for ProgressDataJson property
		builder.Property(j => j.ProgressDataJson)
			.IsRequired()
			.HasConversion(
				v => v,
				v => v)
			.HasDefaultValue("{}");

		builder.Property(j => j.CancellationRequested)
			.IsRequired()
			.HasDefaultValue(false);

		builder.Property(j => j.CreatedAt)
			.IsRequired()
			.HasDefaultValueSql("GETUTCDATE()");

		// Index on Status for queue queries
		builder.HasIndex(j => j.Status);

		// Index on CreatedAt for ordering jobs
		builder.HasIndex(j => j.CreatedAt);

		// Relationship to Race
		builder.HasOne(j => j.Race)
			.WithMany(r => r.Jobs)
			.HasForeignKey(j => j.RaceId)
			.OnDelete(DeleteBehavior.Cascade);

		// Relationship to User (submitted by)
		builder.HasOne(j => j.SubmittedBy)
			.WithMany()
			.HasForeignKey(j => j.SubmittedByUserId)
			.OnDelete(DeleteBehavior.Restrict);
	}
}
