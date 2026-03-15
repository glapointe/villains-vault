/**
 * Debug Utilities
 * 
 * Development-only utilities for testing and debugging.
 * These are primarily useful during development to avoid repeated auth flows.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Clear all authentication data from device storage
 * Useful for testing authentication flows without uninstalling the app
 * Run in console: window.__DEBUG__.clearAuth()
 */
export async function clearAuth() {
	try {
		await AsyncStorage.removeItem('accessToken');
		await AsyncStorage.removeItem('user');
		console.log('[DEBUG] Authentication cache cleared');
		return true;
	} catch (error) {
		console.error('[DEBUG] Failed to clear auth cache:', error);
		return false;
	}
}

/**
 * Clear all AsyncStorage data
 * Useful for testing fresh app state
 * Run in console: window.__DEBUG__.clearAllStorage()
 */
export async function clearAllStorage() {
	try {
		await AsyncStorage.clear();
		console.log('[DEBUG] All storage cleared');
		return true;
	} catch (error) {
		console.error('[DEBUG] Failed to clear storage:', error);
		return false;
	}
}

/**
 * Get current stored user data
 * Run in console: window.__DEBUG__.getStoredUser()
 */
export async function getStoredUser() {
	try {
		const userStr = await AsyncStorage.getItem('user');
		const user = userStr ? JSON.parse(userStr) : null;
		console.log('[DEBUG] Stored user:', user);
		return user;
	} catch (error) {
		console.error('[DEBUG] Failed to get stored user:', error);
		return null;
	}
}

/**
 * Get current stored token
 * Run in console: window.__DEBUG__.getStoredToken()
 */
export async function getStoredToken() {
	try {
		const token = await AsyncStorage.getItem('accessToken');
		console.log('[DEBUG] Stored token exists:', !!token);
		if (token) {
			console.log('[DEBUG] Token (first 50 chars):', token.substring(0, 50) + '...');
		}
		return token;
	} catch (error) {
		console.error('[DEBUG] Failed to get stored token:', error);
		return null;
	}
}

/**
 * Export all debug utilities as a global object
 * Makes them accessible from the console during development
 */
if (__DEV__) {
	// @ts-ignore - Global namespace extension for debugging
	globalThis.__DEBUG__ = {
		clearAuth,
		clearAllStorage,
		getStoredUser,
		getStoredToken,
	};
}
