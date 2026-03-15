/**
 * Pending Action Utility
 *
 * Stores a user's pending action (e.g., chat prompt) before an auth redirect
 * so it can be restored after login. Uses localStorage (web) or AsyncStorage (native).
 * Actions expire after 5 minutes to prevent stale state.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PendingChatAction } from '../models/chat';

const STORAGE_KEY = 'villains_vault_pending_chat_action';
const EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/** Store a pending chat action before redirecting to login. */
export async function setPendingChatAction(action: PendingChatAction): Promise<void> {
	const data = JSON.stringify(action);
	try {
		if (Platform.OS === 'web') {
			localStorage.setItem(STORAGE_KEY, data);
		} else {
			await AsyncStorage.setItem(STORAGE_KEY, data);
		}
	} catch {
		// Ignore storage errors — worst case user re-types their prompt
	}
}

/**
 * Retrieve and consume (clear) the pending chat action.
 * Returns null if no action exists or if it has expired.
 */
export async function consumePendingChatAction(): Promise<PendingChatAction | null> {
	try {
		let data: string | null = null;

		if (Platform.OS === 'web') {
			data = localStorage.getItem(STORAGE_KEY);
			localStorage.removeItem(STORAGE_KEY);
		} else {
			data = await AsyncStorage.getItem(STORAGE_KEY);
			await AsyncStorage.removeItem(STORAGE_KEY);
		}

		if (!data) return null;

		const action: PendingChatAction = JSON.parse(data);

		// Check if expired
		if (Date.now() - action.timestamp > EXPIRY_MS) {
			return null;
		}

		return action;
	} catch {
		return null;
	}
}

/** Clear any pending chat action without consuming it. */
export async function clearPendingChatAction(): Promise<void> {
	try {
		if (Platform.OS === 'web') {
			localStorage.removeItem(STORAGE_KEY);
		} else {
			await AsyncStorage.removeItem(STORAGE_KEY);
		}
	} catch {
		// Ignore
	}
}
