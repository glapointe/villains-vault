/**
 * Notifications API
 * 
 * Handles push token registration/unregistration and notification preference CRUD.
 */

import { apiClient } from './client';
import type {
	NotificationPreference,
	UpdateNotificationPreferenceRequest,
	RegisterPushTokenRequest,
	UnregisterPushTokenRequest,
} from '../../models';

export const notificationsApi = {
	/**
	 * Register a push token for the current user's device
	 */
	registerPushToken: async (request: RegisterPushTokenRequest): Promise<void> => {
		await apiClient.post('/api/v1.0/users/me/push-tokens', request);
	},

	/**
	 * Unregister a push token (e.g., on logout)
	 */
	unregisterPushToken: async (request: UnregisterPushTokenRequest): Promise<void> => {
		await apiClient.delete('/api/v1.0/users/me/push-tokens', { data: request });
	},

	/**
	 * Get the current user's notification preferences
	 */
	getPreferences: async (): Promise<NotificationPreference> => {
		const response = await apiClient.get<NotificationPreference>(
			'/api/v1.0/users/me/notifications/preferences'
		);
		return response.data;
	},

	/**
	 * Update the current user's notification preferences
	 */
	updatePreferences: async (
		request: UpdateNotificationPreferenceRequest
	): Promise<NotificationPreference> => {
		const response = await apiClient.put<NotificationPreference>(
			'/api/v1.0/users/me/notifications/preferences',
			request
		);
		return response.data;
	},
};
