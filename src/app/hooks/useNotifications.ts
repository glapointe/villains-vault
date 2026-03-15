/**
 * useNotifications Hook
 * 
 * Provides notification preference management for the current user.
 * Fetches and updates preferences via the notifications API.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { NotificationPreference } from '../models';

interface UseNotificationsReturn {
	/** Current notification preferences (null while loading) */
	preferences: NotificationPreference | null;
	/** Whether preferences are being loaded */
	loading: boolean;
	/** Error message if loading/updating failed */
	error: string | null;
	/** Update a single preference by key */
	updatePreference: (
		key: keyof NotificationPreference,
		value: boolean
	) => Promise<void>;
	/** Refresh preferences from the server */
	refresh: () => Promise<void>;
}

/**
 * Hook for managing notification preferences
 */
export function useNotifications(): UseNotificationsReturn {
	const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchPreferences = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const prefs = await api.notifications.getPreferences();
			setPreferences(prefs);
		} catch (err) {
			console.error('[useNotifications] Failed to fetch preferences:', err);
			setError('Failed to load notification preferences');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPreferences();
	}, [fetchPreferences]);

	const updatePreference = useCallback(
		async (key: keyof NotificationPreference, value: boolean) => {
			if (!preferences) return;

			const updated = { ...preferences, [key]: value };

			// Optimistic update
			setPreferences(updated);

			try {
				setError(null);
				const result = await api.notifications.updatePreferences(updated);
				setPreferences(result);
			} catch (err) {
				console.error('[useNotifications] Failed to update preference:', err);
				// Rollback
				setPreferences(preferences);
				setError('Failed to update notification preference');
			}
		},
		[preferences]
	);

	return {
		preferences,
		loading,
		error,
		updatePreference,
		refresh: fetchPreferences,
	};
}
