# GraphQL API

Villains Vault exposes a GraphQL API that lets you query race events, races, and runner results with precise field selection, filtering, sorting, and pagination — all in a single request.

## What is GraphQL?

GraphQL is a query language for APIs that gives clients full control over the data they receive. Unlike REST, where each endpoint returns a fixed shape of data, a GraphQL query lets you specify exactly the fields you want and combine multiple objects in a single round trip.

Key differences from REST:
- **Single endpoint** — all queries go to `/api/graphql`
- **No over-fetching** — you only receive the fields you ask for
- **No under-fetching** — related data can be included in one query
- **Self-documenting** — the schema is always available through introspection

---

## Endpoints

| Purpose | URL |
|---|---|
| API endpoint | `https://vault.villains.run/api/graphql` |
| Interactive UI explorer | `https://vault.villains.run/api/graphql/ui` |
| Local development | `https://localhost:5001/api/graphql` |
| Local UI explorer | `https://localhost:5001/api/graphql/ui` |

---

## Using the UI Explorer (Nitro)

Navigate to the UI explorer URL above. The explorer provides:
- **Schema browser** — explore all types, fields, and descriptions in the left panel
- **Query editor** — write queries with IntelliSense autocomplete
- **Variables panel** — pass query variables in JSON
- **Response viewer** — formatted JSON output with timing information
- **History** — saved queries from previous sessions

---

## Exposed Objects

### `Event`

A runDisney event weekend (e.g., "Walt Disney World Marathon Weekend 2025"). An event groups multiple races together.

| Field | Type | Description |
|---|---|---|
| `id` | `Int!` | Unique identifier |
| `name` | `String!` | Event name (e.g., "Walt Disney World Marathon Weekend 2025") |
| `trackShackUrl` | `String!` | Source URL on Track Shack |
| `eventSeries` | `EventSeries!` | Series enum: `DisneyWorldMarathon`, `DisneyWorldPrincess`, `DisneyWorldWineAndDine`, `DisneyWorldSpringtime`, `DisneylandHalfMarathon`, `DisneylandHalloween`, `Unknown` |
| `createdAt` | `DateTime!` | When this record was created |
| `modifiedAt` | `DateTime!` | When this record was last updated |
| `races` | `[Race!]!` | Races belonging to this event |

---

### `Race`

A specific race within an event (e.g., "Half Marathon", "10K").

| Field | Type | Description |
|---|---|---|
| `id` | `Int!` | Unique identifier |
| `eventId` | `Int!` | Parent event ID |
| `name` | `String!` | Race name (e.g., "Half Marathon") |
| `raceDate` | `DateTime!` | Date the race took place |
| `distance` | `RaceDistance!` | Distance enum: `FiveK`, `TenK`, `TenMile`, `HalfMarathon`, `FullMarathon` |
| `trackShackUrl` | `String!` | Source URL on Track Shack |
| `metadataJson` | `String!` | JSON with split time labels and distances |
| `weatherDataJson` | `String` | JSON with weather data from Open-Meteo (null if not yet fetched) |
| `statisticsJson` | `String` | JSON with pre-calculated race statistics |
| `createdAt` | `DateTime!` | When this record was created |
| `modifiedAt` | `DateTime!` | When this record was last updated |
| `event` | `Event!` | Parent event |
| `divisions` | `[Division!]!` | Divisions defined for this race |

---

### `RaceResult`

A single runner's result for a race, sourced from Track Shack timing data.

| Field | Type | Description |
|---|---|---|
| `id` | `Long!` | Unique identifier |
| `raceId` | `Int!` | Race this result belongs to |
| `divisionId` | `Int!` | Division this runner competed in |
| `bibNumber` | `Int!` | Runner's bib number |
| `name` | `String!` | Runner's name |
| `age` | `Int!` | Runner's age at time of race |
| `gender` | `Gender!` | `Male`, `Female`, or `Unknown` |
| `runnerType` | `RunnerType!` | `Runner`, `PushRim`, `HandCycle`, or `Duo` |
| `overallPlace` | `Int` | Overall finish position |
| `genderPlace` | `Int` | Finish position within gender |
| `divisionPlace` | `Int` | Finish position within age/gender division |
| `netTime` | `TimeSpan` | Chip time (start mat to finish) |
| `clockTime` | `TimeSpan` | Gun time (official start to finish) |
| `startTime` | `TimeSpan` | Effective start offset from gun |
| `overallPace` | `TimeSpan` | Average pace per mile |
| `hometown` | `String` | Runner's listed hometown |
| `passes` | `Int` | Runners this runner passed during the race |
| `passers` | `Int` | Runners who passed this runner during the race |
| `split1`–`split10` | `TimeSpan` | Individual split times (labels defined in `Race.metadataJson`) |
| `createdAt` | `DateTime!` | When this record was created |
| `modifiedAt` | `DateTime!` | When this record was last updated |
| `division` | `Division!` | Division details |

