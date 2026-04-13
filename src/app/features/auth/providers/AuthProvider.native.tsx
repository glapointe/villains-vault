/**
 * Auth0 Provider for React Native (iOS/Android)
 * 
 * This provider handles authentication for native mobile platforms using
 * react-native-auth0. It manages the OAuth flow, token storage, and user
 * session state using AsyncStorage for persistence.
 * After authentication, fetches user profile from backend API to get isAdmin status.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Auth0 from 'react-native-auth0';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth0Config } from './config';
import { api, setAuthToken, setTokenExpiredHandler } from '../../../services/api';
import { useAnalytics } from '../../analytics/hooks/useAnalytics';
import type { User, AuthContextType } from '../../../models';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Initialize Auth0 client with configuration
 * Wrapped in try-catch to prevent silent failures
 */
let auth0: any;
let auth0InitError: any;

try {
	auth0 = new Auth0({
		domain: auth0Config.domain,
		clientId: auth0Config.clientId,
	});
	console.log('[Auth0] Initialized with domain:', auth0Config.domain);
} catch (error) {
	auth0InitError = error;
	console.error('[Auth0] Initialization failed:', error);
}

/**
 * Decode JWT payload from token string
 * JWTs use base64url encoding (RFC 4648 §5) which replaces '+' with '-' and
 * '/' with '_', and omits padding.  Standard atob() only handles base64
 * (RFC 4648 §4), so we must convert before decoding.
 * @param token - JWT token string
 * @returns Decoded payload object
 */
function decodeJwt(token: string): Record<string, any> {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) {
			throw new Error('Invalid JWT format');
		}
		const payload = parts[1];
		// Convert base64url → base64, then add padding
		const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
		const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
		const decoded = atob(padded);
		return JSON.parse(decoded);
	} catch (error) {
		console.error('[Auth0] Failed to decode JWT:', error);
		return {};
	}
}

/** AsyncStorage keys for persisted session data */
const STORAGE_KEYS = {
	accessToken: 'accessToken',
	refreshToken: 'refreshToken',
	tokenExpiresAt: 'tokenExpiresAt',
	user: 'user',
} as const;

/** Number of milliseconds before expiry at which a proactive refresh is triggered */
const REFRESH_BUFFER_MS = 60_000;

/**
 * Remove all persisted session data from AsyncStorage
 */
async function clearStoredSession(): Promise<void> {
	await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
}

/**
 * Attempt to obtain a new access token using the stored refresh token.
 * Updates AsyncStorage with the new credentials on success.
 * @returns New access token, or null if refresh is not possible / fails
 */
async function tryRefreshToken(): Promise<string | null> {
	try {
		const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.refreshToken);
		if (!refreshToken) {
			console.log('[Auth] No refresh token stored, cannot refresh');
			return null;
		}

		console.log('[Auth] Refreshing access token...');
		const newCredentials = await auth0.auth.refreshToken({ refreshToken });

		await AsyncStorage.setItem(STORAGE_KEYS.accessToken, newCredentials.accessToken);
		const expiresAt = Date.now() + (newCredentials.expiresIn ?? 86400) * 1000;
		await AsyncStorage.setItem(STORAGE_KEYS.tokenExpiresAt, String(expiresAt));

		// Auth0 may rotate the refresh token — persist the new one if provided
		if (newCredentials.refreshToken) {
			await AsyncStorage.setItem(STORAGE_KEYS.refreshToken, newCredentials.refreshToken);
		}

		console.log('[Auth] Token refreshed successfully');
		return newCredentials.accessToken;
	} catch (error) {
		console.error('[Auth] Token refresh failed:', error);
		return null;
	}
}

/**
 * Auth0 Provider Component for Native Platforms
 * Wraps the app to provide authentication context
 */
