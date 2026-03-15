/**
 * Native-specific Clarity Provider
 * 
 * Initializes Microsoft Clarity SDK for React Native on iOS and Android.
 * Uses @microsoft/react-native-clarity package for mobile tracking.
 * 
 * **Note**: This library does not include an Expo config plugin and requires
 * bare workflow or custom config plugin to function. Currently will fail
 * gracefully with console warnings in managed Expo workflow.
 */

import { useEffect } from 'react';

interface ClarityProviderProps {
	children: React.ReactNode;
}

// Conditional import with error handling
let Clarity: any = null;
let ClarityConfig: any = null;

try {
	const clarityModule = require('@microsoft/react-native-clarity');
	Clarity = clarityModule.Clarity;
	ClarityConfig = clarityModule.ClarityConfig;
} catch (error) {
	console.warn('[Clarity Native] Unable to load @microsoft/react-native-clarity. Native tracking disabled.');
	console.warn('[Clarity Native] This library requires bare workflow or custom config plugin.');
}

/**
 * Native-specific Clarity provider
 * Initializes React Native Clarity SDK
 */
export function ClarityProvider({ children }: ClarityProviderProps) {
	useEffect(() => {
		if (!Clarity) {
			console.warn('[Clarity Native] SDK not available. Skipping initialization.');
			console.warn('[Clarity Native] See features/analytics/README.md for native support options.');
			return;
		}

		try {
            const Constants = require('expo-constants').default;
		    const projectId = Constants.expoConfig?.extra?.clarityNativeProjectId;
			// Configure Clarity
			const config: typeof ClarityConfig = {
				projectId,
				// Enable verbose logging in development mode
				logLevel: __DEV__ ? 'verbose' : 'none',
				// Allow tracking on metered networks (cellular data)
				allowMeteredNetworkUsage: true,
			};

			// Initialize Clarity SDK
			Clarity.initialize(config);
			
			console.log('[Clarity Native] Initialized with project ID:', projectId);
		} catch (error) {
			console.error('[Clarity Native] Initialization failed:', error);
			console.warn('[Clarity Native] This library may not be properly configured for Expo.');
		}
	}, []);

	return <>{children}</>;
}
