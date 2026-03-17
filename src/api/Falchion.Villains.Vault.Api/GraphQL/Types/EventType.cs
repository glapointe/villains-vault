using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.GraphQL.Types;

/// <summary>GraphQL type configuration for Event.</summary>
public class EventType : ObjectType<Event>
{
    protected override void Configure(IObjectTypeDescriptor<Event> descriptor)
    {
        // Hide the SubmittedByUserId field from the GraphQL schema, as it's not needed by clients.
        descriptor.Field(e => e.SubmittedByUserId).Ignore();
        descriptor.Field(e => e.SubmittedBy).Ignore();
    }
}