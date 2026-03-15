/**
 * NotificationPreference Entity Configuration
 * 
 * Configures the NotificationPreference entity mapping, indexes, and constraints.
 */

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.Data.Configurations;

/// <summary>
/// Entity Framework configuration for NotificationPreference entity
/// </summary>
public class NotificationPreferenceConfiguration : IEntityTypeConfiguration<NotificationPreference>
{
	/// <summary>
	/// Configure the NotificationPreference entity
	/// </summary>
	/// <param name="builder">Entity type builder</param>
	public void Configure(EntityTypeBuilder<NotificationPreference> builder)
	{
		// One preference row per user
		builder.HasIndex(np => np.UserId)
			.IsUnique();

		// Configure relationship to User
		builder.HasOne(np => np.User)
			.WithMany()
			.HasForeignKey(np => np.UserId)
			.OnDelete(DeleteBehavior.Cascade);

		// Default all preferences to opted-in
		builder.Property(np => np.RaceResults)
			.HasDefaultValue(true);

		builder.Property(np => np.DlsDeclarations)
			.HasDefaultValue(true);

		builder.Property(np => np.CommunityEvents)
			.HasDefaultValue(true);

		// Set default timestamps
		builder.Property(np => np.CreatedAt)
			.HasDefaultValueSql("GETUTCDATE()");

		builder.Property(np => np.UpdatedAt)
			.HasDefaultValueSql("GETUTCDATE()");
	}
}
