/**
 * ChatMessage Component
 *
 * Renders a single chat message (user or assistant).
 * User messages display as right-aligned bubbles with plain text.
 * Assistant messages display left-aligned with markdown content,
 * collapsible tool-call steps, and a streaming cursor.
 * Both message types have copy buttons; user messages also have a replay button.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withDelay, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { styles, getThemedStyles } from './ChatMessage.styles';
import { ChatStepList } from '../chatStepList/ChatStepList';
import { MarkdownViewer, Tooltip } from '../../ui';
import type { ChatMessage as ChatMessageType } from '../../../models/chat';

/** Single animated dot for streaming indicator */
function AnimatedDot({ color, delay }: { color: string; delay: number }) {
	const opacity = useSharedValue(0.3);

	useEffect(() => {
		opacity.value = withDelay(
			delay,
			withRepeat(
				withSequence(
					withTiming(1, { duration: 300 }),
					withTiming(0.3, { duration: 300 }),
				),
				-1,
			),
		);
	}, []);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	return (
		// @ts-expect-error - reanimated v4 type patches incorrectly strip children from Animated.View
		<Animated.View style={animatedStyle}>
			<Text style={{ color, fontSize: 18, fontWeight: '700' }}>●</Text>
		</Animated.View>
	);
}

/** Animated streaming indicator — three pulsing dots */
function StreamingDots({ color }: { color: string }) {
	return (
		<View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
			<AnimatedDot color={color} delay={0} />
			<AnimatedDot color={color} delay={200} />
			<AnimatedDot color={color} delay={400} />
		</View>
	);
}

/** Copy text to clipboard — platform-safe */
async function copyToClipboard(text: string): Promise<void> {
	if (Platform.OS === 'web') {
		await navigator.clipboard.writeText(text);
	} else {
		// Lazy-import expo-clipboard only on native to avoid web bundling issues
		const Clipboard = await import('expo-clipboard');
		await Clipboard.setStringAsync(text);
	}
}

interface ChatMessageProps {
	message: ChatMessageType;
	/** Called when the user taps the replay button on a user message. */
	onReplay?: (messageId: string) => void;
}

export function ChatMessage({ message, onReplay }: ChatMessageProps) {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(async () => {
		try {
			await copyToClipboard(message.content);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Silently fail if clipboard is unavailable
		}
	}, [message.content]);

	const isStreaming = message.isStreaming ?? false;
	const showActions = !isStreaming && message.content.length > 0;

	if (message.role === 'user') {
		return (
			<View style={[styles.container, styles.userContainer]}>
				<View style={[styles.bubble, styles.userBubble, themedStyles.userBubble]}>
					<Text style={[styles.userText, themedStyles.userText]}>
						{message.content}
					</Text>
				</View>
				{showActions && (
					<View style={styles.actionRow}>
						<Tooltip content={copied ? 'Copied!' : 'Copy message'} placement="bottom" hoverEnabled width={150}>
							<Pressable
								onPress={handleCopy}
								style={[styles.actionButton, themedStyles.actionButton]}
								accessibilityLabel="Copy message"
							>
								<Ionicons
									name={copied ? 'checkmark' : 'copy-outline'}
									size={16}
									color={colors.textTertiary}
								/>
							</Pressable>
						</Tooltip>
						{onReplay && (
							<Tooltip content="Replay from here" placement="bottom" hoverEnabled width={150}>
								<Pressable
									onPress={() => onReplay(message.id)}
									style={[styles.actionButton, themedStyles.actionButton]}
									accessibilityLabel="Replay from here"
								>
									<Ionicons name="refresh-outline" size={16} color={colors.textTertiary} />
								</Pressable>
							</Tooltip>
						)}
					</View>
				)}
			</View>
		);
	}

	// System message (e.g. "Response cancelled.")
	if (message.role === 'system') {
		return (
			<View style={[styles.container, styles.assistantContainer]}>
				<Text style={[styles.systemText, themedStyles.systemText]}>
					{message.content}
				</Text>
			</View>
		);
	}

	// Assistant message
	const hasSteps = (message.steps?.length ?? 0) > 0;
	const hasContent = message.content.length > 0;

	return (
		<View style={[styles.container, styles.assistantContainer]}>
			<View style={[styles.bubble, styles.assistantBubble, themedStyles.assistantBubble]}>
				<View style={styles.assistantContent}>
					{hasSteps && (
						<ChatStepList steps={message.steps!} isStreaming={isStreaming} />
					)}

					{hasContent && (
						<MarkdownViewer>{message.content}</MarkdownViewer>
					)}

					{isStreaming && !hasContent && !hasSteps && (
						<StreamingDots color={colors.primary} />
					)}

					{isStreaming && hasContent && (
						<Text style={[styles.streamingCursor, themedStyles.streamingCursor]}> ▌</Text>
					)}
				</View>
			</View>
			{showActions && (
				<View style={styles.actionRow}>
					<Tooltip content={copied ? 'Copied!' : 'Copy response'} placement="bottom" hoverEnabled width={150}>
						<Pressable
							onPress={handleCopy}
							style={[styles.actionButton, themedStyles.actionButton]}
							accessibilityLabel="Copy response"
						>
							<Ionicons
								name={copied ? 'checkmark' : 'copy-outline'}
								size={16}
								color={colors.textTertiary}
							/>
						</Pressable>
					</Tooltip>
				</View>
			)}
		</View>
	);
}
