/**
 * Shared API Client Configuration
 * 
 * Base axios instance used by all API modules.
 * Handles authentication token injection and common configuration.
 */

import axios from 'axios';
import { apiConfig } from '../../features/auth/providers/config';
import { getCacheBypassEnabled } from '../../utils/cacheBypass';

/**
 * Create Axios instance with base configuration
 */
export const apiClient = axios.create({
	baseURL: apiConfig.baseUrl,
	headers: {
		'Content-Type': 'application/json',
	},
});

/**
 * Add request interceptor to inject cache bypass header if enabled
 */
apiClient.interceptors.request.use(
	async (config) => {
		// Check if cache bypass is enabled and add header if so
		const bypassCache = await getCacheBypassEnabled();
		if (bypassCache) {
			config.headers['X-Bypass-Cache'] = 'true';
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

/**
 * Set or clear the authorization token for API requests
 * @param token - JWT access token from Auth0
 */
export function setAuthToken(token: string | null) {
	if (token) {
		apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
	} else {
		delete apiClient.defaults.headers.common['Authorization'];
	}
}
