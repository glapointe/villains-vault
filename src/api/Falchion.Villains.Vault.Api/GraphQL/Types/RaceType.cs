using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.GraphQL.Types;

/// <summary>GraphQL type configuration for Race.</summary>
public class RaceType : ObjectType<Race>
{
    protected override void Configure(IObjectTypeDescriptor<Race> descriptor)
    {
        // Hide the Notes field as we're not yet sure how we want to use it in the UI, and we don't want to expose it until we have a clear plan for it.
        descriptor.Field(r => r.Notes).Ignore();

        // Hide the Results field as we don't want the user to be able to accidentally pull in a large number of results.
        descriptor.Field(r => r.Results).Ignore();

        // Jobs are an internal implementation detail that we don't want to expose in the GraphQL API, so we'll ignore them for now. We may want to expose them in the future if we decide to add a UI for managing background jobs, but for now we'll keep them hidden.
        descriptor.Field(r => r.Jobs).Ignore();
    }
}