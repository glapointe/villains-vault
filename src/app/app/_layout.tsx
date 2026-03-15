/**
 * Root Layout Component
 * 
 * Initializes the application with platform-specific authentication provider.
 * Loads global styles and wraps the entire app with Auth0 authentication context.
 * Includes error boundary for graceful error handling.
 */

try {
	require('../global.css');
} catch (error) {
	console.error('[RootLayout] Failed to load global.css:', error);
}

import '../utils/debug';
import React from 'react';
import { Slot } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Auth0ProviderNative } from '../features/auth/providers/AuthProvider.native';
import { Auth0ProviderWebWrapper } from '../features/auth/providers/AuthProvider.web';
import { ThemeProvider } from '../contexts/ThemeContext';
import { DialogProvider } from '../contexts/DialogContext';
import { ErrorBoundary } from '../components/ui';
import { ClarityProvider } from '../features/analytics/providers';

/**
 * NotificationProvider is native-only (uses expo-notifications).
 * On web, render a passthrough wrapper.
 */
const NotificationProvider: React.FC<{ children: React.ReactNode }> = Platform.OS === 'web'
	? ({ children }) => <>{children}</>
	: require('../features/notifications/NotificationProvider').NotificationProvider;

/**
 * Select the appropriate Auth0 provider based on platform
 * Web uses @auth0/auth0-react, Native uses react-native-auth0
 */
const AuthProvider = Platform.OS === 'web' ? Auth0ProviderWebWrapper : Auth0ProviderNative;

/**
 * Root layout component that wraps the entire application
 */
export default function RootLayout() {
	return (
		<GestureHandlerRootView {...({ style: styles.root } as any)}>
			<SafeAreaProvider>
				<ThemeProvider>
					<ClarityProvider>
						<ErrorBoundary>
							<AuthProvider>
								<NotificationProvider>
									<DialogProvider>
										<Slot />
									</DialogProvider>
								</NotificationProvider>
							</AuthProvider>
						</ErrorBoundary>
				    </ClarityProvider>
				</ThemeProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
});
