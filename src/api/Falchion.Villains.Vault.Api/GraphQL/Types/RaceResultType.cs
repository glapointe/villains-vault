using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.GraphQL.Types;

/// <summary>GraphQL type configuration for Race.</summary>
public class RaceResultType : ObjectType<RaceResult>
{
    protected override void Configure(IObjectTypeDescriptor<RaceResult> descriptor)
    {
        // Hide the Race field as we don't want to pull in the entire Race object when querying for RaceResults.
        descriptor.Field(r => r.Race).Ignore();
    }
}