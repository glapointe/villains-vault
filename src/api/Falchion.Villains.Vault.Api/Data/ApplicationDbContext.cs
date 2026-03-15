/**
 * Application Database Context
 * 
 * Entity Framework Core DbContext for the application.
 * Manages database entities and SQL Server database configuration.
 */

using Microsoft.EntityFrameworkCore;
using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.Data;

/// <summary>
/// Application database context for Entity Framework Core
/// To create the initial migration: dotnet ef migrations add InitialCreate
/// To add a new migration after model changes: dotnet ef migrations add MigrationName
/// </summary>
public class ApplicationDbContext : DbContext
{
	/// <summary>
	/// Constructor accepting DbContextOptions
	/// </summary>
	/// <param name="options">Database context configuration options</param>
	public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
		: base(options)
	{
	}

	/// <summary>
	/// Users table
	/// </summary>
	public DbSet<User> Users => Set<User>();

	/// <summary>
	/// Events table
	/// </summary>
	public DbSet<Event> Events => Set<Event>();

	/// <summary>
	/// Races table
	/// </summary>
	public DbSet<Race> Races => Set<Race>();

	/// <summary>
	/// Divisions table
	/// </summary>
	public DbSet<Division> Divisions => Set<Division>();

	/// <summary>
	/// Race results table
	/// </summary>
	public DbSet<RaceResult> RaceResults => Set<RaceResult>();

	/// <summary>
	/// Jobs table
	/// </summary>
	public DbSet<Job> Jobs => Set<Job>();

	/// <summary>
	/// Race result follows table
	/// </summary>
	public DbSet<RaceResultFollow> RaceResultFollows => Set<RaceResultFollow>();

	/// <summary>
	/// DLS race entries for declaration tracking
	/// </summary>
	public DbSet<DlsRace> DlsRaces => Set<DlsRace>();

	/// <summary>
	/// DLS declarations table
	/// </summary>
	public DbSet<DlsDeclaration> DlsDeclarations => Set<DlsDeclaration>();

	/// <summary>
	/// Community events table
	/// </summary>
	public DbSet<CommunityEvent> CommunityEvents => Set<CommunityEvent>();

	/// <summary>
	/// Community races table
	/// </summary>
	public DbSet<CommunityRace> CommunityRaces => Set<CommunityRace>();

	/// <summary>
	/// Community participations table
	/// </summary>
	public DbSet<CommunityParticipation> CommunityParticipations => Set<CommunityParticipation>();

	/// <summary>
	/// Push notification tokens table
	/// </summary>
	public DbSet<PushToken> PushTokens => Set<PushToken>();

	/// <summary>
	/// Notification preferences table
	/// </summary>
	public DbSet<NotificationPreference> NotificationPreferences => Set<NotificationPreference>();

	/// <summary>
	/// Configure entity models and relationships
	/// </summary>
	/// <param name="modelBuilder">Model builder for configuring entities</param>
	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		base.OnModelCreating(modelBuilder);

		// Apply all entity configurations from the current assembly
		modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
	}

	/// <summary>
	/// Override SaveChanges to automatically update UpdatedAt timestamp
	/// </summary>
	public override int SaveChanges()
	{
		UpdateTimestamps();
		return base.SaveChanges();
	}

	/// <summary>
	/// Override SaveChangesAsync to automatically update UpdatedAt timestamp
	/// </summary>
	public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
	{
		UpdateTimestamps();
		return base.SaveChangesAsync(cancellationToken);
	}

	/// <summary>
	/// Update timestamps for modified entities
	/// </summary>
	private void UpdateTimestamps()
	{
		var userEntries = ChangeTracker.Entries()
			.Where(e => e.Entity is User && e.State == EntityState.Modified);

		foreach (var entry in userEntries)
		{
			((User)entry.Entity).UpdatedAt = DateTime.UtcNow;
		}

		var followEntries = ChangeTracker.Entries()
			.Where(e => e.Entity is RaceResultFollow && e.State == EntityState.Modified);

		foreach (var entry in followEntries)
		{
			((RaceResultFollow)entry.Entity).ModifiedAt = DateTime.UtcNow;
		}

		var dlsRaceEntries = ChangeTracker.Entries()
			.Where(e => e.Entity is DlsRace && e.State == EntityState.Modified);

		foreach (var entry in dlsRaceEntries)
		{
			((DlsRace)entry.Entity).ModifiedAt = DateTime.UtcNow;
		}

		var dlsDeclarationEntries = ChangeTracker.Entries()
			.Where(e => e.Entity is DlsDeclaration && e.State == EntityState.Modified);

		foreach (var entry in dlsDeclarationEntries)
		{
			((DlsDeclaration)entry.Entity).ModifiedAt = DateTime.UtcNow;
		}

		var communityEventEntries = ChangeTracker.Entries()
			.Where(e => e.Entity is CommunityEvent && e.State == EntityState.Modified);

		foreach (var entry in communityEventEntries)
		{
			((CommunityEvent)entry.Entity).ModifiedAt = DateTime.UtcNow;
		}

		var communityRaceEntries = ChangeTracker.Entries()
			.Where(e => e.Entity is CommunityRace && e.State == EntityState.Modified);

		foreach (var entry in communityRaceEntries)
		{
			((CommunityRace)entry.Entity).ModifiedAt = DateTime.UtcNow;
		}

		var communityParticipationEntries = ChangeTracker.Entries()
			.Where(e => e.Entity is CommunityParticipation && e.State == EntityState.Modified);

		foreach (var entry in communityParticipationEntries)
		{
			((CommunityParticipation)entry.Entity).ModifiedAt = DateTime.UtcNow;
		}
	}
}
