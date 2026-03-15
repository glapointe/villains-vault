/**
 * OAuth Callback Screen
 * 
 * Handles the redirect after Auth0 authentication completes.
 * Shows a loading state while Auth0 processes the callback,
 * then redirects to the main app once authenticated.
 * Required for deep linking on mobile platforms.
 */

import { useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/ui';
import { consumePendingChatAction, setPendingChatAction } from '../../utils/pendingAction';

/**
 * Callback Screen Component
 * Waits for Auth0 to process OAuth callback, then redirects to app
 */
export default function CallbackScreen() {
	const router = useRouter();
	const { isLoading, isAuthenticated, user } = useAuth();

	/**
	 * Navigate after successful authentication.
	 * If a pending chat action exists, redirect to the chat page
	 * so the prompt can be replayed automatically.
	 */
	const navigateAfterAuth = useCallback(async () => {
		try {
			const pending = await consumePendingChatAction();
			if (pending) {
				// Re-store so the chat page can pick it up on mount
				setPendingChatAction(pending);
				router.replace('/(tabs)/chat');
				return;
			}
		} catch {
			// Non-critical — fall through to default navigation
		}
		router.replace('/(tabs)');
	}, [router]);

	useEffect(() => {
		// Fix Facebook's redirect quirk: Facebook appends #_=_ before query params
		// This breaks Auth0 SDK which expects params in query string, not hash
		if (typeof window !== 'undefined') {
			const hash = window.location.hash;
			
			// Check if Facebook added #_=_ before the query params
			if (hash.includes('#_=_?')) {
				// Extract the query params from the hash
				const queryString = hash.split('#_=_?')[1];
				// Reconstruct the URL with params in the correct location
				const cleanUrl = `${window.location.origin}${window.location.pathname}?${queryString}`;
				window.location.replace(cleanUrl);
				return;
			}

			// Check for OAuth errors in URL
			const params = new URLSearchParams(window.location.search);
			const error = params.get('error');
			
			if (error) {
				const errorDescription = params.get('error_description');
				console.error('[Callback] Auth error:', error, errorDescription);
				setTimeout(() => router.replace('/(auth)/login'), 2000);
				return;
			}
		}

		// Wait for Auth0 to finish processing the callback
		if (!isLoading) {
			if (isAuthenticated && user) {
				// Successfully authenticated - navigate (checking for pending chat action)
				navigateAfterAuth();
			} else {
				// Give it a bit more time in case user profile is still loading
				const timer = setTimeout(() => {
					if (isAuthenticated && user) {
						navigateAfterAuth();
					} else {
						// Auth failed or incomplete - redirect to login
						router.replace('/(auth)/login');
					}
				}, 2000);
				
				return () => clearTimeout(timer);
			}
		}
	}, [isLoading, isAuthenticated, user, router, navigateAfterAuth]);

	return <LoadingSpinner />;
}
