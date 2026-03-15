/**
 * Utility Functions
 * Common helper functions used throughout the app
 */

import Constants from 'expo-constants';

// Export date utilities
export {
	formatDate,
	ensureDateWithTime,
	parseDate,
	toISODateString,
	getCurrentDateString,
    timeToSeconds,
    paceToMinutes,
    minutesToPace,
    secondsToPace,
	formatTime,
} from './dateTime';

// Export validation utilities
export {
	isValidUrl,
	isValidEmail,
	isEmpty,
	validateRequired,
	validateMinLength,
	validateMaxLength,
} from './validation';

// Export cache bypass utilities
export {
	getCacheBypassEnabled,
	setCacheBypassEnabled,
} from './cacheBypass';

export {
    kmToMiles,
    formatDistance
} from './distance';

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength) + '...';
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: ReturnType<typeof setTimeout> | null = null;
	
	return (...args: Parameters<T>) => {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}

/**
 * Check if DLS declarations are disabled via environment variable.
 */
export function getDisableDlsDeclarations(): boolean {
	return Constants.expoConfig?.extra?.disableDlsDeclarations === 'true';
}

/**
 * Check if community events are disabled via environment variable.
 */
export function getDisabledCommunityEvents(): boolean {
	return Constants.expoConfig?.extra?.disableCommunityEvents === 'true';
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
	return __DEV__;
}
