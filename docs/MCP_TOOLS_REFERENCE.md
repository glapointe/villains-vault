# MCP Tools Reference

Complete reference for all Model Context Protocol tools exposed by the Villains Vault API. Each tool is callable by any MCP-compatible AI client (Claude, GitHub Copilot, Cursor, etc.) connected to the `/mcp` endpoint.

For setup instructions, see the [MCP Integration Guide](MCP_INTEGRATION.md).

---

## Tool Names Quick Reference

Comma-separated list of all MCP tool wire names (snake_case), useful for Azure AI Foundry agent configuration:

```
list_events,get_available_years,get_race_details,get_divisions,get_race_statistics,get_bulk_race_statistics,get_race_weather,search_results,get_result_details,get_last_starter,get_closest_results,find_runner_across_races,search_runner_by_name,query_race_results,get_runner_split_analysis,compare_runners,get_hometown_leaderboard,get_runner_percentile,get_hometown_regions,get_hometown_cities
```

---

## Table of Contents

**Event Tools**
- [ListEvents](#listevents) — `list_events`
- [GetAvailableYears](#getavailableyears) — `get_available_years`
- [GetRaceDetails](#getracedetails) — `get_race_details`
- [GetDivisions](#getdivisions) — `get_divisions`
- [GetRaceStatistics](#getracestatistics) — `get_race_statistics`
- [GetBulkRaceStatistics](#getbulkracestatistics) — `get_bulk_race_statistics`
- [GetRaceWeather](#getraceweather) — `get_race_weather`

**Race Result Tools**
- [SearchResults](#searchresults) — `search_results`
- [GetResultDetails](#getresultdetails) — `get_result_details`
- [GetLastStarter](#getlaststarter) — `get_last_starter`
- [GetClosestResults](#getclosestresults) — `get_closest_results`
- [FindRunnerAcrossRaces](#findrunneracrossraces) — `find_runner_across_races`
- [SearchRunnerByName](#searchrunnerbyname) — `search_runner_by_name`
- [QueryRaceResults](#queryraceresults) — `query_race_results`

**Runner Tools**
- [GetRunnerSplitAnalysis](#getrunnersplitanalysis) — `get_runner_split_analysis`
- [CompareRunners](#comparerunners) — `compare_runners`
- [GetHometownLeaderboard](#gethometownleaderboard) — `get_hometown_leaderboard`
- [GetRunnerPercentile](#getrunnerpercentile) — `get_runner_percentile`
- [GetHometownRegions](#gethometownregions) — `get_hometown_regions`
- [GetHometownCities](#gethometowncities) — `get_hometown_cities`

---

## Event Tools

### ListEvents
`list_events`

List all runDisney events with their races. Each event (e.g., "Walt Disney World Marathon Weekend 2024") contains multiple races (5K, 10K, Half Marathon, Full Marathon). Optionally filter by year and/or event series.

| Parameter | Type | Required | Description |
|-----------|------|----------|--------------|
| `year` | int | No | Year to filter events (e.g., 2024). Omit or pass 0 for all years. |
| `eventSeries` | string | No | Event series filter: `DisneylandHalloween`, `DisneylandHalfMarathon`, `DisneyWorldWineAndDine`, `DisneyWorldMarathon`, `DisneyWorldPrincess`, `DisneyWorldSpringtime`. Omit for all series. |

**Returns:** Event names and IDs with nested race names, IDs, dates, and distances.

<details>
<summary>Example prompts</summary>

- _"What runDisney events are available?"_
- _"Show me all events from 2024."_
- _"List every runDisney race weekend."_
- _"What races happened in 2023?"_
- _"Show me all Princess Weekend events."_
- _"List all Disneyland races."_

</details>

---

### GetAvailableYears
`get_available_years`

Get the list of years that have runDisney event data available. Optionally scope to a specific event series to see only years that series has data.

| Parameter | Type | Required | Description |
|-----------|------|----------|--------------|
| `eventSeries` | string | No | Event series filter: `DisneylandHalloween`, `DisneylandHalfMarathon`, `DisneyWorldWineAndDine`, `DisneyWorldMarathon`, `DisneyWorldPrincess`, `DisneyWorldSpringtime`. Omit for all series. |

**Returns:** Array of years with available data.

<details>
<summary>Example prompts</summary>

- _"What years have race data?"_
- _"How far back does the data go?"_
- _"Which years are available?"_
- _"What years have Princess Weekend data?"_
- _"Has there been a Wine & Dine race every year?"_

</details>

---

### GetRaceDetails
`get_race_details`

Get detailed information about a specific race including runner counts and DNF stats. Use `ListEvents` first to find race IDs.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `raceId` | int | **Yes** | The race ID |

**Returns:** Race name, date, distance, notes, runner counts (total/male/female/unknown), DNF count, and parent event name.

<details>
<summary>Example prompts</summary>

- _"How many runners were in the 2024 Walt Disney World Marathon?"_
- _"Give me details about race 7."_
- _"How many people DNF'd in the half marathon?"_
- _"What's the male/female breakdown for this race?"_

</details>

---

### GetDivisions
`get_divisions`

Get all age group divisions for a specific race. Returns division IDs and labels (e.g., "MEN -- 25 THROUGH 29", "FEMALE -- 50 THROUGH 54"). Useful for filtering race results by division.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `raceId` | int | **Yes** | The race ID |

**Returns:** List of division IDs and names.

<details>
<summary>Example prompts</summary>

- _"What age divisions are in race 7?"_
- _"Show me the age groups for the 2024 marathon."_
- _"What divisions can I filter results by?"_

</details>

---

### GetRaceStatistics
`get_race_statistics`

Get pre-calculated race statistics including runner type breakdowns, age group stats, launch/landing congestion, and split time analysis.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `raceId` | int | **Yes** | The race ID |

**Returns:** Comprehensive statistical breakdown for the race.

<details>
<summary>Example prompts</summary>

- _"Show me the statistics for the 2024 marathon."_
- _"What's the runner type breakdown for race 7?"_
- _"How congested was the race start?"_
- _"Give me the age group statistics."_

</details>

---

### GetBulkRaceStatistics
`get_bulk_race_statistics`

Get summary statistics for all races across multiple events in a single call. Returns runner counts, runner type breakdowns, and DNF counts for every matching race. Use this instead of calling `GetRaceStatistics` repeatedly when comparing across events or tracking trends over time. Optionally filter by year range, event, event series, or race distance.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startYear` | int | No | Start year inclusive (e.g., 2022). Omit or pass 0 for no lower bound. |
| `endYear` | int | No | End year inclusive (e.g., 2024). Omit or pass 0 for no upper bound. |
| `eventId` | int | No | Limit results to a single event's races. Omit or pass 0 for all events. |
| `eventSeries` | string | No | Event series filter: `DisneylandHalloween`, `DisneylandHalfMarathon`, `DisneyWorldWineAndDine`, `DisneyWorldMarathon`, `DisneyWorldPrincess`, `DisneyWorldSpringtime`. Omit for all series. |
| `distance` | string | No | Race distance filter: `FiveK`, `TenK`, `TenMile`, `HalfMarathon`, `FullMarathon`. Omit for all distances. |

**Returns:** For each matching race: event name, race name, date, distance, total/male/female runner counts, runner type breakdown (standard, push rim, hand cycle, duo), DNF count, and runners over 16 min/mile pace.

<details>
<summary>Example prompts</summary>

- _"How have marathon runner counts changed over the years?"_
- _"Compare participation trends across all half marathons."_
- _"Show me all Princess Weekend race stats."_
- _"How many runners have participated in each Wine & Dine event?"_
- _"Give me a summary of all 5K races across every event."_

</details>

---

### GetRaceWeather
`get_race_weather`

Get the weather conditions on race day. Includes hourly and daily temperature, humidity, wind, and precipitation data from the Open-Meteo historical weather API.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `raceId` | int | **Yes** | The race ID |

**Returns:** Race metadata with hourly and daily weather data (temperature, humidity, wind, precipitation).

<details>
<summary>Example prompts</summary>

- _"What was the weather like on race day for the 2024 marathon?"_
- _"Was it hot during the half marathon?"_
- _"How windy was it during the race?"_
- _"Did it rain on marathon day?"_

</details>

---

## Race Result Tools

### SearchResults
`search_results`

Search race results by runner name, bib number, or hometown within a specific race. Optionally filter by region (state/country) to narrow results to runners from a specific area. Returns paged results. Use `ListEvents` or `GetRaceDetails` first to find race IDs.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `raceId` | int | **Yes** | The race ID to search within |
| `searchTerm` | string | **Yes** | Matches against runner name, bib number, or hometown |
| `limit` | int | No | Max results to return (default 10, max 50) |
| `region` | string | No | State code (e.g., "FL") or country name (e.g., "Brazil") to only show runners from that region |

**Returns:** Matching results with bib, name, age, gender, placement, times, pace, hometown, passes (kills), and passers (assassins).

<details>
<summary>Example prompts</summary>

- _"Find John Smith in the 2024 marathon."_
- _"Look up bib number 12345 in race 7."_
- _"Search for runners from Orlando in the half marathon."_
- _"Did anyone named Garcia run in this race?"_

</details>

---

### GetResultDetails
`get_result_details`

Get detailed information about a specific race result, including placement stats, pass counts, and enrichment data. Use `SearchResults` first to find result IDs.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `raceResultId` | long | **Yes** | The race result ID |

**Returns:** Full result details including placement (overall, gender, division), times, pace, hometown, contextual stats (total race runners, division runners), passes (kills), passers (assassins), and enrichment data (pass/passer breakdowns by division/gender/hometown/region, plus gender total and hometown/region rankings).

<details>
<summary>Example prompts</summary>

- _"Show me the full details for result 54321."_
- _"How did that runner place in their age group?"_
- _"How many runners did they pass?"_
- _"Give me all the stats for this runner's race."_
- _"What's their kill/assassin breakdown?"_

</details>

---

### GetLastStarter
`get_last_starter`

Get the last starter (balloon lady / sweeper) for a race. This is the runner with the latest start time whose pace is close to the course pace limit of 16 min/mile.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `raceId` | int | **Yes** | The race ID |

**Returns:** Result details for the last starter / course sweeper.

<details>
<summary>Example prompts</summary>

- _"Who was the balloon lady in the 2024 marathon?"_
- _"Who was the last person to start the race?"_
- _"Show me the course sweeper's result."_

</details>

---

### GetClosestResults
`get_closest_results`

Find runners who started or finished closest in time to a specific race result. Useful for finding running buddies or race-day neighbors.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `raceResultId` | long | **Yes** | The race result ID to find neighbors for |
| `count` | int | No | Number of closest runners to return (default 10, max 20) |

**Returns:** The target runner plus lists of closest starters and closest finishers with time differences.

<details>
<summary>Example prompts</summary>

- _"Who started near runner 54321?"_
- _"Find runners who finished close to Jane Doe."_
- _"Who were my race-day neighbors?"_
- _"Show me people who crossed the finish line around the same time."_

</details>

---

### FindRunnerAcrossRaces
`find_runner_across_races`

Find a runner's results across all events. Matches by name and age (adjusted for year differences), using hometown to disambiguate. Pass the result ID from any race to find their other results.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `raceResultId` | long | **Yes** | A race result ID for this runner from any race |

**Returns:** All matched results across events with event name, race name, date, distance, placement, time, and pace.

<details>
<summary>Example prompts</summary>

- _"Has Jane Doe run other runDisney races?"_
- _"Show me all of this runner's results across events."_
- _"Track runner 54321's history across race weekends."_
- _"How has this person improved over the years?"_

</details>

---

### SearchRunnerByName
`search_runner_by_name`

Search for a runner by name across all races. Returns matching results with event/race context, useful for finding a runner without needing a result ID first. Optionally scope to a specific race or event. Supports partial name matching.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | **Yes** | The runner's name to search for (supports partial match, e.g., "Reynolds" or "Matthew Reynolds") |
| `raceId` | int | No | Race ID to limit search to a single race |
| `eventId` | int | No | Event ID to limit search to all races in an event (ignored if `raceId` is set) |
| `eventSeries` | string | No | Event series filter: `DisneylandHalloween`, `DisneylandHalfMarathon`, `DisneyWorldWineAndDine`, `DisneyWorldMarathon`, `DisneyWorldPrincess`, `DisneyWorldSpringtime`. Omit for all series (ignored if `raceId` or `eventId` is set). |
| `limit` | int | No | Max results to return (default 20, max 50) |

**Returns:** Matched results with event name, race name, date, distance, result ID, overall place, net time, pace, and hometown.

<details>
<summary>Example prompts</summary>

- _"Search for Matthew Reynolds across all races."_
- _"Find anyone named Garcia in the 2024 marathon."_
- _"Look up Smith in all 2024 events."_
- _"Has anyone named Johnson run a runDisney race?"_
- _"Did Jane Doe run any Princess Weekend races?"_
- _"Find all Wine & Dine results for runner named Reynolds."_

</details>

---

### QueryRaceResults
`query_race_results`

Query and sort race results with flexible filtering and sorting. Sort by **any field**: overall placement (default), kills (passes), assassins (passers), start time, age, pace, net time, clock time, name, bib number, gender/division placement, and more. Combine with filters for gender, division, runner type, region, or a search term.

Use this for _"top finishers"_, _"most kills"_, _"who started last?"_, _"oldest runners"_, _"show runners sorted by pace"_, etc.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `raceId` | int | **Yes** | The race ID |
| `sortBy` | string | No | Field to sort by: `OverallPlace`, `GenderPlace`, `DivisionPlace`, `Age`, `NetTime`, `ClockTime`, `StartTime`, `OverallPace`, `Passes`, `Passers`, `Name`, `BibNumber`, `Hometown`. Default: `OverallPlace`. |
| `sortDirection` | string | No | `"asc"` or `"desc"`. Default depends on field — descending for Passes/Passers/Age, ascending for everything else. |
| `limit` | int | No | Max results to return (default 20, max 50) |
| `gender` | string | No | Gender filter: `"Male"` or `"Female"`. Omit for all genders. |
| `divisionId` | int | No | Division ID filter. Use `GetDivisions` to find IDs. Omit for all divisions. |
| `runnerType` | string | No | Runner type filter: `"Runner"`, `"PushRim"`, `"HandCycle"`, or `"Duo"`. Omit for all types. |
| `search` | string | No | Search term to filter by name, bib number, or hometown before sorting. |
| `region` | string | No | State code (e.g., "FL") or country name (e.g., "Brazil") to only show runners from that region |

**Returns:** Sorted and filtered results with placement, times, pace, demographic info, passes (kills), and passers (assassins). Response includes metadata about the applied sort and filters.

<details>
<summary>Example prompts</summary>

- _"Who were the top 10 finishers in the 2024 marathon?"_
- _"Show me the top 5 female finishers."_
- _"Who won the men's 30-34 age group?"_
- _"Who had the most kills in the 2024 marathon?"_
- _"Show me the runners who started last in this race."_
- _"Who are the oldest runners in the half marathon?"_
- _"Show me the top 10 female runners sorted by pace."_
- _"Which runners from Florida had the most assassins?"_
- _"List all hand cycle athletes sorted by net time."_
- _"Who had the most passes in the 10K?"_
- _"Show me the youngest runners in the marathon."_
- _"Sort results by start time descending to find the last starters."_
- _"Who are the top Duo runners by placement?"_

</details>

---

## Runner Tools

### GetRunnerSplitAnalysis
`get_runner_split_analysis`

Analyze a runner's split times for a race. Shows per-segment pace, cumulative times, and whether the runner ran a negative split (second half faster than first).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `raceResultId` | long | **Yes** | The race result ID to analyze |

**Returns:** Overall pace, negative/positive split indicator, and per-segment data (label, cumulative time, segment time, distance, segment pace).

<details>
<summary>Example prompts</summary>

- _"Show me the split times for result 54321."_
- _"Did Jane Doe run a negative split?"_
- _"Analyze this runner's pacing strategy."_
- _"Where did they slow down during the race?"_

</details>

---

### CompareRunners
`compare_runners`

Compare two runners head-to-head in the same race. Shows placement, time differences, and split-by-split comparison. Both result IDs must be from the same race.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `resultId1` | long | **Yes** | First runner's race result ID |
| `resultId2` | long | **Yes** | Second runner's race result ID |

**Returns:** Both runners' full details, net time difference with faster runner indicated, and split-by-split comparison showing who led at each point.

<details>
<summary>Example prompts</summary>

- _"Compare John Smith and Jane Doe in the marathon."_
- _"Who was faster between result 54321 and 54322?"_
- _"Show a head-to-head comparison of these two runners."_
- _"At which point did runner A pull ahead of runner B?"_

</details>

---

### GetHometownLeaderboard
`get_hometown_leaderboard`

Get the top runners from a specific hometown or region (state/country) within a race. Use `hometown` for exact matches like "Orlando, FL" or use `region` for broader matches like "FL" or "Brazil". Provide either hometown or region, not both.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `raceId` | int | **Yes** | The race ID |
| `hometown` | string | No | Exact hometown to search for (e.g., "Orlando, FL"). Use this OR `region`, not both. |
| `region` | string | No | State code or country name (e.g., "FL", "Brazil"). Use this OR `hometown`, not both. |
| `limit` | int | No | Max results to return (default 20, max 100) |

**Returns:** Ranked list of runners from the specified hometown with their overall placement, times, and pace.

<details>
<summary>Example prompts</summary>

- _"Who were the fastest runners from Orlando, FL in the marathon?"_
- _"Show the hometown leaderboard for Kissimmee, FL."_
- _"How did runners from New York, NY do in this race?"_
- _"Top 10 from my city in the half marathon."_

</details>

---

### GetRunnerPercentile
`get_runner_percentile`

Get a runner's percentile ranking — how they placed relative to all finishers, their gender group, and their age division. A 90th percentile means they finished faster than 90% of runners.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `raceResultId` | long | **Yes** | The race result ID |

**Returns:** Percentile rankings for overall, gender, and division categories with place, total runners, and summary text.

<details>
<summary>Example prompts</summary>

- _"What percentile was runner 54321 in?"_
- _"Was Jane Doe in the top 10%?"_
- _"How does this runner compare to their age group?"_
- _"Show me percentile rankings for this result."_

</details>

---

### GetHometownRegions
`get_hometown_regions`

Get the list of states and countries represented by runners with runner counts broken down by type (runners, push rim, hand cycle, duo). Hometowns follow the format "CITY, REGION" where REGION is a 2-character US state code (e.g., "FL") or a country name (e.g., "Brazil"). US state codes are grouped under "United States".

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `raceId` | int | No | Scope to a single race. Omit or pass 0 for broader scope. |
| `eventId` | int | No | Scope to all races in an event (ignored if `raceId` is set). |

**Returns:** Grouped lists of US states and international countries with city count, total runner count, and per-type breakdown (`runners`, `pushRim`, `handCycle`, `duo`) for each region. Sorted by runner count descending.

<details>
<summary>Example prompts</summary>

- _"What states were represented in the marathon?"_
- _"Which countries had runners in this race?"_
- _"How many runners came from each state in the marathon?"_
- _"Which state had the most runners?"_
- _"How many international runners were there?"_
- _"Show me runner counts by state for the 2024 events."_
- _"How many hand cycle participants came from each state?"_
- _"Were there any push rim athletes from outside the US?"_

</details>

---

### GetHometownCities
`get_hometown_cities`

Get the distinct cities within a state or country with runner counts broken down by type (runners, push rim, hand cycle, duo). Pass a 2-character US state code (e.g., "FL") or country name (e.g., "Brazil") as the region. Use `GetHometownRegions` first to see available regions.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `region` | string | **Yes** | 2-character US state code (e.g., "FL", "NY") or country name (e.g., "Brazil", "Canada") |
| `raceId` | int | No | Scope to a single race. Omit or pass 0 for broader scope. |
| `eventId` | int | No | Scope to all races in an event (ignored if `raceId` is set). |

**Returns:** List of cities with full hometown string, total runner count, and per-type breakdown (`runners`, `pushRim`, `handCycle`, `duo`). Sorted by runner count descending.

<details>
<summary>Example prompts</summary>

- _"What cities in Florida had runners in this race?"_
- _"Show me all the cities from Texas represented in the marathon."_
- _"Which Brazilian cities had runners?"_
- _"How many runners from each city in Florida ran in the marathon?"_
- _"Which Florida city had the most runners?"_
- _"How many duo teams came from Orlando?"_
- _"Show me the runner type breakdown for cities in New York."_

</details>

---

## Tool Chaining

Many tools are designed to be used in sequence. The AI assistant handles this automatically, but understanding the flow helps craft better prompts.

```
ListEvents / GetAvailableYears
  └─► GetRaceDetails (using race ID)
        ├─► SearchResults (find a runner)
        │     └─► GetResultDetails / GetRunnerPercentile / GetRunnerSplitAnalysis
        │           └─► FindRunnerAcrossRaces / CompareRunners / GetClosestResults
        ├─► SearchRunnerByName (find a runner by name across races)
        ├─► QueryRaceResults (top finishers, sort by any field: kills, age, start time, etc.)
        ├─► GetDivisions (age groups)
        ├─► GetRaceStatistics (aggregate stats for one race)
        ├─► GetBulkRaceStatistics (aggregate stats across many races/years)
        ├─► GetRaceWeather (weather conditions)
        ├─► GetHometownRegions (regions + runner counts by type)
        │     └─► GetHometownCities (cities + runner counts by type)
        │           └─► GetHometownLeaderboard
        └─► GetLastStarter (course sweeper)
```

**Example multi-step prompt:**

> _"Find Jane Doe in the 2024 Half Marathon. Show me her split analysis, her percentile ranking, and then compare her against the overall race winner."_

The assistant will:
1. Call `ListEvents` to find the 2024 Half Marathon race ID
2. Call `SearchResults` to find Jane Doe's result ID
3. Call `GetRunnerSplitAnalysis` with her result ID
4. Call `GetRunnerPercentile` with her result ID
5. Call `QueryRaceResults` to find the race winner's result ID
6. Call `CompareRunners` with both result IDs
