/**
 * useChat Hook
 *
 * Manages the chat conversation state: messages, streaming, tool-call steps,
 * cancellation, and thread lifecycle. Uses the chat API service internally.
 */

import { useState, useCallback, useRef } from 'react';
import { chatApi, ChatAuthRequiredError, ChatRateLimitError } from '../services/api/chat.api';
import type { ChatMessage, ChatStep, ChatContext } from '../models/chat';

export function useChat() {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [isStreaming, setIsStreaming] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const abortRef = useRef<AbortController | null>(null);

	/**
	 * Send a message and stream the response.
	 * Throws ChatAuthRequiredError if auth is needed (caller should handle redirect).
	 */
	const sendMessage = useCallback(async (text: string, context?: ChatContext) => {
		if (!text.trim() || isStreaming) return;

		setError(null);

		// Append user message
		const userMsg: ChatMessage = {
			id: `user-${Date.now()}`,
			role: 'user',
			content: text.trim(),
		};

		const assistantId = `assistant-${Date.now()}`;
		const assistantMsg: ChatMessage = {
			id: assistantId,
			role: 'assistant',
			content: '',
			steps: [],
			isStreaming: true,
		};

		setMessages(prev => [...prev, userMsg, assistantMsg]);
		setIsStreaming(true);

		abortRef.current = new AbortController();

		try {
			await chatApi.streamChat(
				text.trim(),
				context,
				{
					onThinking: (toolName, toolCallId, args) => {
						setMessages(prev => prev.map(m => {
							if (m.id !== assistantId) return m;
							const step: ChatStep = {
								type: 'thinking',
								toolName,
								toolCallId,
								arguments: args,
								status: 'in_progress',
							};
							return { ...m, steps: [...(m.steps ?? []), step] };
						}));
					},

					onToolResult: (toolName, toolCallId, result) => {
						setMessages(prev => prev.map(m => {
							if (m.id !== assistantId) return m;

							// Update matching in-progress step to complete
							const steps = (m.steps ?? []).map(s => {
								if (s.toolCallId && s.toolCallId === toolCallId && s.status === 'in_progress') {
									return { ...s, status: 'complete' as const, result };
								}
								return s;
							});

							// If no matching step found, add a completed one
							const hasMatch = steps.some(s => s.toolCallId === toolCallId && s.status === 'complete');
							if (!hasMatch) {
								steps.push({
									type: 'tool_result',
									toolName,
									toolCallId,
									result,
									status: 'complete',
								});
							}

							return { ...m, steps };
						}));
					},

					onMessageDelta: (text) => {
						setMessages(prev => prev.map(m => {
							if (m.id !== assistantId) return m;
							return { ...m, content: m.content + text };
						}));
					},

					onComplete: () => {
						setMessages(prev => prev.map(m => {
							if (m.id !== assistantId) return m;
							// Mark all remaining in-progress steps as complete
							const steps = (m.steps ?? []).map(s =>
								s.status === 'in_progress' ? { ...s, status: 'complete' as const } : s
							);
							return { ...m, isStreaming: false, steps };
						}));
					},

					onError: (message) => {
						setError(message);
						setMessages(prev => prev.map(m => {
							if (m.id !== assistantId) return m;
							return { ...m, isStreaming: false, content: m.content || message };
						}));
					},
				},
				abortRef.current.signal,
			);
		} catch (err) {
			if (err instanceof ChatAuthRequiredError) {
				// Remove the placeholder assistant message — caller will handle redirect
				setMessages(prev => prev.filter(m => m.id !== assistantId));
				throw err;
			}
			if (err instanceof ChatRateLimitError) {
				setError(err.message);
				setMessages(prev => prev.map(m => {
					if (m.id !== assistantId) return m;
					return { ...m, isStreaming: false, content: err.message };
				}));
			} else if (err instanceof DOMException && err.name === 'AbortError') {
				// User cancelled — mark in-progress steps as cancelled & stop streaming
				setMessages(prev => {
					const updated = prev.map(m => {
						if (m.id !== assistantId) return m;
						const steps = (m.steps ?? []).map(s =>
							s.status === 'in_progress' ? { ...s, status: 'cancelled' as const } : s
						);
						return { ...m, isStreaming: false, steps };
					});
					// Append a system message indicating the response was cancelled
					const systemMsg: ChatMessage = {
						id: `system-${Date.now()}`,
						role: 'system',
						content: 'Response cancelled.',
					};
					return [...updated, systemMsg];
				});
			} else {
				const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
				setError(message);
				setMessages(prev => prev.map(m => {
					if (m.id !== assistantId) return m;
					return { ...m, isStreaming: false, content: m.content || message };
				}));
			}
		} finally {
			setIsStreaming(false);
			abortRef.current = null;
		}
	}, [isStreaming]);

	/** Cancel the current streaming request. */
	const cancel = useCallback(() => {
		abortRef.current?.abort();
	}, []);

	/** Clear all messages and start a fresh conversation. */
	const clearConversation = useCallback(async () => {
		cancel();
		setMessages([]);
		setError(null);
		try {
			await chatApi.clearConversation();
		} catch {
			// Non-critical — server conversation will expire on its own
		}
	}, [cancel]);

	/**
	 * Replay from a specific user message.
	 * Truncates conversation to just before that message, clears server state,
	 * then re-sends the message as if typed fresh.
	 */
	const replayFromMessage = useCallback(async (messageId: string, context?: ChatContext) => {
		if (isStreaming) return;

		const msgIndex = messages.findIndex(m => m.id === messageId);
		if (msgIndex === -1) return;

		const message = messages[msgIndex];
		if (message.role !== 'user') return;

		// Truncate to everything before this message
		const truncated = messages.slice(0, msgIndex);
		setMessages(truncated);
		setError(null);

		// Clear server conversation so it starts fresh from this point
		try {
			await chatApi.clearConversation();
		} catch {
			// Non-critical
		}

		// Re-send the message
		// Small delay to let state settle
		setTimeout(() => {
			sendMessage(message.content, context);
		}, 50);
	}, [messages, isStreaming, sendMessage]);

	return {
		messages,
		isStreaming,
		error,
		sendMessage,
		cancel,
		clearConversation,
		replayFromMessage,
	};
}
