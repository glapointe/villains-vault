/**
 * DLS Declaration Service
 * 
 * Business logic for managing DLS races and DLS declarations.
 * Handles creation, validation, and matching of declarations to race results.
 */

using Azure.Core;
using Falchion.Villains.Vault.Api.Data;
using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.DTOs;
using Falchion.Villains.Vault.Api.Repositories;
using Microsoft.Extensions.Caching.Memory;

namespace Falchion.Villains.Vault.Api.Services;

/// <summary>
/// Service for managing DLS declarations and DLS races
/// </summary>
public class DlsDeclarationService
{
	private readonly ApplicationDbContext _context;
	private readonly IDlsDeclarationRepository _repository;
	private readonly IRaceResultFollowRepository _followRepository;
	private readonly IResultRepository _resultRepository;
	private readonly IUserRepository _userRepository;
	private readonly PushNotificationService _pushNotificationService;
	private readonly IMemoryCache _cache;
	private readonly ILogger<DlsDeclarationService> _logger;

	private const string DlsResultIdsCacheKeyPrefix = "dls-result-ids-";

	public DlsDeclarationService(
		ApplicationDbContext context,
		IDlsDeclarationRepository repository,
		IRaceResultFollowRepository followRepository,
		IResultRepository resultRepository,
		IUserRepository userRepository,
		PushNotificationService pushNotificationService,
		IMemoryCache cache,
		ILogger<DlsDeclarationService> logger)
	{
		_context = context;
		_repository = repository;
		_followRepository = followRepository;
		_resultRepository = resultRepository;
		_userRepository = userRepository;
		_pushNotificationService = pushNotificationService;
		_cache = cache;
		_logger = logger;
	}

	// --- DLS Races ---

	/// <summary>
	/// Get all DLS races with declaration counts
	/// </summary>
	public async Task<List<DlsRaceDto>> GetDlsRacesAsync(bool upcomingOnly = true)
	{
		var races = await _repository.GetDlsRacesAsync(upcomingOnly);
		return races.Select(r => DlsRaceDto.FromEntity(r)).ToList();
	}

	/// <summary>
	/// Create a new DLS race with optional initial bib number declarations
	/// </summary>
	public async Task<DlsRaceDto> CreateDlsRaceAsync(CreateDlsRaceRequest request, int createdByUserId)
	{
		var dlsRace = new DlsRace
		{
			Name = request.Name.Trim(),
			RaceDate = request.RaceDate.Date,
			CreatedByUserId = createdByUserId
		};

		await _repository.AddDlsRaceAsync(dlsRace);

		// Notify users about new DLS declaration event
		try
		{
			await _pushNotificationService.NotifyDlsRaceCreatedAsync(dlsRace.Name);
		}
		catch (Exception ex)
		{
			_logger.LogWarning(ex, "Failed to send DLS race creation notification for {Name}", dlsRace.Name);
		}

		// Reload with declarations
		var loaded = await _repository.GetDlsRaceByIdAsync(dlsRace.Id);
		return DlsRaceDto.FromEntity(loaded!);
	}

	/// <summary>
	/// Update an existing DLS race
	/// </summary>
	public async Task<DlsRaceDto?> UpdateDlsRaceAsync(int id, UpdateDlsRaceRequest request)
	{
		var race = await _repository.GetDlsRaceByIdAsync(id);
		if (race == null) return null;

		if (!string.IsNullOrWhiteSpace(request.Name))
			race.Name = request.Name.Trim();
		if (request.RaceDate.HasValue)
			race.RaceDate = request.RaceDate.Value.Date;

		await _repository.UpdateDlsRaceAsync(race);

		return DlsRaceDto.FromEntity(race);
	}

	/// <summary>
	/// Delete a DLS race
	/// </summary>
	public async Task<bool> DeleteDlsRaceAsync(int id)
	{
		var race = await _repository.GetDlsRaceByIdAsync(id);
		if (race == null) return false;

		// Invalidate cache if this race was linked
		if (race.RaceId.HasValue)
			InvalidateDlsCache(race.RaceId.Value);

		await _repository.DeleteDlsRaceAsync(race);
		return true;
	}

	public async Task<DlsRaceDto?> GetDlsRaceAsync(DateTime date)
	{
		var race = await _repository.GetDlsRaceByDateAsync(date);
		if (race == null) return null;

		return DlsRaceDto.FromEntity(race);
	}

	// --- Declarations ---

