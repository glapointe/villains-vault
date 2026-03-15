/**
 * Follow Type Enum
 * 
 * Represents the type of follow a user has on a race result.
 * Values match the backend API enum values.
 */
export enum FollowType {
	/** User is interested in tracking this result (friend, family, etc.) */
	Interested = 0,
	/** User is claiming ownership of this result (their own race result) */
	Claimed = 1,
}

/**
 * Get display label for a follow type
 */
export function getFollowTypeLabel(type: FollowType): string {
	switch (type) {
		case FollowType.Interested:
			return 'Following';
		case FollowType.Claimed:
			return 'My Result';
		default:
			return 'Unknown';
	}
}
