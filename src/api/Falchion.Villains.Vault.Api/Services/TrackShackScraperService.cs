using HtmlAgilityPack;
using Falchion.Villains.Vault.Api.Data.Entities;
using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Models;
using Falchion.Villains.Vault.Api.Repositories;
using Falchion.Villains.Vault.Api.Utils;
using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Falchion.Villains.Vault.Api.Services;

/// <summary>
/// Service for scraping and parsing Track Shack race results pages.
/// </summary>
public class TrackShackScraperService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IResultRepository _resultRepository;
    private readonly IRaceRepository _raceRepository;
    private readonly IDivisionRepository _divisionRepository;
    private readonly IJobRepository _jobRepository;
    private readonly ResultEnrichmentService _resultEnrichmentService;
    private readonly DlsDeclarationService _dlsDeclarationService;
    private readonly PushNotificationService _pushNotificationService;
    private readonly ILogger<TrackShackScraperService> _logger;

    /// <summary>
    /// Special division value used to track runners who did not finish (DNF).
    /// These are detected by finding gaps in bib number sequences and querying Track Shack for those specific bibs.
    /// </summary>
    private const string DNF_DIVISION_VALUE = "__DNF__";
    private const string DNF_DIVISION_LABEL = "Did Not Finish (DNF)";
    private const int MAX_BIB_GAP_TO_CHECK = 5;

    public TrackShackScraperService(
        IHttpClientFactory httpClientFactory,
        IResultRepository resultRepository,
        IRaceRepository raceRepository,
        IDivisionRepository divisionRepository,
        IJobRepository jobRepository,
        ResultEnrichmentService resultEnrichmentService,
        DlsDeclarationService dlsDeclarationService,
        PushNotificationService pushNotificationService,
        ILogger<TrackShackScraperService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _resultRepository = resultRepository;
        _raceRepository = raceRepository;
        _divisionRepository = divisionRepository;
        _jobRepository = jobRepository;
        _resultEnrichmentService = resultEnrichmentService;
        _dlsDeclarationService = dlsDeclarationService;
        _pushNotificationService = pushNotificationService;
        _logger = logger;
    }

    /// <summary>
    /// Scrapes a Track Shack event page to extract race links and event information.
    /// </summary>
    public async Task<(string EventName, List<(string Url, string Name, DateTime? Date, RaceDistance? Distance)> Races)> ScrapeEventPageAsync(string eventUrl)
    {
        var client = _httpClientFactory.CreateClient("TrackShack");

        var html = await client.GetStringAsync(eventUrl);

        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        // Extract event name from h1 header (e.g., "2025 Walt Disney World® Marathon Weekend Results")
        var titleNode = doc.DocumentNode.SelectSingleNode("//h1");
        var eventName = titleNode?.InnerText?.Trim() ?? "Unknown Event";
        // Remove " Results" suffix if present
        if (eventName.EndsWith(" Results", StringComparison.OrdinalIgnoreCase))
        {
            eventName = eventName.Substring(0, eventName.Length - 8).Trim().Replace("&reg", "");
        }

        // Extract race links - look for links ending in ".php" (timed events), ignore PDFs (awards/challenges)
        var raceLinks = new List<(string Url, string Name, DateTime? Date, RaceDistance? Distance)>();
        var links = doc.DocumentNode.SelectNodes("//a[contains(@href, '.php')]");

        if (links != null)
        {
            foreach (var link in links)
            {
                var href = link.GetAttributeValue("href", "");
                var linkText = link.InnerText?.Trim();

                if (string.IsNullOrWhiteSpace(href) || string.IsNullOrWhiteSpace(linkText))
                    continue;

				// Ignore unofficial net times links with titles like "Unofficial Net Times"
				if (linkText.ToLower().Contains("unofficial"))
					continue;

				// Normalize the URL - this will properly combine eventUrl and href
				var normalizedUrl = UrlNormalizer.Normalize(href, eventUrl);

				// Extract race name from link text (e.g., "Marathon Results" -> "Marathon")
                var raceName = linkText;
                if (raceName.EndsWith(" Results", StringComparison.OrdinalIgnoreCase))
                {
                    raceName = raceName.Substring(0, raceName.Length - 8).Trim();
                }

                // Parse distance from race name using fuzzy matching
                var distance = RaceDistanceExtensions.ParseDistance(raceName);
                raceLinks.Add((normalizedUrl, raceName, null, distance));
            }
        }

        return (eventName, raceLinks);
    }

    /// <summary>
    /// Parses a single race results page, processing all divisions.
    /// Updates job progress in database after each division.
    /// </summary>
    public async Task ParseRaceAsync(int jobId, Race race)
    {
        var job = await _jobRepository.GetByIdAsync(jobId);
        if (job == null)
        {
            _logger.LogError("Job {JobId} not found", jobId);
            return;
        }

        var progressData = JobProgressData.FromJson(job.ProgressDataJson);
        job.Status = JobStatus.InProgress;
        await _jobRepository.UpdateAsync(job);

        try
        {
            var isFirstScan = (await _raceRepository.GetResultCountAsync(race.Id)) == 0;

            // Scrape the race page to get divisions
            var divisions = await ScrapeDivisionsAsync(race.TrackShackUrl);

            // If no divisions found, complete job with warning
            if (!divisions.Any())
            {
                _logger.LogWarning("No divisions found for race {RaceId} at {Url}", race.Id, race.TrackShackUrl);
                job.Status = JobStatus.Completed;
                job.CompletedAt = DateTime.UtcNow;
                progressData.Divisions = new List<DivisionProgress>
                {
                    new DivisionProgress
                    {
                        DivisionName = "N/A",
                        DivisionValue = "",
                        Status = DivisionStatus.Completed,
                        ErrorMessage = "Warning: No divisions found on race page. The page may not have division dropdowns or may have a different structure."
                    }
                };
                job.ProgressDataJson = progressData.ToJson();
                await _jobRepository.UpdateAsync(job);
                return;
            }

            progressData.Divisions = divisions.Select(d => new DivisionProgress
            {
                DivisionValue = d.Value,
                DivisionName = d.Name,
                Status = DivisionStatus.Pending
            }).ToList();

            job.ProgressDataJson = progressData.ToJson();
            await _jobRepository.UpdateAsync(job);

            var raceMetadata = RaceMetadata.FromJson(race.MetadataJson);
            var splitInfoByColumn = new Dictionary<RaceResultColumn, SplitTimeInfo>();

            // Process each division
            foreach (var division in progressData.Divisions)
            {
                // Check for cancellation
                var currentJob = await _jobRepository.GetByIdAsync(jobId);
                if (currentJob?.CancellationRequested == true)
                {
                    job.Status = JobStatus.Cancelled;
                    job.CompletedAt = DateTime.UtcNow;
                    await _jobRepository.UpdateAsync(job);
                    return;
                }

                division.Status = DivisionStatus.InProgress;
                job.ProgressDataJson = progressData.ToJson();
                await _jobRepository.UpdateAsync(job);

                try
                {
                    // Get or create division entity
                    var divisionEntity = await _divisionRepository.CreateOrUpdateAsync(
                        race.Id,
                        division.DivisionValue,
                        division.DivisionName
                    );

                    // Parse division results and collect split metadata
                    var (results, discoveredSplits) = await ParseDivisionResultsWithMetadataAsync(race.TrackShackUrl, division.DivisionValue);

                    // Merge discovered splits into master list
                    foreach (var kvp in discoveredSplits)
                    {
                        splitInfoByColumn[kvp.Key] = kvp.Value;
                    }

                    // Set DivisionId, RaceId, RunnerType, Gender, and OverallPace on all results
                    var runnerType = RunnerTypeExtensions.FromDivisionName(division.DivisionName);
                    var gender = GenderHelpers.ParseFromDivisionLabel(division.DivisionName);
                    foreach (var result in results)
                    {
                        result.RaceId = race.Id;
                        result.DivisionId = divisionEntity.Id;
                        result.RunnerType = runnerType;
                        result.Gender = gender;
                        result.OverallPace = PaceHelpers.CalculateOverallPace(result.NetTime, race.Distance);
                    }

                    // Batch upsert results
                    var (added, updated) = await _resultRepository.BatchUpsertAsync(race.Id, results);

                    division.RecordsParsed = results.Count;
                    division.RecordsAdded = added;
                    division.RecordsUpdated = updated;
                    division.Status = DivisionStatus.Completed;

                    progressData.TotalAdded += added;
                    progressData.TotalUpdated += updated;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error parsing division {Division} for race {RaceId}", division.DivisionName, race.Id);
                    division.Status = DivisionStatus.Failed;
                    division.ErrorMessage = ex.Message;
                }
                job.ProgressDataJson = progressData.ToJson();
                await _jobRepository.UpdateAsync(job);
            }

            // Update race metadata with discovered splits (ordered by column number)
            raceMetadata.SplitTimes = splitInfoByColumn
                .OrderBy(kvp => kvp.Key)
                .Select(kvp => kvp.Value)
                .ToList();
            race.MetadataJson = raceMetadata.ToJson();

            // Check for DNF runners by detecting gaps in bib sequences
            await DetectAndProcessDnfRunnersAsync(jobId, race, progressData);

            // Calculate pass counts (kills/assassins) for all results
            await _resultEnrichmentService.EnrichRaceResultsAsync(race.Id);

            var stats = await _raceRepository.BuildRaceStats(race.Id);
            // Serialize and save the statistics to the database
            race.StatisticsJson = stats.ToJson();
            await _raceRepository.UpdateAsync(race);

            var dlsRace = await _dlsDeclarationService.GetDlsRaceAsync(race.RaceDate);
            if (dlsRace != null)
            {
                await _dlsDeclarationService.ProcessDeclarationsAfterScrapeAsync(dlsRace.Id, race.Id);
            }

            // Determine final job status
            var completedCount = progressData.Divisions.Count(d => d.Status == DivisionStatus.Completed);
            var failedCount = progressData.Divisions.Count(d => d.Status == DivisionStatus.Failed);

            if (failedCount == 0)
            {
                job.Status = JobStatus.Completed;
            }
            else if (completedCount > 0)
            {
                job.Status = JobStatus.PartiallyCompleted;
            }
            else
            {
                job.Status = JobStatus.Failed;
            }

            job.CompletedAt = DateTime.UtcNow;
            job.ProgressDataJson = progressData.ToJson();
            await _jobRepository.UpdateAsync(job);

            // Send push notification for completed race scrapes
            if (isFirstScan && (job.Status == JobStatus.Completed || job.Status == JobStatus.PartiallyCompleted))
            {
                try
                {
                    await _pushNotificationService.NotifyRaceResultsAvailableAsync($"{race.Event.Name} - {race.Name}", race.Id);
                }
                catch (Exception notifyEx)
                {
                    _logger.LogWarning(notifyEx, "Failed to send race results notification for race {RaceId}", race.Id);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fatal error parsing race {RaceId}", race.Id);
            job.Status = JobStatus.Failed;
            job.CompletedAt = DateTime.UtcNow;
            progressData.Divisions.ForEach(d =>
            {
                if (d.Status == DivisionStatus.Pending || d.Status == DivisionStatus.InProgress)
                {
                    d.Status = DivisionStatus.Failed;
                    d.ErrorMessage = "Job failed: " + ex.Message;
                }
            });
            job.ProgressDataJson = progressData.ToJson();
            await _jobRepository.ForceUpdateAsync(job);
        }
    }

    /// <summary>
    /// Scrapes the divisions dropdown from a race results page.
    /// </summary>
    public async Task<List<(string Value, string Name)>> ScrapeDivisionsAsync(string raceUrl)
    {
        var client = _httpClientFactory.CreateClient("TrackShack");
        var html = await client.GetStringAsync(raceUrl);

        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        // Look for division dropdown - Track Shack uses select element with division options
        // The select typically contains options like "MEN -- 50 THROUGH 54", "WOMEN -- 30 THROUGH 34", etc.
        var divisions = new List<(string Value, string Name)>();
        var selectNode = doc.DocumentNode.SelectSingleNode("//select[option[contains(., 'MEN') or contains(., 'WOMEN') or contains(., 'DIVISION')]]");

        // Fallback: try finding select by common name attributes
        if (selectNode == null)
        {
            selectNode = doc.DocumentNode.SelectSingleNode("//select[@name='Div' or @name='division' or @name='Division']");
        }

        if (selectNode != null)
        {
            var options = selectNode.SelectNodes(".//option");
            if (options != null)
            {
                foreach (var option in options)
                {
                    var value = option.GetAttributeValue("value", "");
                    var text = option.InnerText.Trim();
                    // Skip empty options and "Select a Division" placeholders
                    if (!string.IsNullOrWhiteSpace(value) && !string.IsNullOrWhiteSpace(text) && !text.Contains("Select"))
                    {
                        divisions.Add((value, text));
                    }
                }
            }
        }

        // Return empty list if no divisions found - caller will handle as warning
        return divisions;
    }

    /// <summary>
    /// Parses race results for a specific division.
    /// </summary>
    public async Task<List<RaceResult>> ParseDivisionResultsAsync(string raceUrl, string divisionValue)
    {
        var (results, _) = await ParseDivisionResultsWithMetadataAsync(raceUrl, divisionValue);
        return results;
    }

    /// <summary>
    /// Parses race results for a specific division and returns split metadata.
    /// </summary>
    private async Task<(List<RaceResult> Results, Dictionary<RaceResultColumn, SplitTimeInfo> SplitInfo)> ParseDivisionResultsWithMetadataAsync(string raceUrl, string divisionValue)
    {
        var client = _httpClientFactory.CreateClient("TrackShack");
        var url = string.IsNullOrWhiteSpace(divisionValue)
            ? raceUrl
            : $"{raceUrl}?Type=2&Div={Uri.EscapeDataString(divisionValue)}";
        return await ParseResultsUrlWithMetadataAsync(url);
    }

    /// <summary>
    /// Parses race results for a specific bib and returns split metadata.
    /// </summary>
    private async Task<(List<RaceResult> Results, Dictionary<RaceResultColumn, SplitTimeInfo> SplitInfo)> ParseBibResultsWithMetadataAsync(string raceUrl, string bibNumber)
    {
        var client = _httpClientFactory.CreateClient("TrackShack");
        var url = string.IsNullOrWhiteSpace(bibNumber)
            ? raceUrl
            : $"{raceUrl}?Type=1&Bib={Uri.EscapeDataString(bibNumber)}";
        return await ParseResultsUrlWithMetadataAsync(url);
    }


    /// <summary>
    /// Parses race results page and returns split metadata.
    /// </summary>
    private async Task<(List<RaceResult> Results, Dictionary<RaceResultColumn, SplitTimeInfo> SplitInfo)> ParseResultsUrlWithMetadataAsync(string url)
    {
        var client = _httpClientFactory.CreateClient("TrackShack");

        var html = await client.GetStringAsync(url);

        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        var results = new List<RaceResult>();
        var splitInfo = new Dictionary<RaceResultColumn, SplitTimeInfo>();

        // If page includes "Requested information not found" then return.
        if (html.Contains("Requested information not found"))
        {
            return (results, splitInfo);
        }

        // Find the results table - actual selector depends on Track Shack structure
        // This is a placeholder implementation
        var table = doc.DocumentNode.SelectSingleNode("//table[contains(@class, 'info_table')]");
        if (table == null)
        {
            // Try alternative selectors
            table = doc.DocumentNode.SelectSingleNode("//table[.//th[contains(normalize-space(), 'Place')]]");
        }

        if (table != null)
        {
            var rows = table.SelectNodes(".//tr");
            if (rows != null && rows.Count > 0)
            {
                // Parse header row to create column mapping and extract split metadata
                var (columnMapping, headerSplitInfo) = ParseHeaderRowWithMetadata(rows[0]);
                splitInfo = headerSplitInfo;

                // Skip header row and any division info rows, process data rows
                foreach (var row in rows.Skip(1))
                {
                    var result = ParseResultRow(row, columnMapping);
                    if (result != null)
                    {
                        results.Add(result);
                    }
                }
            }
        }

        return (results, splitInfo);
    }

    /// <summary>
    /// Parses the header row to create a mapping of standard column names to cell indices,
    /// and extracts split time metadata.
    /// </summary>
    private (Dictionary<RaceResultColumn, int> ColumnMapping, Dictionary<RaceResultColumn, SplitTimeInfo> SplitInfo) ParseHeaderRowWithMetadata(HtmlNode headerRow)
    {
        var mapping = new Dictionary<RaceResultColumn, int>();
        var splitInfo = new Dictionary<RaceResultColumn, SplitTimeInfo>();
        var cells = headerRow.SelectNodes(".//th") ?? headerRow.SelectNodes(".//td");

        if (cells == null)
            return (mapping, splitInfo);

        int splitCounter = 1;

        for (int i = 0; i < cells.Count; i++)
        {
            var headerText = (cells[i].InnerText?.Trim() ?? "");
            var headerTextLower = headerText.ToLower();

            // Map header text to standard column names
            if (headerTextLower.Contains("div") && headerTextLower.Contains("place"))
                mapping[RaceResultColumn.DivisionPlace] = i;
            else if (headerTextLower.Contains("name"))
                mapping[RaceResultColumn.Name] = i;
            else if (headerTextLower.Contains("bib"))
                mapping[RaceResultColumn.BibNumber] = i;
            else if (headerTextLower.Contains("age"))
                mapping[RaceResultColumn.Age] = i;
            else if ((headerTextLower.Contains("overall") || headerTextLower == "place") && !headerTextLower.Contains("gender") && !headerTextLower.Contains("div"))
                mapping[RaceResultColumn.OverallPlace] = i;
            else if (headerTextLower.Contains("gender") && headerTextLower.Contains("place"))
                mapping[RaceResultColumn.GenderPlace] = i;
            else if (headerTextLower.Contains("clock") || headerTextLower.Contains("gun"))
                mapping[RaceResultColumn.ClockTime] = i;
            else if (headerTextLower.Contains("net") || headerTextLower.Contains("chip"))
                mapping[RaceResultColumn.NetTime] = i;
            else if (headerTextLower.Contains("hometown") || headerTextLower.Contains("city"))
                mapping[RaceResultColumn.Hometown] = i;
            else
            {
                // Try to parse as a split time column
                var splitTimeInfo = ParseSplitColumnHeader(headerText);
                if (splitTimeInfo != null && splitCounter <= 10)
                {
                    var splitColumn = (RaceResultColumn)Enum.Parse(typeof(RaceResultColumn), $"Split{splitCounter}");
                    mapping[splitColumn] = i;
                    splitInfo[splitColumn] = splitTimeInfo;
                    splitCounter++;
                }
            }
        }

        return (mapping, splitInfo);
    }

    /// <summary>
    /// Attempts to parse a column header as a split time.
    /// Handles variations like "5K Split", "11.5 Mile", "5 Kilometer Split", "Half", "Half Marathon", etc.
    /// </summary>
    private SplitTimeInfo? ParseSplitColumnHeader(string headerText)
    {
        if (string.IsNullOrWhiteSpace(headerText))
            return null;

        var normalized = headerText.Trim().ToLower();
        
        // Check for text-based split names (non-numeric indicators)
        // Half Marathon split (13.1 miles) - common in full marathon races
        if (normalized.Contains("half") && !normalized.Contains("full"))
        {
            return new SplitTimeInfo
            {
                Distance = 13.1,
                Label = headerText.Trim(),
                IsKilometers = false
            };
        }

        // Quarter Marathon split (6.55 miles) - less common but possible
        if (normalized.Contains("quarter") && !normalized.Contains("three"))
        {
            return new SplitTimeInfo
            {
                Distance = 6.55,
                Label = headerText.Trim(),
                IsKilometers = false
            };
        }

        // Three Quarter Marathon split (19.65 miles) - rare but possible
        if (normalized.Contains("three") && normalized.Contains("quarter"))
        {
            return new SplitTimeInfo
            {
                Distance = 19.65,
                Label = headerText.Trim(),
                IsKilometers = false
            };
        }
        
        // Regex pattern to match: [number] [optional space] [k/km/kilometer/m/mi/mile/miles] [optional "split"]
        // Examples: "5K", "5 K", "10K Split", "11.5 Mile", "5 Kilometer Split"
        var pattern = @"([0-9]+\.?[0-9]*)\s*(k|km|kilometer|kilometres?|m|mi|mile|miles?)";
        var match = Regex.Match(normalized, pattern, RegexOptions.IgnoreCase);
        
        if (!match.Success)
            return null;

        if (!double.TryParse(match.Groups[1].Value, NumberStyles.Float, CultureInfo.InvariantCulture, out double distance))
            return null;

        var unit = match.Groups[2].Value.ToLower();
        var isKilometers = unit.StartsWith("k");

        return new SplitTimeInfo
        {
            Distance = distance,
            Label = headerText.Trim(),
            IsKilometers = isKilometers
        };
    }

    /// <summary>
    /// Parses a single result row from the results table using the provided column mapping.
    /// </summary>
    private RaceResult? ParseResultRow(HtmlNode row, Dictionary<RaceResultColumn, int> columnMapping)
    {
        var cells = row.SelectNodes(".//td");
        if (cells == null || cells.Count == 0)
        {
            return null;
        }

        try
        {
            // Helper to safely get cell value
            string? GetCellValue(RaceResultColumn column)
            {
                if (columnMapping.TryGetValue(column, out int index) && index < cells.Count)
                {
                    return cells[index].InnerText?.Trim();
                }
                return null;
            }

            // Bib number is required - skip if missing or not numeric
            var bibNumber = GetCellValue(RaceResultColumn.BibNumber);
            if (string.IsNullOrWhiteSpace(bibNumber) || !bibNumber.All(char.IsDigit))
                return null;

            // Name is required
            var name = GetCellValue(RaceResultColumn.Name);
            if (string.IsNullOrWhiteSpace(name))
                return null;

            // Create result object with all available data
            var result = new RaceResult
            {
                BibNumber = int.Parse(bibNumber),
                Name = name,
                Age = ParseHelpers.ParseInt(GetCellValue(RaceResultColumn.Age)) ?? 0,
                OverallPlace = ParseHelpers.ParseInt(GetCellValue(RaceResultColumn.OverallPlace)),
                GenderPlace = ParseHelpers.ParseInt(GetCellValue(RaceResultColumn.GenderPlace)),
                DivisionPlace = ParseHelpers.ParseInt(GetCellValue(RaceResultColumn.DivisionPlace)),
                Split1 = ParseHelpers.ParseTimeSpan(GetCellValue(RaceResultColumn.Split1)),
                Split2 = ParseHelpers.ParseTimeSpan(GetCellValue(RaceResultColumn.Split2)),
                Split3 = ParseHelpers.ParseTimeSpan(GetCellValue(RaceResultColumn.Split3)),
                Split4 = ParseHelpers.ParseTimeSpan(GetCellValue(RaceResultColumn.Split4)),
                Split5 = ParseHelpers.ParseTimeSpan(GetCellValue(RaceResultColumn.Split5)),
                Split6 = ParseHelpers.ParseTimeSpan(GetCellValue(RaceResultColumn.Split6)),
                Split7 = ParseHelpers.ParseTimeSpan(GetCellValue(RaceResultColumn.Split7)),
                Split8 = ParseHelpers.ParseTimeSpan(GetCellValue(RaceResultColumn.Split8)),
                Split9 = ParseHelpers.ParseTimeSpan(GetCellValue(RaceResultColumn.Split9)),
                Split10 = ParseHelpers.ParseTimeSpan(GetCellValue(RaceResultColumn.Split10)),
                ClockTime = ParseHelpers.ParseTimeSpan(GetCellValue(RaceResultColumn.ClockTime)),
                NetTime = ParseHelpers.ParseTimeSpan(GetCellValue(RaceResultColumn.NetTime)),
                Hometown = GetCellValue(RaceResultColumn.Hometown)
            };
            result.StartTime = (result.ClockTime ?? TimeSpan.MinValue) - (result.NetTime ?? TimeSpan.MinValue);

            // There's a known bad data issue with at least one record. If the Hometown starts with a number then ignore the entry.
            if (!string.IsNullOrWhiteSpace(result.Hometown) && result.Hometown.Length > 0 && char.IsDigit(result.Hometown[0]))
            {
                return null;
            }

            return result;
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Detects and processes runners who did not finish (DNF) by finding gaps in bib number sequences.
    /// Only checks gaps of less than 5 bibs to avoid excessive queries for natural sequencing gaps.
    /// </summary>
    private async Task DetectAndProcessDnfRunnersAsync(int jobId, Race race, JobProgressData progressData)
    {
        try
        {
            _logger.LogInformation("Checking for DNF runners in race {RaceId}", race.Id);

            // Get all existing results sorted by bib number (excluding any existing DNF entries)
            var allResults = await _resultRepository.GetRaceResultsByRaceIdAsync(
                race.Id,
                RaceResultColumn.BibNumber,
                SortDirection.Ascending);

            // Exclude DNF division from the list used to find gaps
            var dnfDivision = await _divisionRepository.GetByRaceAndValueAsync(race.Id, DNF_DIVISION_VALUE);
            if (dnfDivision != null)
            {
                allResults = allResults.Where(r => r.DivisionId != dnfDivision.Id).ToList();
            }

            if (allResults.Count == 0)
            {
                _logger.LogInformation("No results to check for DNF gaps");
                return;
            }

            var existingBibs = allResults.Select(r => r.BibNumber).ToHashSet();
            var minBib = allResults.Min(r => r.BibNumber);
            var maxBib = allResults.Max(r => r.BibNumber);

            _logger.LogInformation("Checking bib range {MinBib} to {MaxBib} for gaps", minBib, maxBib);

            // Find gaps in the sequence
            var bibsToCheck = new List<int>();
            for (int bib = minBib; bib <= maxBib; bib++)
            {
                if (!existingBibs.Contains(bib))
                {
                    // Check if this gap is within our threshold
                    // Find the previous and next existing bib
                    var prevBib = existingBibs.Where(b => b < bib).DefaultIfEmpty(0).Max();
                    var nextBib = existingBibs.Where(b => b > bib).DefaultIfEmpty(int.MaxValue).Min();

                    var gapBefore = bib - prevBib;
                    var gapAfter = nextBib - bib;

                    // Only check if the gap is small (likely a DNF, not a natural sequencing gap)
                    if (gapBefore <= MAX_BIB_GAP_TO_CHECK || gapAfter <= MAX_BIB_GAP_TO_CHECK)
                    {
                        bibsToCheck.Add(bib);
                    }
                }
            }

            if (bibsToCheck.Count == 0)
            {
                _logger.LogInformation("No potential DNF bibs found");
                return;
            }

            _logger.LogInformation("Found {Count} potential DNF bibs to check", bibsToCheck.Count);

            // Get or create DNF division
            var dnfDivisionEntity = await _divisionRepository.CreateOrUpdateAsync(
                race.Id,
                DNF_DIVISION_VALUE,
                DNF_DIVISION_LABEL
            );

            var dnfResults = new List<RaceResult>();
            var checkedCount = 0;
            var foundCount = 0;

            // Query Track Shack for each potential DNF bib
            foreach (var bib in bibsToCheck)
            {
                // Check for cancellation
                var currentJob = await _jobRepository.GetByIdAsync(jobId);
                if (currentJob?.CancellationRequested == true)
                {
                    _logger.LogInformation("DNF check cancelled for job {JobId}", jobId);
                    return;
                }

                checkedCount++;

                try
                {
                    var (results, _) = await ParseBibResultsWithMetadataAsync(race.TrackShackUrl, bib.ToString());

                    if (results.Count > 0)
                    {
                        foreach (var result in results)
                        {
                            // Verify this is actually a DNF (no finish time)
                            if (!result.NetTime.HasValue && !result.ClockTime.HasValue)
                            {
                                result.RaceId = race.Id;
                                result.DivisionId = dnfDivisionEntity.Id;
                                result.RunnerType = RunnerType.Runner; // Default to standard runner for DNF
                                result.Gender = Gender.Unknown;
                                dnfResults.Add(result);
                                foundCount++;
                                _logger.LogDebug("Found DNF runner: Bib {Bib}, Name {Name}", result.BibNumber, result.Name);
                            }
                        }
                    }

#if DEBUG
                    if (foundCount >= 5)
                    {
                        // It takes a long time to process so we only need to capture enough for testing when in debug mode.
                        break;
                    }
#endif

                    // Small delay to avoid overwhelming Track Shack
                    if (checkedCount % 10 == 0)
                    {
                        await Task.Delay(100);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogDebug("Error checking bib {Bib} for DNF: {Message}", bib, ex.Message);
                    // Continue checking other bibs
                }
            }

            if (dnfResults.Count > 0)
            {
                _logger.LogInformation("Found {Count} DNF runners, saving to database", dnfResults.Count);
                var (added, updated) = await _resultRepository.BatchUpsertAsync(race.Id, dnfResults);
                _logger.LogInformation("DNF processing complete: {Added} added, {Updated} updated", added, updated);

                // Update progress data
                progressData.TotalAdded += added;
                progressData.TotalUpdated += updated;
            }
            else
            {
                _logger.LogInformation("No DNF runners found after checking {Count} bibs", checkedCount);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error detecting DNF runners for race {RaceId}", race.Id);
            // Don't fail the job, just log the error
        }
    }
}