	/// <summary>
	/// Get all declarations for a DLS race
	/// </summary>
	public async Task<List<DlsDeclarationDto>> GetDeclarationsAsync(int dlsRaceId)
	{
		var declarations = await _repository.GetDeclarationsByRaceAsync(dlsRaceId);
		return declarations.Select(DlsDeclarationDto.FromEntity).ToList();
	}

	/// <summary>
	/// Admin: Create a declaration by bib number
	/// </summary>
	public async Task<DlsDeclarationDto> CreateDeclarationByBibAsync(int dlsRaceId, int bibNumber)
	{
		// Check for existing bib declaration
		var existing = await _repository.GetDeclarationByBibAndRaceAsync(dlsRaceId, bibNumber);
		if (existing != null)
			throw new InvalidOperationException($"Bib number {bibNumber} is already declared for this race.");

		var declaration = new DlsDeclaration
		{
			DlsRaceId = dlsRaceId,
			BibNumber = bibNumber,
			UserId = null
		};

		await _repository.AddDeclarationAsync(declaration);
		await InvalidateDlsCacheForDlsRaceAsync(dlsRaceId);

		// Reload with nav properties
		var loaded = await _repository.GetDeclarationByIdAsync(declaration.Id);
		return DlsDeclarationDto.FromEntity(loaded!);
	}

	/// <summary>
	/// User: Self-declare for a DLS race
	/// </summary>
	public async Task<DlsDeclarationDto> SelfDeclareAsync(int dlsRaceId, int userId, int? bibNumber = null, bool isFirstDls = false, bool isGoingForKills = false, string? comments = null)
	{
		// Check for existing user declaration
		var existing = await _repository.GetDeclarationByUserAndRaceAsync(dlsRaceId, userId);
		if (existing != null)
			throw new InvalidOperationException("You have already declared for this race.");

		// If bib provided, check it's not already taken
		if (bibNumber.HasValue)
		{
			var bibExists = await _repository.GetDeclarationByBibAndRaceAsync(dlsRaceId, bibNumber.Value);
			if (bibExists != null)
			{
				// If the bib exists but has no user, claim it
				if (bibExists.UserId == null)
				{
					bibExists.UserId = userId;
					bibExists.IsFirstDls = isFirstDls;
					bibExists.IsGoingForKills = isGoingForKills;
					bibExists.Comments = comments?.Trim();
					await _repository.UpdateDeclarationAsync(bibExists);
					await InvalidateDlsCacheForDlsRaceAsync(dlsRaceId);
					var reloaded = await _repository.GetDeclarationByIdAsync(bibExists.Id);
					return DlsDeclarationDto.FromEntity(reloaded!);
				}
				throw new InvalidOperationException($"Bib number {bibNumber} is already claimed by another user.");
			}
		}

		var declaration = new DlsDeclaration
		{
			DlsRaceId = dlsRaceId,
			BibNumber = bibNumber,
			UserId = userId,
			IsFirstDls = isFirstDls,
			IsGoingForKills = isGoingForKills,
			Comments = comments?.Trim()
		};

		await _repository.AddDeclarationAsync(declaration);
		await InvalidateDlsCacheForDlsRaceAsync(dlsRaceId);

		var loaded = await _repository.GetDeclarationByIdAsync(declaration.Id);
		return DlsDeclarationDto.FromEntity(loaded!);
	}

	/// <summary>
	/// User: Update their own declaration (add/change bib number)
	/// </summary>
	public async Task<DlsDeclarationDto?> UpdateDeclarationAsync(int declarationId, int userId, UpdateDlsDeclarationRequest request)
	{
		var declaration = await _repository.GetDeclarationByIdAsync(declarationId);
		if (declaration == null) return null;
		if (declaration.UserId != userId)
			throw new UnauthorizedAccessException("You can only update your own declarations.");

		// If setting a bib number, check uniqueness
		if (request.BibNumber.HasValue)
		{
			var bibExists = await _repository.GetDeclarationByBibAndRaceAsync(declaration.DlsRaceId, request.BibNumber.Value);
			if (bibExists != null && bibExists.Id != declarationId)
			{
				// If the bib is not associated with a user then we want to remove the existing bibExists entry as the user has now effectively claimed it.
				if (bibExists.UserId == null)
					await _repository.DeleteDeclarationAsync(bibExists);
				else
					throw new InvalidOperationException($"Bib number {request.BibNumber} is already claimed by another user.");
			}
		}

		declaration.BibNumber = request.BibNumber;
		if (request.IsFirstDls.HasValue)
			declaration.IsFirstDls = request.IsFirstDls.Value;
		if (request.IsGoingForKills.HasValue)
			declaration.IsGoingForKills = request.IsGoingForKills.Value;
		if (request.Comments != null)
			declaration.Comments = request.Comments.Trim();
		await _repository.UpdateDeclarationAsync(declaration);
		await InvalidateDlsCacheForDlsRaceAsync(declaration.DlsRaceId);

		var loaded = await _repository.GetDeclarationByIdAsync(declarationId);
		return DlsDeclarationDto.FromEntity(loaded!);
	}