export function Auth0ProviderNative({ children }: { children: ReactNode }) {
	const [isLoading, setIsLoading] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [user, setUser] = useState<User | null>(null);
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const { identifyUser } = useAnalytics();

	/**
	 * Check for existing authentication on mount
	 */
	useEffect(() => {
		console.log('[AuthProvider] Mounted, auth0InitError:', auth0InitError);
		if (auth0InitError) {
			console.error('[AuthProvider] Auth0 failed to initialize:', auth0InitError);
			setIsLoading(false);
			return;
		}

		// Register a handler so that any mid-session 401 response silently signs the user out
		setTokenExpiredHandler(() => {
			console.log('[Auth] Received 401 from API, clearing expired session');
			setAuthToken(null);
			clearStoredSession();
			setAccessToken(null);
			setUser(null);
			setIsAuthenticated(false);
		});

		checkAuth();

		return () => setTokenExpiredHandler(null);
	}, []);

	/**
	 * Restore authentication state from AsyncStorage and fetch updated profile.
	 * If the stored token is expired (or expiring soon), attempts a silent refresh
	 * using the stored refresh token. If the refresh fails, clears the session so
	 * the user is prompted to log in again.
	 */
	const checkAuth = async () => {
		try {
			let token = await AsyncStorage.getItem(STORAGE_KEYS.accessToken);
			const userStr = await AsyncStorage.getItem(STORAGE_KEYS.user);

			if (token && userStr) {
				// Check whether the token is expired or within the refresh buffer window
				const expiresAtStr = await AsyncStorage.getItem(STORAGE_KEYS.tokenExpiresAt);
				const expiresAt = expiresAtStr ? Number(expiresAtStr) : 0;
				const isExpiredOrExpiring = !expiresAt || Date.now() >= expiresAt - REFRESH_BUFFER_MS;

				if (isExpiredOrExpiring) {
					console.log('[Auth] Stored token expired or expiring soon, attempting silent refresh...');
					const refreshed = await tryRefreshToken();
					if (!refreshed) {
						console.log('[Auth] Silent refresh failed, clearing session');
						await clearStoredSession();
						return;
					}
					token = refreshed;
				}

				setAccessToken(token);
				setAuthToken(token);
				
				// Parse stored user
				const storedUser = JSON.parse(userStr);
				setUser(storedUser);
				setIsAuthenticated(true);
				
				// Fetch fresh user profile from backend API
				try {
				const profile = await api.users.getCurrentUser();
					const updatedUser: User = {
						id: Number(profile.id),
						sub: storedUser.sub,
						email: profile.email,
						name: profile.displayName || storedUser.name,
						picture: storedUser.picture,
						isAdmin: profile.isAdmin,
					};
					setUser(updatedUser);
					await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedUser));

					// Identify user in Clarity on app restart
					identifyUser(updatedUser.sub, {
						email: updatedUser.email,
						name: updatedUser.name,
						isAdmin: updatedUser.isAdmin,
					});
				} catch (error) {
					console.error('[Auth] Error fetching updated profile:', error);
					// Continue with stored user data if API call fails
				}
			}
		} catch (error) {
			console.error('Error checking auth:', error);
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Initiate OAuth login flow with Auth0 Universal Login
	 * Opens system browser for authentication, then redirects back to app
	 * After successful auth, fetches user profile from backend API
	 * @param connection - Optional social provider (google-oauth2, apple, windowslive, facebook)
	 */
	const login = async (connection?: string) => {
		try {
			setIsLoading(true);
			const credentials = await auth0.webAuth.authorize({
				scope: auth0Config.scope,
				audience: auth0Config.audience,
				...(connection && { connection }),
			});

			// Decode JWT to extract user information
			const idTokenPayload = decodeJwt(credentials.idToken);
			console.log('[Auth0] Decoded ID Token Payload:', idTokenPayload);

			// Persist the access token, refresh token, and expiry time
			await AsyncStorage.setItem(STORAGE_KEYS.accessToken, credentials.accessToken);
			const expiresAt = Date.now() + (credentials.expiresIn ?? 86400) * 1000;
			await AsyncStorage.setItem(STORAGE_KEYS.tokenExpiresAt, String(expiresAt));
			if (credentials.refreshToken) {
				await AsyncStorage.setItem(STORAGE_KEYS.refreshToken, credentials.refreshToken);
			}
			setAccessToken(credentials.accessToken);
			setAuthToken(credentials.accessToken);
			
			// Extract basic user info from ID token
			const basicUserInfo: User = {
				sub: idTokenPayload.sub || '',
				email: idTokenPayload.email,
				name: idTokenPayload.name,
				picture: idTokenPayload.picture,
			};

			try {
				// Fetch user profile from backend API (auto-creates user, sets isAdmin)
				const profile = await api.users.getCurrentUser();
				const userInfo: User = {
					id: Number(profile.id),
					sub: basicUserInfo.sub,
					email: profile.email,
					name: profile.displayName || basicUserInfo.name,
					picture: basicUserInfo.picture,
					isAdmin: profile.isAdmin,
				};
				console.log('[Auth0] User profile from API:', userInfo);
				
				await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userInfo));
				setUser(userInfo);
				
				// Identify user in Clarity after successful login
				identifyUser(userInfo.sub, {
					email: userInfo.email,
					name: userInfo.name,
					isAdmin: userInfo.isAdmin,
				});
			} catch (error) {
				console.error('[Auth] Error fetching user profile from API:', error);
				// Fallback to basic user info without backend profile
				await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(basicUserInfo));
				setUser(basicUserInfo);
				
				// Identify user in Clarity even if backend profile fails
				identifyUser(basicUserInfo.sub, {
					email: basicUserInfo.email,
					name: basicUserInfo.name,
				});
			}

			setIsAuthenticated(true);
		} catch (error) {
			console.error('Login error:', error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Re-fetch the user profile from the backend and update user state.
	 * Call this after a profile update to refresh the display name and other fields in the header.
	 */
	const refreshUser = async (): Promise<void> => {
		if (!isAuthenticated) return;
		try {
			const profile = await api.users.getCurrentUser();
			setUser(prev => {
				if (!prev) return prev;
				return {
					...prev,
					name: profile.displayName || prev.name,
					email: profile.email,
					isAdmin: profile.isAdmin,
				};
			});
			// Keep AsyncStorage in sync
			const userStr = await AsyncStorage.getItem(STORAGE_KEYS.user);
			if (userStr) {
				const storedUser = JSON.parse(userStr);
				const updatedUser = {
					...storedUser,
					name: profile.displayName || storedUser.name,
					email: profile.email,
					isAdmin: profile.isAdmin,
				};
				await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedUser));
			}
		} catch (error) {
			console.error('[Auth] Error refreshing user profile:', error);
		}
	};

	/**
	 * Clear session and log out user
	 * Clears both Auth0 session and local storage
	 */
	const logout = async () => {
		try {
			// Clear API token
			setAuthToken(null);

			await auth0.webAuth.clearSession();
			await clearStoredSession();

			setAccessToken(null);
			setUser(null);
			setIsAuthenticated(false);
		} catch (error) {
			console.error('Logout error:', error);
		}
	};

	return (
		<AuthContext.Provider value={{ isLoading, isAuthenticated, user, accessToken, login, logout, isAdmin: user?.isAdmin ?? false, refreshUser }}>
			{children}
		</AuthContext.Provider>
	);
}

/**
 * Hook to access authentication context
 * Must be used within Auth0ProviderNative
 */
export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within Auth0Provider');
	}
	return context;
}
