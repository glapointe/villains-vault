/**
 * Analytics Providers Barrel Export
 * 
 * Platform-aware exports for analytics providers.
 * Dynamically selects the appropriate provider based on the current platform.
 */

import { Platform } from 'react-native';

/**
 * Platform-aware Clarity provider export
 * Web uses DOM script injection, Native uses SDK
 */
export const ClarityProvider = Platform.select({
	web: () => require('./ClarityProvider.web').ClarityProvider,
	default: () => require('./ClarityProvider.native').ClarityProvider,
})();
