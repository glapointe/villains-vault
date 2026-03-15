/**
 * useChatEnabled Hook
 *
 * Queries the backend /chat/status endpoint to determine if the AI chat
 * feature is enabled and whether authentication is required.
 * Caches the result for the session to avoid repeated network calls.
 */

import { useState, useEffect, useCallback } from 'react';
import { chatApi } from '../services/api/chat.api';
import type { ChatStatus } from '../models/chat';

let cachedStatus: ChatStatus | null = null;

export function useChatEnabled() {
	const [status, setStatus] = useState<ChatStatus | null>(cachedStatus);
	const [isLoading, setIsLoading] = useState(!cachedStatus);

	const refresh = useCallback(async () => {
		try {
			const result = await chatApi.getStatus();
			cachedStatus = result;
			setStatus(result);
		} catch {
			// If the status endpoint fails, assume chat is disabled
			const disabled: ChatStatus = { enabled: false, requiresAuth: false };
			cachedStatus = disabled;
			setStatus(disabled);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!cachedStatus) {
			refresh();
		}
	}, [refresh]);

	return {
		/** Whether the chat feature is enabled on the backend. */
		enabled: status?.enabled ?? false,
		/** Whether authentication is required to use chat. */
		requiresAuth: status?.requiresAuth ?? false,
		/** Whether the status check is still loading. */
		isLoading,
		/** Force-refresh the status from the backend. */
		refresh,
	};
}