	/// <summary>
	/// Admin: Bulk import declarations by bib number with optional name matching to associate users.
	/// </summary>
	/// <param name="dlsRaceId"></param>
	/// <param name="imports"></param>
	/// <returns></returns>
	public async Task<List<DlsDeclarationDto>> ImportDeclarationsAsync(int dlsRaceId, List<ImportDlsDeclarationRequest> imports)
	{
		// SqlServerRetryingExecutionStrategy does not support user-initiated transactions directly.
		// We must wrap the entire operation in CreateExecutionStrategy().ExecuteAsync() so the retry
		// strategy can replay the whole unit — including the transaction — on transient failures.
		// EF Core 10 uses the full interface signature: ExecuteAsync(state, operation, verifySucceeded, ct).
		var executionStrategy = _context.Database.CreateExecutionStrategy();
		var createdDeclarations = await executionStrategy.ExecuteAsync(
			(object?)null,
			async (ctx, _, ct) =>
			{
				var result = new List<DlsDeclarationDto>();
				await using var transaction = await _context.Database.BeginTransactionAsync(ct);
				try
				{
					foreach (var import in imports)
					{
						// Try to find a UserId for the user using an exact name match. This allows us to associate imported bib declarations with users if the name matches, but still update/create declarations for unmatched entries based on bib number.
						var user = await _userRepository.GetUserByDisplayNameAsync(import.Name?.Trim() ?? string.Empty);

						var bibExists = await _repository.GetDeclarationByBibAndRaceAsync(dlsRaceId, import.BibNumber);

						if (bibExists != null)
						{
							// If the bib is not associated with a user then we're likely just updating a previously imported entry.
							bool update = true;
							if (bibExists.UserId == null)
							{
                                var comment = import.Comments?.Trim();
                                if (user == null && !string.IsNullOrWhiteSpace(import.Name))
                                {
                                    comment = $"[{import.Name.Trim().Trim(",")}] {comment}";
                                }

                                bibExists.IsFirstDls = import.IsFirstDls ?? bibExists.IsFirstDls;
								bibExists.IsGoingForKills = import.IsGoingForKills ?? bibExists.IsGoingForKills;
								bibExists.Comments = string.IsNullOrWhiteSpace(bibExists.Comments) ? comment : bibExists.Comments;
								if (user != null)
								{
									bibExists.UserId = user.Id;
								}
							}
							else
							{
								// If the bib is already claimed by a user, update the comments if not already specified.
								if (!string.IsNullOrWhiteSpace(import.Comments) && string.IsNullOrWhiteSpace(bibExists.Comments))
								{
									bibExists.Comments = import.Comments.Trim();
								}
								else
								{
									update = false;
								}
							}
							if (update)
							{
								await _repository.UpdateDeclarationAsync(bibExists);
								var reloaded = await _repository.GetDeclarationByIdAsync(bibExists.Id);
								result.Add(DlsDeclarationDto.FromEntity(reloaded!));
							}
							else
							{
								result.Add(DlsDeclarationDto.FromEntity(bibExists));
							}
						}
						else
						{
							// We didn't find an existing entry with the bib number so create a new one.
							var comment = import.Comments?.Trim();
							if (user == null && !string.IsNullOrWhiteSpace(import.Name))
							{
								comment = $"[{import.Name.Trim().Trim(",")}] {comment}";
							}
							var declaration = new DlsDeclaration
							{
								DlsRaceId = dlsRaceId,
								BibNumber = import.BibNumber,
								UserId = user?.Id,
								IsFirstDls = import.IsFirstDls ?? false,
								IsGoingForKills = import.IsGoingForKills ?? false,
								Comments = comment
							};
							await _repository.AddDeclarationAsync(declaration);
							var loaded = await _repository.GetDeclarationByIdAsync(declaration.Id);
							result.Add(DlsDeclarationDto.FromEntity(loaded!));
						}
					}
					await transaction.CommitAsync(ct);
					return result;
				}
				catch (Exception ex)
				{
					_logger.LogError(ex, "Failed to import DLS declarations for DLS race {DlsRaceId}", dlsRaceId);
					await transaction.RollbackAsync(ct);
					throw;
				}
			},
			verifySucceeded: null,
			CancellationToken.None);
		try
		{
			await InvalidateDlsCacheForDlsRaceAsync(dlsRaceId);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Failed to invalidate DLS cache after importing declarations for DLS race {DlsRaceId}", dlsRaceId);
		}
		return createdDeclarations;
	}

