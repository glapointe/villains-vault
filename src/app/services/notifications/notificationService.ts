/**
 * Notification Service
 * 
 * Wraps expo-notifications for push token registration, permission handling,
 * and notification event listeners. Native-only (iOS/Android).
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

/**
 * Configure default notification handling behavior.
 * Show alerts even when the app is in the foreground.
 */
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: false,
		shouldShowBanner: true,
		shouldShowList: true,
	}),
});

/**
 * Set up the default Android notification channel.
 * Required for Android 8+ (API 26+).
 */
async function setupAndroidChannel(): Promise<void> {
	if (Platform.OS === 'android') {
		await Notifications.setNotificationChannelAsync('default', {
			name: 'Default',
			importance: Notifications.AndroidImportance.MAX,
			vibrationPattern: [0, 250, 250, 250],
			lightColor: '#9333ea',
		});
	}
}

/**
 * Request push notification permissions and return the Expo push token.
 * Returns null if permissions are denied or the device is not physical.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
	// Push notifications only work on physical devices
	if (!Device.isDevice) {
		console.warn('[Notifications] Push notifications require a physical device');
		return null;
	}

	await setupAndroidChannel();

	// Check existing permissions
	const { status: existingStatus } = await Notifications.getPermissionsAsync();
	let finalStatus = existingStatus;

	// Request permissions if not already granted
	if (existingStatus !== 'granted') {
		const { status } = await Notifications.requestPermissionsAsync();
		finalStatus = status;
	}

	if (finalStatus !== 'granted') {
		console.warn('[Notifications] Push notification permission denied');
		return null;
	}

	// Get the Expo push token
	const projectId = Constants.expoConfig?.extra?.eas?.projectId;
	if (!projectId) {
		console.error('[Notifications] No EAS project ID found in app config');
		return null;
	}

	const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
	console.log('[Notifications] Push token:', tokenData.data);
	return tokenData.data;
}

/**
 * Add a listener for notifications received while the app is foregrounded.
 */
export function addNotificationReceivedListener(
	callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
	return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add a listener for when the user taps/interacts with a notification.
 */
export function addNotificationResponseListener(
	callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
	return Notifications.addNotificationResponseReceivedListener(callback);
}
