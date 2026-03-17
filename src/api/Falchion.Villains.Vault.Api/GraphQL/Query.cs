using Falchion.Villains.Vault.Api.Data;
using Falchion.Villains.Vault.Api.Data.Entities;
using HotChocolate.Data;
using HotChocolate.Types;

namespace Falchion.Villains.Vault.Api.GraphQL;

/// <summary>Query root for GraphQL endpoint.</summary>
public class Query
{
    /// <summary>Returns a paged list of races. Maximum 100 per page.</summary>
    [UseOffsetPaging(MaxPageSize = 100, DefaultPageSize = 25, IncludeTotalCount = true)]
    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Race> GetRaces([Service] ApplicationDbContext context) =>
        context.Races;

    /// <summary>Returns a paged list of events. Maximum 100 per page.</summary>
    [UseOffsetPaging(MaxPageSize = 100, DefaultPageSize = 25, IncludeTotalCount = true)]
    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Event> GetEvents([Service] ApplicationDbContext context) =>
        context.Events;

    /// <summary>Returns a paged list of race results. Maximum 500 per page.</summary>
    [UseOffsetPaging(MaxPageSize = 500, DefaultPageSize = 50, IncludeTotalCount = true)]
    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<RaceResult> GetRaceResults([Service] ApplicationDbContext context) =>
        context.RaceResults;
}