	/// <summary>
	/// Admin: Update any declaration
	/// </summary>
	public async Task<DlsDeclarationDto?> AdminUpdateDeclarationAsync(int declarationId, UpdateDlsDeclarationRequest request)
	{
		var declaration = await _repository.GetDeclarationByIdAsync(declarationId);
		if (declaration == null) return null;

		if (request.BibNumber.HasValue)
		{
			var bibExists = await _repository.GetDeclarationByBibAndRaceAsync(declaration.DlsRaceId, request.BibNumber.Value);
			if (bibExists != null && bibExists.Id != declarationId)
				throw new InvalidOperationException($"Bib number {request.BibNumber} is already declared for this race.");
		}

		declaration.BibNumber = request.BibNumber;
		if (request.IsFirstDls.HasValue)
			declaration.IsFirstDls = request.IsFirstDls.Value;
		if (request.IsGoingForKills.HasValue)
			declaration.IsGoingForKills = request.IsGoingForKills.Value;
		if (request.Comments != null)
			declaration.Comments = request.Comments.Trim();
		await _repository.UpdateDeclarationAsync(declaration);
		await InvalidateDlsCacheForDlsRaceAsync(declaration.DlsRaceId);

		var loaded = await _repository.GetDeclarationByIdAsync(declarationId);
		return DlsDeclarationDto.FromEntity(loaded!);
	}

	/// <summary>
	/// Delete a declaration. Users can only delete their own; admins can delete any.
	/// </summary>
	public async Task<bool> DeleteDeclarationAsync(int declarationId, int userId, bool isAdmin)
	{
		var declaration = await _repository.GetDeclarationByIdAsync(declarationId);
		if (declaration == null) return false;

		if (!isAdmin && declaration.UserId != userId)
			throw new UnauthorizedAccessException("You can only remove your own declarations.");

		var dlsRaceId = declaration.DlsRaceId;
		await _repository.DeleteDeclarationAsync(declaration);
		await InvalidateDlsCacheForDlsRaceAsync(dlsRaceId);
		return true;
	}

	/// <summary>
	/// Get the current user's declaration for a specific DLS race
	/// </summary>
	public async Task<DlsDeclarationDto?> GetMyDeclarationAsync(int dlsRaceId, int userId)
	{
		var declaration = await _repository.GetDeclarationByUserAndRaceAsync(dlsRaceId, userId);
		if (declaration == null) return null;

		// Load nav properties
		var loaded = await _repository.GetDeclarationByIdAsync(declaration.Id);
		return DlsDeclarationDto.FromEntity(loaded!);
	}

	/// <summary>
	/// Get the current user's declarations for multiple DLS races in one query
	/// </summary>
	public async Task<List<DlsDeclarationDto>> GetMyDeclarationsAsync(IEnumerable<int> dlsRaceIds, int userId)
	{
		var declarations = await _repository.GetDeclarationsByUserAndRacesAsync(dlsRaceIds, userId);
		return declarations.Select(DlsDeclarationDto.FromEntity).ToList();
	}

	// --- DLS Result IDs (for kill charts) ---

