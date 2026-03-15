/**
 * Chat Session ID Utility
 *
 * Generates and persists a unique session ID for anonymous chat users.
 * Used as the key for server-side thread caching and rate limiting
 * when no authenticated user is available.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'villains_vault_chat_session_id';

/** Generate a UUID v4 (browser-compatible). */
function generateId(): string {
	// Use crypto.randomUUID if available (modern browsers)
	if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
		return (crypto as any).randomUUID();
	}
	// Fallback for older environments
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/** Get or create a persistent chat session ID. */
export async function getChatSessionId(): Promise<string> {
	try {
		if (Platform.OS === 'web') {
			let id = localStorage.getItem(STORAGE_KEY);
			if (!id) {
				id = generateId();
				localStorage.setItem(STORAGE_KEY, id);
			}
			return id;
		}

		// Native: use AsyncStorage
		let id = await AsyncStorage.getItem(STORAGE_KEY);
		if (!id) {
			id = generateId();
			await AsyncStorage.setItem(STORAGE_KEY, id);
		}
		return id;
	} catch {
		// If storage fails, generate a transient ID (won't persist across sessions)
		return generateId();
	}
}

/** Clear the stored session ID (e.g., on explicit logout or data reset). */
export async function clearChatSessionId(): Promise<void> {
	try {
		if (Platform.OS === 'web') {
			localStorage.removeItem(STORAGE_KEY);
		} else {
			await AsyncStorage.removeItem(STORAGE_KEY);
		}
	} catch {
		// Ignore storage errors
	}
}
