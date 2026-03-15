/**
 * Chat Page
 *
 * Full-page AI chat interface. On web, reads a pending prompt from sessionStorage
 * (written by ChatPromptBar) on every focus event, so the prompt is never visible
 * in the address bar. On native, falls back to URL search params.
 * Also checks for a pending chat action stored before an auth redirect.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemedColors } from '../../theme';
import { ChatInterface } from '../../components/chat';
import { LoadingSpinner } from '../../components/ui';
import { useChatEnabled } from '../../hooks/useChatEnabled';
import { consumePendingChatAction } from '../../utils/pendingAction';
import { styles, getThemedStyles } from '../../styles/routes/chat.styles';
import type { PendingChatAction } from '../../models/chat';

/** Payload stored in sessionStorage by ChatPromptBar on web. */
interface SessionPromptPayload {
	prompt: string;
	instructions?: string;
}

/**
 * Reads and immediately clears the pending prompt from sessionStorage.
 * Returns null if nothing is stored.
 */
function consumeSessionPrompt(): SessionPromptPayload | null {
	if (Platform.OS === 'web' && typeof window !== 'undefined') {
		try {
			const stored = sessionStorage.getItem('pendingChatPrompt');
			if (stored) {
				sessionStorage.removeItem('pendingChatPrompt');
				return JSON.parse(stored) as SessionPromptPayload;
			}
		} catch {}
	}
	return null;
}

/** A versioned prompt payload — the `id` is used as a React key to force ChatInterface remount. */
interface ActivePrompt {
	id: number;
	prompt: string;
	instructions?: string;
}

export default function ChatPage(): React.ReactElement | null {
	const params = useLocalSearchParams();
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const { enabled, isLoading } = useChatEnabled();
	const [pendingAction, setPendingAction] = useState<PendingChatAction | null>(null);
	const [ready, setReady] = useState(false);

	// Tracks the currently active prompt + a unique id so ChatInterface can be
	// rekeyed (remounted) each time a new suggestion-bar prompt arrives.
	const initialNativePrompt = typeof params.prompt === 'string' ? params.prompt : undefined;
	const initialNativeInstructions = typeof params.instructions === 'string' ? params.instructions : undefined;
	const [activePrompt, setActivePrompt] = useState<ActivePrompt | null>(
		initialNativePrompt ? { id: Date.now(), prompt: initialNativePrompt, instructions: initialNativeInstructions } : null
	);
	// Track whether this is the very first focus to avoid clobbering native URL params
	const isMounted = useRef(false);

	// On every focus (including when the tab is already mounted and the user
	// navigates back to it), check sessionStorage for a freshly submitted prompt.
	useFocusEffect(
		useCallback(() => {
			const payload = consumeSessionPrompt();
			if (payload) {
				setActivePrompt({ id: Date.now(), prompt: payload.prompt, instructions: payload.instructions });
			} else if (!isMounted.current && initialNativePrompt) {
				// First focus on native with URL params — already set above, nothing to do
			}
			isMounted.current = true;
		}, [])
	);

	// Check for pending action from auth redirect
	useEffect(() => {
		const checkPending = async () => {
			const action = await consumePendingChatAction();
			if (action) {
				setPendingAction(action);
			}
			setReady(true);
		};
		checkPending();
	}, []);

	if (isLoading || !ready) {
		return <LoadingSpinner />;
	}

	if (!enabled) {
		return null;
	}

	// Priority: pending action from auth redirect > activePrompt (sessionStorage / URL param)
	const resolvedPrompt = pendingAction?.prompt ?? activePrompt?.prompt;
	const baseContext = pendingAction?.context;
	const resolvedContext = activePrompt?.instructions && !baseContext?.supplementalInstructions
		? { ...baseContext, supplementalInstructions: activePrompt.instructions }
		: baseContext;

	// key forces ChatInterface to remount fresh each time a new prompt arrives
	// from the suggestion bar, so hasExecutedInitialPrompt resets correctly.
	const chatKey = pendingAction ? 'pending-action' : (activePrompt?.id ?? 'default');

	return (
		<View style={styles.container}>
			<View style={[styles.chatWrapper, themedStyles.chatWrapper]}>
				<ChatInterface
					key={chatKey}
					initialPrompt={resolvedPrompt}
					context={resolvedContext}
				/>
			</View>
		</View>
	);
}
