/**
 * Cache Bypass Utility
 * 
 * Utilities for managing server cache bypass state in local storage.
 * Used by administrators to force fresh data retrieval from the server.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const CACHE_BYPASS_KEY = '@v3:bypassServerCache';

/**
 * Get the current cache bypass state from storage
 * @returns Promise resolving to true if cache should be bypassed, false otherwise
 */
export async function getCacheBypassEnabled(): Promise<boolean> {
	try {
		if (Platform.OS === 'web') {
			// Use localStorage on web
			const value = localStorage.getItem(CACHE_BYPASS_KEY);
			return value === 'true';
		} else {
			// Use AsyncStorage on native
			const value = await AsyncStorage.getItem(CACHE_BYPASS_KEY);
			return value === 'true';
		}
	} catch (error) {
		console.error('Error reading cache bypass state:', error);
		return false;
	}
}

/**
 * Set the cache bypass state in storage
 * @param enabled - Whether to bypass server cache
 */
export async function setCacheBypassEnabled(enabled: boolean): Promise<void> {
	try {
		const value = enabled.toString();
		if (Platform.OS === 'web') {
			// Use localStorage on web
			localStorage.setItem(CACHE_BYPASS_KEY, value);
		} else {
			// Use AsyncStorage on native
			await AsyncStorage.setItem(CACHE_BYPASS_KEY, value);
		}
	} catch (error) {
		console.error('Error saving cache bypass state:', error);
	}
}
