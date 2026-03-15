/**
 * ChatInterface Component
 *
 * Full chat interface with message list, input, empty state with suggestions,
 * and optional auth banner. Used as the main content of the chat page and
 * within the Panel modal for race/results pages.
 * The input bar is anchored as a footer; messages scroll above it.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Pressable, Platform, ScrollView } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { styles, getThemedStyles } from './ChatInterface.styles';
import { ChatMessage } from '../chatMessage/ChatMessage';
import { ChatInput } from '../chatInput/ChatInput';
import { useChat } from '../../../hooks/useChat';
import { useAuth } from '../../../hooks/useAuth';
import { useChatEnabled } from '../../../hooks/useChatEnabled';
import { ChatAuthRequiredError } from '../../../services/api/chat.api';
import { setPendingChatAction, consumePendingChatAction } from '../../../utils/pendingAction';
import { getSuggestions, inferSuggestionContext } from '../chatSuggestions';
import type { Suggestion } from '../chatSuggestions';
import type { ChatMessage as ChatMessageType, ChatContext } from '../../../models/chat';

interface ChatInterfaceProps {
	/** Initial prompt to send on mount. */
	initialPrompt?: string;
	/** Context to attach to messages (race, event, page info). */
	context?: ChatContext;
	/** Whether this is rendered inside a Panel (compact mode). */
	compact?: boolean;
}

export function ChatInterface({ initialPrompt, context, compact = false }: ChatInterfaceProps) {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const { messages, isStreaming, error, sendMessage, cancel, clearConversation, replayFromMessage } = useChat();
	const { isAuthenticated, login } = useAuth();
	const { requiresAuth } = useChatEnabled();
	const flatListRef = useRef<FlatList>(null);
	const hasExecutedInitialPrompt = useRef(false);

	// Auto-send initial prompt on mount
	useEffect(() => {
		if (initialPrompt && !hasExecutedInitialPrompt.current) {
			hasExecutedInitialPrompt.current = true;
			handleSend(initialPrompt);
		}
	}, [initialPrompt]);

	// Native: after in-app auth completes, retry the pending action
	const prevAuthRef = useRef(isAuthenticated);
	useEffect(() => {
		if (Platform.OS !== 'web' && !prevAuthRef.current && isAuthenticated) {
			consumePendingChatAction().then((pending) => {
				if (pending) {
					handleSend(pending.prompt);
				}
			});
		}
		prevAuthRef.current = isAuthenticated;
	}, [isAuthenticated]);

	// Auto-scroll to bottom when messages update
	useEffect(() => {
		if (messages.length > 0) {
			setTimeout(() => {
				flatListRef.current?.scrollToEnd({ animated: true });
			}, 100);
		}
	}, [messages]);

	const handleSend = useCallback(async (text: string, supplementalInstructions?: string) => {
		try {
			const enrichedContext: ChatContext | undefined = supplementalInstructions
				? { ...context, supplementalInstructions }
				: context;
			await sendMessage(text, enrichedContext);
		} catch (err) {
			if (err instanceof ChatAuthRequiredError) {
				// Save the prompt so it can be restored after login
				setPendingChatAction({
					prompt: text,
					context,
					returnTo: '/(tabs)/chat',
					timestamp: Date.now(),
				});
				login();
			}
		}
	}, [sendMessage, context, login]);

	const handleReplay = useCallback((messageId: string) => {
		replayFromMessage(messageId, context);
	}, [replayFromMessage, context]);

	const handleSuggestionPress = (suggestion: Suggestion) => {
		handleSend(suggestion.prompt, suggestion.instructions);
	};

	const showAuthBanner = requiresAuth && !isAuthenticated;
	const suggestions = getSuggestions(inferSuggestionContext(context), isAuthenticated);

	const renderMessage = ({ item }: { item: ChatMessageType }) => (
		<ChatMessage message={item} onReplay={handleReplay} />
	);

	const renderEmpty = () => (
		<View style={styles.emptyContainer}>
			<Text style={styles.emptyIcon}>💬</Text>
			<Text style={[styles.emptyTitle, themedStyles.emptyTitle]}>
				Ask Villains Vault AI
			</Text>
			<Text style={[styles.emptySubtitle, themedStyles.emptySubtitle]}>
				Ask questions about runDisney events, race results, runner statistics, and more.
			</Text>
			<View style={styles.suggestionsContainer}>
				{suggestions.map((suggestion) => (
					<Pressable
						key={suggestion.prompt}
						style={[styles.suggestionChip, themedStyles.suggestionChip]}
						onPress={() => handleSuggestionPress(suggestion)}
					>
						<Text style={[styles.suggestionText, themedStyles.suggestionText]}>
							{suggestion.prompt}
						</Text>
					</Pressable>
				))}
			</View>
		</View>
	);

	return (
		<View style={[styles.container, themedStyles.container]}>
			{/* Header */}
			{!compact && (
				<View style={[styles.header, themedStyles.header]}>
					<View style={styles.headerLeft}>
						<Text style={[styles.headerTitle, themedStyles.headerTitle]}>AI Chat</Text>
						<Text style={[styles.headerBadge, themedStyles.headerBadge]}>Preview</Text>
					</View>
					{messages.length > 0 && (
						<Pressable
							style={[styles.clearButton, themedStyles.clearButton]}
							onPress={clearConversation}
						>
							<Text style={[styles.clearButtonText, themedStyles.clearButtonText]}>
								Clear
							</Text>
						</Pressable>
					)}
				</View>
			)}

			{/* Auth banner for optional auth */}
			{showAuthBanner && (
				<View style={[styles.authBanner, themedStyles.authBanner]}>
					<Text style={[styles.authBannerText, themedStyles.authBannerText]}>
						Sign in for a personalized experience and higher rate limits.
					</Text>
					<Pressable
						style={[styles.authBannerButton, themedStyles.authBannerButton]}
						onPress={() => login()}
					>
						<Text style={[styles.authBannerButtonText, themedStyles.authBannerButtonText]}>
							Sign in
						</Text>
					</Pressable>
				</View>
			)}

			{/* Scrollable message body */}
			<View style={styles.messageBody}>
				{messages.length === 0 ? (
					<ScrollView
						contentContainerStyle={styles.emptyScrollContent}
						keyboardShouldPersistTaps="handled"
					>
						{renderEmpty()}
					</ScrollView>
				) : (
					<FlatList
						ref={flatListRef}
						style={styles.messageList}
						contentContainerStyle={styles.messageListContent}
						data={messages}
						renderItem={renderMessage}
						keyExtractor={(item: ChatMessageType) => item.id}
					/>
				)}
			</View>

			{/* Input — anchored as footer */}
			<ChatInput
				onSend={handleSend}
				onCancel={cancel}
				onNewChat={clearConversation}
				isStreaming={isStreaming}
				showNewChat={messages.length > 0}
				autoFocus={!initialPrompt}
			/>
		</View>
	);
}
