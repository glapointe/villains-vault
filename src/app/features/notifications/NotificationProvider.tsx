/**
 * Notification Provider
 * 
 * Manages push notification lifecycle for authenticated native users:
 * - Requests permission and registers the push token on login
 * - Unregisters the token on logout
 * - Handles notification tap deep-linking via Expo Router
 * 
 * Must be placed inside AuthProvider in the component tree.
 * Only active on native platforms (iOS/Android) — renders children passthrough on web.
 */

import React, { useEffect, useRef, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { setAuthToken } from '../../services/api/client';
import {
	registerForPushNotificationsAsync,
	addNotificationReceivedListener,
	addNotificationResponseListener,
} from '../../services/notifications/notificationService';

const PUSH_TOKEN_STORAGE_KEY = 'expo_push_token';

interface NotificationProviderProps {
	children: ReactNode;
}

/**
 * NotificationProvider — native-only push notification lifecycle manager
 */
export function NotificationProvider({ children }: NotificationProviderProps): React.ReactElement {
	const { isAuthenticated, accessToken } = useAuth();
	const router = useRouter();
	const hasRegistered = useRef(false);
	/**
	 * Snapshot of the last known valid Bearer token.
	 * The auth provider clears the module-level auth token synchronously at the
	 * start of logout(), before React re-renders and this effect fires. Keeping
	 * our own ref lets us restore the header just long enough to make the
	 * unregister API call.
	 */
	const accessTokenRef = useRef<string | null>(null);

	// Keep the ref current whenever we have a valid token
	useEffect(() => {
		if (accessToken) {
			accessTokenRef.current = accessToken;
		}
	}, [accessToken]);

	/**
	 * Register push token with the backend
	 */
	const registerToken = useCallback(async () => {
		if (hasRegistered.current) return;

		try {
			const token = await registerForPushNotificationsAsync();
			if (!token) return;

			const platform = Platform.OS as 'ios' | 'android';
			await api.notifications.registerPushToken({ token, platform });
			await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
			hasRegistered.current = true;

			console.log('[NotificationProvider] Token registered with backend');
		} catch (error) {
			console.error('[NotificationProvider] Failed to register push token:', error);
		}
	}, []);

	/**
	 * Unregister push token from the backend.
	 *
	 * The auth provider clears the module-level Bearer token synchronously
	 * before React re-renders, so by the time this effect fires the Axios
	 * Authorization header is already gone. We restore it from our local ref
	 * for the duration of the unregister call, then clear it again.
	 */
	const unregisterToken = useCallback(async () => {
		try {
			const pushToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
			if (pushToken) {
				// Restore Bearer token so the authenticated DELETE doesn't 401
				if (accessTokenRef.current) {
					setAuthToken(accessTokenRef.current);
				}
				try {
					await api.notifications.unregisterPushToken({ token: pushToken });
					console.log('[NotificationProvider] Token unregistered from backend');
				} finally {
					// Always clear — auth provider expects this to be null after logout
					setAuthToken(null);
					accessTokenRef.current = null;
				}
				await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
			}
		} catch (error) {
			console.error('[NotificationProvider] Failed to unregister push token:', error);
		} finally {
			hasRegistered.current = false;
		}
	}, []);

	/**
	 * Handle notification tap — route to the appropriate screen
	 */
	const handleNotificationTap = useCallback(
		(data: Record<string, string> | undefined) => {
			console.log('[NotificationProvider] Notification tapped:', data);
			if (!data?.route) return;

			try {
				router.push(data.route as any);
			} catch (error) {
				console.error('[NotificationProvider] Failed to navigate from notification:', error);
			}
		},
		[router]
	);

	// Register/unregister based on auth state
	useEffect(() => {
		if (isAuthenticated) {
			registerToken();
		} else if (hasRegistered.current) {
			unregisterToken();
		}
	}, [isAuthenticated, registerToken, unregisterToken]);

	// Set up notification listeners
	useEffect(() => {
		const receivedSub = addNotificationReceivedListener((notification) => {
			console.log('[NotificationProvider] Notification received:', notification.request.content.title);
		});

		const responseSub = addNotificationResponseListener((response) => {
			const data = response.notification.request.content.data as Record<string, string> | undefined;
			handleNotificationTap(data);
		});

		return () => {
			receivedSub.remove();
			responseSub.remove();
		};
	}, [handleNotificationTap]);

	return <>{children}</>;
}
