/**
 * Auth0 Provider for Web Platform
 * 
 * This provider handles authentication for web using @auth0/auth0-react.
 * It wraps the official Auth0 React SDK and provides a unified interface
 * that matches the native provider for consistency across platforms.
 * After authentication, fetches user profile from backend API to get isAdmin status.
 */

import React, { ReactNode, useEffect, useState } from 'react';
import { Auth0Provider as Auth0ProviderWeb, useAuth0 } from '@auth0/auth0-react';
import { auth0Config } from './config';
import { api, setAuthToken } from '../../../services/api';
import { useAnalytics } from '../../analytics/hooks/useAnalytics';
import type { User } from '../../../models';

interface Auth0ProviderProps {
	children: ReactNode;
}

/**
 * Web-specific Auth0 Provider wrapper
 * Configures Auth0Provider with application settings
 */
export function Auth0ProviderWebWrapper({ children }: Auth0ProviderProps) {
	return (
		<Auth0ProviderWeb
			domain={auth0Config.domain}
			clientId={auth0Config.clientId}
			authorizationParams={{
				redirect_uri: auth0Config.redirectUri,
				audience: auth0Config.audience,
				scope: auth0Config.scope,
			}}
			useRefreshTokens={true}
			useRefreshTokensFallback={true}
			cacheLocation="localstorage"
		>
			{children}
		</Auth0ProviderWeb>
	);
}

/**
 * Module-level cache for the backend user profile.
 * Shared across all hook instances so only one API call is made per session.
 * Cleared on logout and after a profile edit (refreshUser).
 */
let cachedUserProfile: User | null = null;

/**
 * In-flight fetch promise, deduplicated so concurrent hook instances don't all
 * fire their own request when mounting at the same time.
 */
let profileFetchPromise: Promise<User> | null = null;

/** Clears the profile cache (call on logout or after profile update). */
export function clearUserProfileCache(): void {
	cachedUserProfile = null;
	profileFetchPromise = null;
}

/**
 * Unified authentication hook for web
 * Adapts Auth0's useAuth0 hook to match the native provider's interface
 * Fetches user profile from backend API to get isAdmin status
 */
