// src/polyfills/platformConstants.ts
import { NativeModules, Platform } from 'react-native';

function parseVersionString(v: string | undefined) {
	if (!v) return null;
	// v is like "0.81.5" or "0.81.5-rc.0"
	const match = v.match(/^(\d+)\.(\d+)\.(\d+)/);
	if (!match) return null;
	return {
		major: Number(match[1]),
		minor: Number(match[2]),
		patch: Number(match[3]),
	};
}

function getReactNativeVersion() {
	// Try to read react-native package version (works in most bundlers)
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const rnPkg = require('react-native/package.json');
		const parsed = parseVersionString(rnPkg?.version);
		if (parsed) return parsed;
	} catch (e) {
		// ignore
	}

	// Try process.env if you inject it in your build
	try {
		const envVer = (process && (process.env as any).REACT_NATIVE_VERSION) || undefined;
		const parsed = parseVersionString(envVer);
		if (parsed) return parsed;
	} catch (e) {
		// ignore
	}

	// Last resort: use a reasonable default that avoids the "<0.65" warning
	return { major: 0, minor: 81, patch: 5 }; // set to your RN version
}

const RN_VERSION = getReactNativeVersion();

function applyPlatformConstants() {
	try {
		const defaultConstants = {
			reactNativeVersion: RN_VERSION,
		};

		if (!NativeModules.PlatformConstants) {
			NativeModules.PlatformConstants = defaultConstants;
		} else if (!NativeModules.PlatformConstants.reactNativeVersion) {
			NativeModules.PlatformConstants.reactNativeVersion = defaultConstants.reactNativeVersion;
		}

		if ((Platform as any).constants == null) {
			(Platform as any).constants = NativeModules.PlatformConstants;
		} else if ((Platform as any).constants.reactNativeVersion == null) {
			(Platform as any).constants.reactNativeVersion = defaultConstants.reactNativeVersion;
		}

		if (typeof window !== 'undefined') {
			(window as any).__RN_PLATFORM_CONSTANTS__ = NativeModules.PlatformConstants;
		}
	} catch (err) {
		// don't throw from the polyfill
		// eslint-disable-next-line no-console
		console.warn('applyPlatformConstants polyfill failed', err);
	}
}

applyPlatformConstants();

declare const module: any;
if (module && module.hot && typeof module.hot.accept === 'function') {
	module.hot.accept(() => {
		applyPlatformConstants();
	});
}

export { };