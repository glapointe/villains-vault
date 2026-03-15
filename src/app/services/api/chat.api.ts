/**
 * Chat API Service
 *
 * Handles communication with the backend chat endpoints.
 * Supports SSE streaming on all platforms:
 * - Web: uses global fetch + ReadableStream (kept as reference implementation)
 * - Native (iOS/Android): uses expo/fetch for ReadableStream support
 */

import { Platform } from 'react-native';
import { apiClient } from './client';
import { streamFetch } from './streamFetch';
import { apiConfig } from '../../features/auth/providers/config';
import { getChatSessionId } from '../../utils/chatSession';
import type {
	ChatContext,
	ChatStreamEvent,
	ChatResponse,
	ChatStatus,
} from '../../models/chat';

/** Callbacks for processing streaming chat events. */
export interface ChatStreamCallbacks {
	onThinking?: (toolName: string, toolCallId?: string, args?: string) => void;
	onToolResult?: (toolName: string, toolCallId?: string, result?: string) => void;
	onMessageDelta?: (text: string) => void;
	onComplete?: () => void;
	onError?: (message: string) => void;
}

/** Check whether AI Chat is enabled and if auth is required. */
async function getStatus(): Promise<ChatStatus> {
	const response = await apiClient.get<ChatStatus>('/api/v1.0/chat/status');
	return response.data;
}

/** Get the common headers including the session ID for anonymous tracking. */
async function getChatHeaders(): Promise<Record<string, string>> {
	const sessionId = await getChatSessionId();
	return {
		'X-Chat-Session-Id': sessionId,
		'Content-Type': 'application/json',
	};
}

/**
 * Stream a chat response via SSE.
 * Web: uses global fetch + ReadableStream (reference implementation).
 * Native: uses expo/fetch which provides ReadableStream on iOS/Android.
 */
async function streamChat(
	message: string,
	context?: ChatContext,
	callbacks?: ChatStreamCallbacks,
	signal?: AbortSignal,
): Promise<void> {
	const sessionId = await getChatSessionId();

	// Build the Authorization header from the existing axios defaults
	const authHeader = apiClient.defaults.headers.common['Authorization'] as string | undefined;

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		'Accept': 'text/event-stream',
		'X-Chat-Session-Id': sessionId,
	};

	if (authHeader) {
		headers['Authorization'] = authHeader;
	}

	// Web: use global fetch (kept as reference). Native: use expo/fetch via streamFetch.
	const fetchFn = Platform.OS === 'web' ? globalThis.fetch.bind(globalThis) : streamFetch;

	const response = await fetchFn(`${apiConfig.baseUrl}/api/v1.0/chat/stream`, {
		method: 'POST',
		headers,
		body: JSON.stringify({ message, context }),
		signal,
	});

	if (!response.ok) {
		if (response.status === 401) {
			throw new ChatAuthRequiredError('Authentication required');
		}
		if (response.status === 429) {
			throw new ChatRateLimitError('Rate limit exceeded. Please wait a moment before trying again.');
		}
		throw new Error(`Chat request failed: ${response.status}`);
	}

	const reader = response.body!.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	let completed = false;

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() ?? '';

			for (const line of lines) {
				if (!line.startsWith('data: ')) continue;

				const data = line.slice(6).trim();
				if (data === '[DONE]') {
					completed = true;
					callbacks?.onComplete?.();
					return;
				}

				try {
					const event: ChatStreamEvent = JSON.parse(data);

					switch (event.type) {
						case 'thinking':
							callbacks?.onThinking?.(
								event.toolName ?? 'unknown',
								event.toolCallId,
								event.arguments,
							);
							break;

						case 'tool_result':
							callbacks?.onToolResult?.(
								event.toolName ?? 'unknown',
								event.toolCallId,
								event.result,
							);
							break;

						case 'message_delta':
							if (event.content) {
								callbacks?.onMessageDelta?.(event.content);
							}
							break;

						case 'message_complete':
							completed = true;
							callbacks?.onComplete?.();
							return;

						case 'error':
							completed = true;
							callbacks?.onError?.(event.content ?? 'An error occurred');
							return;
					}
				} catch {
					// Skip malformed JSON lines
				}
			}
		}

		// Stream ended without a [DONE] or message_complete event — server-side error
		if (!completed) {
			callbacks?.onError?.('The response was interrupted. Please try again.');
		}
	} finally {
		reader.releaseLock();
	}
}

/**
 * Non-streaming chat request. Returns the full response as JSON.
 * Used as a fallback for platforms without ReadableStream support.
 */
async function sendChat(
	message: string,
	context?: ChatContext,
): Promise<ChatResponse> {
	const chatHeaders = await getChatHeaders();

	const response = await apiClient.post<ChatResponse>(
		'/api/v1.0/chat',
		{ message, context },
		{ headers: chatHeaders },
	);

	return response.data;
}

/** Clear the current conversation on the server. */
async function clearConversation(): Promise<void> {
	const chatHeaders = await getChatHeaders();
	await apiClient.delete('/api/v1.0/chat/conversation', { headers: chatHeaders });
}

/** Custom error for auth-required responses. */
export class ChatAuthRequiredError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ChatAuthRequiredError';
	}
}

/** Custom error for rate-limit responses. */
export class ChatRateLimitError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ChatRateLimitError';
	}
}

export const chatApi = {
	getStatus,
	streamChat,
	sendChat,
	clearConversation,
};
