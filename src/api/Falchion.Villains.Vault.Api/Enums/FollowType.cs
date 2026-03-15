namespace Falchion.Villains.Vault.Api.Enums;

/// <summary>
/// Represents the type of follow a user has on a race result.
/// </summary>
public enum FollowType
{
	/// <summary>
	/// User is interested in tracking this result (e.g., friend, family member).
	/// </summary>
	Interested = 0,

	/// <summary>
	/// User is claiming ownership of this result (i.e., it is their own race result).
	/// </summary>
	Claimed = 1
}
