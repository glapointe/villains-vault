/**
 * Authentication and API Configuration
 * 
 * This module provides platform-aware configuration for Auth0 authentication
 * and API endpoints. It detects the platform (web/iOS/Android) and returns
 * the appropriate Auth0 client ID and redirect URI.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Environment-driven identifiers from app.config.js
const AUTH0_DOMAIN = Constants.expoConfig?.extra?.auth0Domain || '';
const PACKAGE_NAME = 'com.falchion.villains.vault'; // Must match app.config.js bundleIdentifier/package
const APP_SCHEME = `${PACKAGE_NAME}.auth0`;

/**
 * Auth0 configuration with platform-specific client IDs
 * Web uses SPA application, iOS and Android share Native application
 */
export const auth0Config = {
	domain: AUTH0_DOMAIN,
	clientId: Platform.select({
		web: Constants.expoConfig?.extra?.auth0WebClientId || '',
		default: Constants.expoConfig?.extra?.auth0NativeClientId || '',
	}) || '',
	redirectUri: Platform.select({
		web: typeof window !== 'undefined' ? `${window.location.origin}/callback` : 'http://localhost:8081/callback',
		ios: `${APP_SCHEME}://${AUTH0_DOMAIN}/ios/${PACKAGE_NAME}/callback`,
		android: `${APP_SCHEME}://${AUTH0_DOMAIN}/android/${PACKAGE_NAME}/callback`,
		default: `${APP_SCHEME}://${AUTH0_DOMAIN}/ios/${PACKAGE_NAME}/callback`,
	}),
	scope: 'openid profile email offline_access',
	audience: Constants.expoConfig?.extra?.auth0Audience || '',
};

/**
 * API client configuration
 * Points to the backend .NET API server
 * 
 * Android emulator note: localhost must be mapped to 10.0.2.2
 * to access the host machine's services
 */
export const apiConfig = {
	baseUrl: (() => {
        const envUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';
	    console.log('API URL from config:', envUrl);
		// Android emulator needs 10.0.2.2 to access host's localhost
		if (Platform.OS === 'android' && envUrl.includes('localhost')) {
			return envUrl.replace('localhost', '10.0.2.2');
		}
		return envUrl;
	})(),
};

/**
 * Social connection identifiers for Auth0
 * These must match the connection names configured in Auth0 Dashboard
 * Enable these connections in Auth0: Applications > [Your App] > Connections
 */
export const socialConnections = {
	google: 'google-oauth2',
	apple: 'apple',
	microsoft: 'windowslive',
	facebook: 'facebook',
} as const;

export type SocialProvider = keyof typeof socialConnections;