export function useAuth() {
	const {
		isLoading: auth0Loading,
		isAuthenticated,
		user: auth0User,
		loginWithRedirect,
		logout: auth0Logout,
		getAccessTokenSilently,
		error: auth0Error,
	} = useAuth0();

	const [accessToken, setAccessToken] = useState<string | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [isLoadingProfile, setIsLoadingProfile] = useState(false);
	const { identifyUser } = useAnalytics();

	// Log Auth0 errors; attempt silent recovery on PKCE state-mismatch errors.
	// A state mismatch occurs on mobile when Android's Custom Tab / intent
	// handling opens the social provider in a new browser tab — the callback
	// lands in that new tab which has no PKCE state in sessionStorage, so
	// Auth0 throws "Invalid state" even though auth succeeded. Calling
	// getAccessTokenSilently uses refresh-token rotation / hidden iframe to
	// recover the session without a new redirect.
	useEffect(() => {
		if (!auth0Error) return;

		const msg = auth0Error.message?.toLowerCase() ?? '';
		const isStateMismatch =
			msg.includes('invalid state') ||
			msg.includes('missing transaction') ||
			msg.includes('state mismatch');

		if (isStateMismatch) {
			console.warn('[Auth] PKCE state mismatch — cross-tab callback detected, attempting silent recovery:', auth0Error.message);
			getAccessTokenSilently()
				.then((token) => {
					if (token) {
						setAccessToken(token);
						setAuthToken(token);
						console.info('[Auth] Silent recovery succeeded.');
						// Clean up the callback params left in the URL
						if (window.history.replaceState) {
							window.history.replaceState({}, document.title, window.location.pathname);
						}
					}
				})
				.catch((silentError) => {
					console.warn('[Auth] Silent recovery failed — user will need to log in again:', silentError);
				});
		} else {
			console.error('[Auth] Auth0 error:', auth0Error);
		}
	}, [auth0Error, getAccessTokenSilently]);

	/**
	 * Fetch access token and user profile when authenticated
	 */
	useEffect(() => {
		if (isAuthenticated && auth0User) {
			const fetchUserProfile = async () => {
				try {
					setIsLoadingProfile(true);

					// Get access token from Auth0 (Auth0 caches this internally)
					const token = await getAccessTokenSilently();
					setAccessToken(token);
					setAuthToken(token);

					// Use cached profile when available to avoid redundant API calls
					if (cachedUserProfile) {
						setUser(cachedUserProfile);
						return;
					}

					// Deduplicate concurrent requests from multiple hook instances
					// mounting at the same time
					if (!profileFetchPromise) {
						profileFetchPromise = api.users.getCurrentUser().then(profile => {
							const userProfile: User = {
								id: profile.id,
								sub: auth0User.sub || '',
								email: profile.email,
								name: profile.displayName || auth0User.name,
								picture: auth0User.picture,
								isAdmin: profile.isAdmin,
							};
							cachedUserProfile = userProfile;
							return userProfile;
						});
					}

					// Await the shared promise (may already be resolving for other instances)
					const userProfile = await profileFetchPromise;
					setUser(userProfile);

					// Identify user in Clarity for session tracking
					identifyUser(userProfile.sub, {
						email: userProfile.email,
						name: userProfile.name,
						isAdmin: userProfile.isAdmin,
					});
				} catch (error) {
					// Clear the failed promise so the next mount can retry
					profileFetchPromise = null;
					console.error('[Auth] Error fetching user profile:', error);
					// Fallback to Auth0 user data without backend profile
					const fallbackUser: User = {
						sub: auth0User.sub || '',
						email: auth0User.email,
						name: auth0User.name,
						picture: auth0User.picture,
						isAdmin: false,
					};
					setUser(fallbackUser);
					// Identify user in Clarity even if backend profile fails
					identifyUser(fallbackUser.sub, {
						email: fallbackUser.email,
						name: fallbackUser.name,
					});
				} finally {
					setIsLoadingProfile(false);
				}
			};

			fetchUserProfile();
		} else if (!isAuthenticated) {
			// Clear cache and user data when not authenticated
			clearUserProfileCache();
			setUser(null);
			setAccessToken(null);
			setAuthToken(null);
		}
	}, [isAuthenticated, auth0User, getAccessTokenSilently]);

	/**
	 * Re-fetch the user profile from the backend and update user state.
	 * Call this after a profile update to refresh the display name and other fields in the header.
	 */
	const refreshUser = async (): Promise<void> => {
		if (!isAuthenticated || !auth0User) return;
		try {
			const token = accessToken ?? await getAccessTokenSilently();
			setAuthToken(token);
			// Clear stale cache before re-fetching so all hook instances pick up
			// the updated profile on their next render cycle
			clearUserProfileCache();
			const profile = await api.users.getCurrentUser();
			const updated: User = {
				sub: auth0User.sub || '',
				email: profile.email,
				name: profile.displayName || user?.name || auth0User.name,
				picture: auth0User.picture,
				isAdmin: profile.isAdmin,
			};
			// Populate cache with the fresh data
			cachedUserProfile = updated;
			setUser(updated);
		} catch (error) {
			console.error('[Auth] Error refreshing user profile:', error);
		}
	};

	/**
	 * Initiate login flow using Auth0 Universal Login.
	 * @param connection - Optional social provider (google-oauth2, apple, windowslive, facebook)
	 *
	 * `openUrl` is set to `window.location.replace` to keep navigation in the
	 * current tab. Without this, mobile browsers (Chrome on Android/iOS) can
	 * treat the navigation as a popup and open a new tab once the async PKCE
	 * preparation causes the user-gesture context to expire.
	 *
	 * PKCE state-mismatch errors (e.g. Android Custom Tab opening a social
	 * provider in a new tab so the callback lands without sessionStorage state)
	 * are handled by the `auth0Error` effect above via `getAccessTokenSilently`.
	 */
	const login = async (connection?: string) => {
		await loginWithRedirect({
			authorizationParams: {
				...(connection && { connection }),
			},
			openUrl: (url) => window.location.replace(url),
		});
	};

	/**
	 * Log out and redirect to home page
	 */
	const logout = async () => {
		// Clear API token and profile cache
		setAuthToken(null);
		clearUserProfileCache();
		
		await auth0Logout({ 
			logoutParams: { 
				returnTo: typeof window !== 'undefined' ? window.location.origin : undefined 
			} 
		});
	};

	return {
		isLoading: auth0Loading || isLoadingProfile || (isAuthenticated && !accessToken),
		isAuthenticated,
		user,
		accessToken,
		login,
		logout,
		isAdmin: user?.isAdmin ?? false,
		refreshUser,
	};
}
