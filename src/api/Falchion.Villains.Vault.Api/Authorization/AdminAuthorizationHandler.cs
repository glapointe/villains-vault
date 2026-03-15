using Microsoft.AspNetCore.Authorization;
using Falchion.Villains.Vault.Api.Repositories;
using System.Security.Claims;

namespace Falchion.Villains.Vault.Api.Authorization;

/// <summary>
/// Authorization handler that checks if the current user is an admin by querying the database.
/// </summary>
public class AdminAuthorizationHandler : AuthorizationHandler<AdminRequirement>
{
	private readonly IServiceProvider _serviceProvider;

	public AdminAuthorizationHandler(IServiceProvider serviceProvider)
	{
		_serviceProvider = serviceProvider;
	}

	protected override async Task HandleRequirementAsync(
		AuthorizationHandlerContext context,
		AdminRequirement requirement)
	{
		// Get the subject ID from claims
		var subjectId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
			?? context.User.FindFirst("sub")?.Value;

		if (string.IsNullOrEmpty(subjectId))
		{
			return;
		}

		// Create a scope to get scoped services
		using var scope = _serviceProvider.CreateScope();
		var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();

		// Check if user is admin
		var user = await userRepository.GetBySubjectIdAsync(subjectId);
		if (user?.IsAdmin == true)
		{
			context.Succeed(requirement);
		}
	}
}
