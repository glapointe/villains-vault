/**
 * Push token registration request
 */
export interface RegisterPushTokenRequest {
	token: string;
	platform: 'ios' | 'android';
}

/**
 * Push token unregistration request
 */
export interface UnregisterPushTokenRequest {
	token: string;
}