	/// <summary>
	/// Get all race result IDs that are associated with DLS declarations for a given race.
	/// Matches on bib number from declarations and claimed follows marked as DLS.
	/// Aggressively cached; invalidated when declarations or claims change.
	/// </summary>
	public async Task<List<long>> GetDlsResultIdsForRaceAsync(int raceId)
	{
		var cacheKey = $"{DlsResultIdsCacheKeyPrefix}{raceId}";

		if (_cache.TryGetValue(cacheKey, out List<long>? cached) && cached != null)
			return cached;

		var resultIds = new HashSet<long>();

		// 1. Get declarations linked to this race via DLS race
		var declarations = await _repository.GetDeclarationsByActualRaceIdAsync(raceId);
		var bibNumbers = declarations
			.Where(d => d.BibNumber.HasValue)
			.Select(d => d.BibNumber!.Value)
			.Distinct()
			.ToList();

		// Match bib numbers to race results
		if (bibNumbers.Count > 0)
		{
			var results = await _resultRepository.GetByBibNumbersAsync(raceId, bibNumbers);
			foreach (var result in results)
				resultIds.Add(result.Id);
		}

		// 2. Get claimed follows marked as DLS for this race
		var dlsFollows = await _followRepository.GetDlsFollowsForRaceAsync(raceId);
		foreach (var follow in dlsFollows)
		{
			resultIds.Add(follow.RaceResultId);
		}

		var result_list = resultIds.ToList();

		_cache.Set(cacheKey, result_list, new MemoryCacheEntryOptions
		{
			AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1),
			SlidingExpiration = TimeSpan.FromMinutes(30)
		});

		return result_list;
	}

	/// <summary>
	/// Process DLS declarations after a race has been scraped.
	/// Matches declarations to actual race results and creates follow entries.
	/// </summary>
	public async Task<int> ProcessDeclarationsAfterScrapeAsync(int dlsRaceId, int raceId)
	{
		var race = await _repository.GetDlsRaceByIdAsync(dlsRaceId);
		if (race == null) return 0;

		// Link the DLS race to the actual race
		race.RaceId = raceId;
		await _repository.UpdateDlsRaceAsync(race);

		var claimsCreated = 0;

		// 1. Match declarations that have both userId and bibNumber
		var matchable = await _repository.GetMatchableDeclarationsAsync(dlsRaceId);
		foreach (var declaration in matchable)
		{
			var raceResult = await _resultRepository.GetByBibNumberAsync(raceId, declaration.BibNumber!.Value);
			if (raceResult == null) continue;

			// Check if follow already exists
			var existingFollow = await _followRepository.GetByUserAndResultAsync(declaration.UserId!.Value, raceResult.Id);
			if (existingFollow != null) continue;

			var follow = new RaceResultFollow
			{
				UserId = declaration.UserId!.Value,
				RaceResultId = raceResult.Id,
				FollowType = Enums.FollowType.Claimed,
				DeadLastStarted = true
			};
			await _followRepository.AddAsync(follow);
			claimsCreated++;
		}

		// 2. Try name matching for declarations with userId but no bib
		var nameMatchable = await _repository.GetNameMatchableDeclarationsAsync(dlsRaceId);
		foreach (var declaration in nameMatchable)
		{
			var user = declaration.User;
			if (user == null || string.IsNullOrWhiteSpace(user.DisplayName)) continue;

			var matchingResults = await _resultRepository.SearchByNameAsync(user.DisplayName, raceId);
			if (matchingResults.Count != 1) continue; // Only match if exactly one result

			var raceResult = matchingResults.First();

			// Update the declaration with the matched bib number
			declaration.BibNumber = raceResult.BibNumber;
			await _repository.UpdateDeclarationAsync(declaration);

			// Check if follow already exists
			var existingFollow = await _followRepository.GetByUserAndResultAsync(declaration.UserId!.Value, raceResult.Id);
			if (existingFollow != null) continue;

			var follow = new RaceResultFollow
			{
				UserId = declaration.UserId!.Value,
				RaceResultId = raceResult.Id,
				FollowType = Enums.FollowType.Claimed,
				DeadLastStarted = true
			};
			await _followRepository.AddAsync(follow);
			claimsCreated++;
		}

		// Invalidate cache
		InvalidateDlsCache(raceId);

		_logger.LogInformation("Processed DLS declarations for DLS race {DlsRaceId} → race {RaceId}: {ClaimsCreated} claims created",
			dlsRaceId, raceId, claimsCreated);

		return claimsCreated;
	}

	// --- Helpers ---

	private void InvalidateDlsCache(int raceId)
	{
		_cache.Remove($"{DlsResultIdsCacheKeyPrefix}{raceId}");
	}

	private async Task InvalidateDlsCacheForDlsRaceAsync(int dlsRaceId)
	{
		try
		{
			var race = await _repository.GetDlsRaceByIdAsync(dlsRaceId);
			if (race?.RaceId != null)
				InvalidateDlsCache(race.RaceId.Value);
		}
		catch (Exception ex)
		{
			_logger.LogWarning(ex, "Failed to invalidate DLS cache for DLS race {DlsRaceId}", dlsRaceId);
		}
	}
}
