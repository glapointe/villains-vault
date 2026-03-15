/**
 * User profile from Auth0 and backend
 */
export interface User {
	id?: number;
	sub: string;
	email?: string;
	name?: string;
	picture?: string;
	isAdmin?: boolean;
}
