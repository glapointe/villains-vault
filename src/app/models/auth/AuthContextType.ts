import { User } from './User';

/**
 * Authentication context type
 */
export interface AuthContextType {
	isLoading: boolean;
	isAuthenticated: boolean;
	user: User | null;
	accessToken: string | null;
	/**
	 * Initiates the authentication flow
	 * @param connection - Optional social provider identifier (google-oauth2, apple, windowslive)
	 */
	login: (connection?: string) => Promise<void>;
	logout: () => Promise<void>;
	/**
	 * Check if current user is an administrator
	 */
	isAdmin: boolean;
	/**
	 * Re-fetch the user profile from the backend and refresh auth state.
	 * Use after a successful profile update so the header/avatar reflects the new display name.
	 */
	refreshUser?: () => Promise<void>;
}
