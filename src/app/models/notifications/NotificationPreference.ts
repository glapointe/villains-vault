/**
 * Notification preference settings from backend API
 */
export interface NotificationPreference {
	raceResults: boolean;
	dlsDeclarations: boolean;
	communityEvents: boolean;
}

/**
 * Request to update notification preferences
 */
export interface UpdateNotificationPreferenceRequest {
	raceResults: boolean;
	dlsDeclarations: boolean;
	communityEvents: boolean;
}