---

## Pagination

All three root queries use **offset pagination**. Every query returns a collection segment with:

```graphql
{
  items { ... }        # The records for this page
  pageInfo {
    hasNextPage
    hasPreviousPage
  }
  totalCount           # Total matching records across all pages
}
```

**Arguments:**

| Argument | Description | Default | Maximum |
|---|---|---|---|
| `skip` | Number of records to skip | `0` | — |
| `take` | Number of records to return | `25` (events/races), `50` (results) | `100` (events/races), `500` (results) |

---

## Filtering

All queries support field-level filtering using `where`. Filters compose with `and` / `or` / `not`.

**Common filter operators:**

| Operator | Meaning |
|---|---|
| `eq` | Equals |
| `neq` | Not equals |
| `gt` / `gte` | Greater than / greater than or equal |
| `lt` / `lte` | Less than / less than or equal |
| `contains` | String contains (case-insensitive) |
| `startsWith` | String starts with |
| `in` | Value is in a list |

---

## Sorting

All queries support `order` with `ASC` or `DESC` direction on any field:

```graphql
races(order: { raceDate: DESC })
```

Multiple sort keys are supported:

```graphql
raceResults(order: [{ overallPlace: ASC }, { name: ASC }])
```

---

## Example Queries

### List all events

```graphql
{
  events(take: 10) {
    items {
      id
      name
      eventSeries
    }
    totalCount
  }
}
```

---

### List events by series with pagination

```graphql
{
  events(
    where: { eventSeries: { eq: DISNEY_WORLD_MARATHON } }
    order: { createdAt: DESC }
    take: 25
    skip: 0
  ) {
    items {
      id
      name
      eventSeries
      createdAt
      races {
        id
        name
        distance
        raceDate
      }
    }
    totalCount
    pageInfo {
      hasNextPage
    }
  }
}
```

---

### Find a specific race by ID

```graphql
{
  races(where: { id: { eq: 42 } }) {
    items {
      id
      name
      distance
      raceDate
      event {
        name
        eventSeries
      }
    }
  }
}
```

---

### Get the top 10 finishers in a race

```graphql
{
  raceResults(
    where: { raceId: { eq: 42 }, runnerType: { eq: RUNNER } }
    order: { overallPlace: ASC }
    take: 10
  ) {
    items {
      overallPlace
      name
      age
      gender
      netTime
      overallPace
      hometown
      division {
        divisionLabel
      }
    }
    totalCount
  }
}
```

---

### Search for a runner by name across all races

```graphql
{
  raceResults(
    where: { name: { contains: "Smith" } }
    order: [{ raceId: ASC }, { overallPlace: ASC }]
    take: 50
  ) {
    items {
      raceId
      name
      age
      gender
      overallPlace
      netTime
      overallPace
    }
    totalCount
  }
}
```

---

### Female runners under 30 from a specific race, sorted by pace

```graphql
{
  raceResults(
    where: {
      and: [
        { raceId: { eq: 42 } }
        { gender: { eq: FEMALE } }
        { age: { lt: 30 } }
        { runnerType: { eq: RUNNER } }
      ]
    }
    order: { overallPace: ASC }
    take: 25
  ) {
    items {
      overallPlace
      genderPlace
      divisionPlace
      name
      age
      netTime
      overallPace
      hometown
    }
    totalCount
  }
}
```

---

### Results with split times

```graphql
{
  raceResults(
    where: { raceId: { eq: 42 } }
    order: { overallPlace: ASC }
    take: 25
  ) {
    items {
      overallPlace
      name
      netTime
      split1
      split2
      split3
      split4
      passes
      passers
    }
  }
}
```

---

## Protections

The API has several protections to prevent abuse:

| Protection | Limit |
|---|---|
| Rate limiting | 60 requests/minute per client |
| Max page size | 100 (events/races), 500 (results) |
| Max query depth | 10 levels of nesting |
| Cost analysis | Enabled (IBM spec), rejects excessively expensive queries |
