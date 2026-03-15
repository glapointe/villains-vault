/**
 * User profile from backend API
 */
export interface UserProfile {
	id: number;
	email: string;
	displayName?: string;
	subjectId?: string;
	isAdmin: boolean;
	createdAt: string;
}

/**
 * Request to update a user as admin
 */
export interface UpdateUserRequest {
	email?: string;
	displayName?: string;
	isAdmin?: boolean;
}

/**
 * Request for a user to update their own profile.
 * Email cannot be changed by the user themselves (admin only).
 */
export interface UpdateOwnProfileRequest {
	displayName?: string;
}

/**
 * Sort fields available for user management grid
 */
export type UserSortField = 'email' | 'displayName' | 'subjectId' | 'isAdmin' | 'createdAt';
