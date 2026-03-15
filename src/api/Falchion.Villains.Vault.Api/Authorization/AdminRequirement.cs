using Microsoft.AspNetCore.Authorization;

namespace Falchion.Villains.Vault.Api.Authorization;

/// <summary>
/// Authorization requirement that checks if the user is an admin.
/// </summary>
public class AdminRequirement : IAuthorizationRequirement
{
	// Marker class - no additional properties needed
}
