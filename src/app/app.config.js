/**
 * Expo App Configuration
 * 
 * This file loads environment variables from .env files and makes them
 * available throughout the app via Constants.expoConfig.extra
 * 
 * Priority order: .env.local > .env > defaults
 */

const path = require('path');
const fs = require('fs');

/**
 * Load environment variables from .env files
 * Manually parse to avoid needing dotenv package
 */
function loadEnvFile(filePath) {
	if (!fs.existsSync(filePath)) {
		return {};
	}

	const content = fs.readFileSync(filePath, 'utf-8');
	const env = {};

	content.split('\n').forEach(line => {
		// Skip comments and empty lines
		line = line.trim();
		if (!line || line.startsWith('#')) return;

		// Parse KEY=value
		const match = line.match(/^([^=]+)=(.*)$/);
		if (match) {
			const key = match[1].trim();
			let value = match[2].trim();

			// Remove quotes if present
			if ((value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'"))) {
				value = value.slice(1, -1);
			}

			env[key] = value;
		}
	});

	return env;
}

// Load .env and .env.local (local takes precedence)
// Determine which .env file to use based on ENV_NAME variable
const envName = process.env.ENV_NAME || 'local';
const envLocalPath = path.resolve(__dirname, `.env.${envName}`);
const envPath = path.resolve(__dirname, '.env');

// Load .env and environment-specific file (specific takes precedence)
const env = {
	...loadEnvFile(envPath),
	...loadEnvFile(envLocalPath),
};
console.log(`[app.config.js] Loading environment: .env.${envName}`);

// Extract EXPO_PUBLIC_* variables
// Priority depends on context:
// - EAS cloud builds (EAS_BUILD=true): process.env wins (values injected by EAS profile env blocks)
// - Local named-env builds (ENV_NAME=prod/staging): env file wins (Expo CLI auto-loads .env.local
//   into process.env between invocations, which would otherwise override the named env file)
// - Local default builds (ENV_NAME=local): process.env wins
const isEasBuild = !!process.env.EAS_BUILD;
const envFileFirst = !isEasBuild && envName !== 'local';

const getVar = (key, fallback = '') =>
	envFileFirst
		? (env[key] || process.env[key] || fallback)
		: (process.env[key] || env[key] || fallback);

const expoProjectId = getVar('EXPO_PUBLIC_PROJECT_ID', undefined);
const auth0Domain = getVar('EXPO_PUBLIC_AUTH0_DOMAIN');
const auth0WebClientId = getVar('EXPO_PUBLIC_AUTH0_WEB_CLIENT_ID');
const auth0NativeClientId = getVar('EXPO_PUBLIC_AUTH0_NATIVE_CLIENT_ID');
const auth0Audience = getVar('EXPO_PUBLIC_AUTH0_AUDIENCE');
const apiUrl = getVar('EXPO_PUBLIC_API_URL', 'http://localhost:5000');
const clarityWebProjectId = getVar('EXPO_PUBLIC_CLARITY_WEB_PROJECT_ID');
const clarityNativeProjectId = getVar('EXPO_PUBLIC_CLARITY_NATIVE_PROJECT_ID');
const disableDlsDeclarations = getVar('EXPO_PUBLIC_DISABLE_DLS_DECLARATIONS', 'false');
const disableCommunityEvents = getVar('EXPO_PUBLIC_DISABLE_COMMUNITY_EVENTS', 'false');

// console.log('[app.config.js] Loaded environment variables:', {
// 	expoProjectId: expoProjectId ? expoProjectId : '✗',
// 	auth0Domain: auth0Domain ? '✓' : '✗',
// 	auth0WebClientId: auth0WebClientId ? '✓' : '✗',
// 	auth0NativeClientId: auth0NativeClientId ? '✓' : '✗',
// 	apiUrl: apiUrl,
// 	clarityWebProjectId: clarityWebProjectId ? '✓' : '✗',
// 	clarityNativeProjectId: clarityNativeProjectId ? '✓' : '✗',
// 	disableDlsDeclarations: disableDlsDeclarations === 'true' ? 'true' : 'false',
// 	disableCommunityEvents: disableCommunityEvents === 'true' ? 'true' : 'false',
// });


// The user-facing app version shown in the Play Store / App Store.
// Bump this for every release (semver: major.minor.patch).
const version = '1.0.1';

// Controls OTA update compatibility via Expo Updates.
// Must match `version` whenever native code or plugins change (requires a new store build).
// Can stay the same as the previous release for JS-only changes (enables silent OTA delivery).
const runtimeVersion = '1.0.1';

// Android versionCode is managed automatically by EAS (appVersionSource: "remote" in eas.json).
// Use `eas build:version:set --platform android` to manually sync if needed.
// Run `npx expo prebuild --platform android --clean` after changing to regenerate with the new versionCode.

module.exports = {
	expo: {
		name: 'Villains Vault',
		slug: 'villains-vault',
		version: version,
		orientation: 'default',
		icon: './assets/villains-icon.png',
		userInterfaceStyle: 'automatic',
		androidStatusBar: {
			barStyle: 'light-content',
			translucent: true,
		},
		scheme: 'villains-vault',
		newArchEnabled: true,
		updates: {
			url: `https://u.expo.dev/${expoProjectId}`,
		},
		runtimeVersion: runtimeVersion,
		splash: {
			image: './assets/villains-splash-icon.png',
			resizeMode: 'contain',
			backgroundColor: '#000000',
		},
		developmentClient: {
			silentLaunch: false,
		},
		ios: {
			supportsTablet: true,
			bundleIdentifier: 'com.falchion.villains.vault',
		},
		android: {
			adaptiveIcon: {
				foregroundImage: './assets/villains-adaptive-icon.png',
				backgroundColor: '#000000',
			},
			edgeToEdgeEnabled: true,
			predictiveBackGestureEnabled: true,
			jsEngine: 'hermes',
			package: 'com.falchion.villains.vault',
			permissions: ['android.permission.POST_NOTIFICATIONS'],
			intentFilters: [
				{
					action: 'VIEW',
					category: ['BROWSABLE', 'DEFAULT'],
					data: {
						scheme: 'villains-vault',
						host: 'callback',
					},
				},
			],
			googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
		},
		web: {
			bundler: 'metro',
			favicon: './assets/favicon.png',
		},
		plugins: [
			'expo-router',
			[
				'expo-system-ui',
				{
					backgroundColor: '#000000',
				},
			],
			[
				'expo-notifications',
				{
					icon: './assets/villains-notification-icon.png',
					color: '#9333ea',
					defaultChannel: 'default',
				},
			],
			[
				'react-native-auth0',
				{
					domain: auth0Domain,
				},
			],
			[
				'./plugins/withGradleWrapper',
				{ gradleVersion: '8.13' },
			],
			'./plugins/withAndroidEdgeToEdge',
		],
		experiments: {
			typedRoutes: true,
		},
		extra: {
			router: {},
			eas: {
				projectId: expoProjectId,
			},
			// Environment variables accessible via Constants.expoConfig.extra
			auth0Domain,
			auth0WebClientId,
			auth0NativeClientId,
			auth0Audience,
			apiUrl,
			clarityWebProjectId,
			clarityNativeProjectId,
			disableDlsDeclarations,
			disableCommunityEvents,
			expoProjectId,
		},
	},
};
