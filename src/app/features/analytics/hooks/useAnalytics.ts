/**
 * Analytics Hook
 * 
 * Provides a unified interface for tracking custom events and identifying users
 * across web and native platforms using Microsoft Clarity.
 * 
 * **Note**: Native tracking requires bare workflow or custom config plugin.
 * Web tracking is fully functional in all Expo configurations.
 */

import { Platform } from 'react-native';

// Conditional import for native Clarity SDK
let Clarity: any;
if (Platform.OS !== 'web') {
	try {
		Clarity = require('@microsoft/react-native-clarity').Clarity;
	} catch (error) {
		console.warn('[useAnalytics] React Native Clarity not available. Native tracking disabled.');
	}
}

/**
 * Unified analytics hook for custom event tracking
 * Web: Uses Clarity global object
 * Native: Uses React Native Clarity SDK
 */
export function useAnalytics() {
	/**
	 * Track custom event
	 * @param eventName - Event identifier (e.g., 'race_result_viewed')
	 * @param properties - Event metadata (optional)
	 */
	const trackEvent = (eventName: string, properties?: Record<string, any>) => {
		if (Platform.OS === 'web') {
			// Web Clarity API
			if (typeof window !== 'undefined' && (window as any).clarity) {
				(window as any).clarity('event', eventName, properties);
			} else {
				console.warn('[useAnalytics] Clarity not initialized on web');
			}
		} else {
			// Native Clarity API
			if (Clarity) {
				Clarity.setCustomTag(eventName, JSON.stringify(properties || {}));
			} else {
				console.warn('[useAnalytics] Clarity not available on native');
			}
		}
	};

	/**
	 * Identify user for session tracking
	 * @param userId - User identifier from Auth0
	 * @param userProperties - Additional user metadata (optional)
	 */
	const identifyUser = (userId: string, userProperties?: Record<string, any>) => {
		if (Platform.OS === 'web') {
			// Web Clarity API
			if (typeof window !== 'undefined' && (window as any).clarity) {
				(window as any).clarity('identify', userId, userProperties);
			} else {
				console.warn('[useAnalytics] Clarity not initialized on web');
			}
		} else {
			// Native Clarity API
			if (Clarity) {
				Clarity.setCustomUserId(userId);
				if (userProperties) {
					Object.entries(userProperties).forEach(([key, value]) => {
						Clarity.setCustomTag(key, String(value));
					});
				}
			} else {
				console.warn('[useAnalytics] Clarity not available on native');
			}
		}
	};

	return {
		trackEvent,
		identifyUser,
	};
}
