/**
 * ChatInput Component
 *
 * Text input with send/cancel buttons for the chat interface.
 * Supports multiline input with auto-growing height.
 * Features a gradient border (green→purple) on focus with the send icon
 * inside the prompt box.
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Pressable, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors, palette, typography } from '../../../theme';
import { styles, getThemedStyles } from './ChatInput.styles';

interface ChatInputProps {
	/** Called when the user submits a message. */
	onSend: (text: string) => void;
	/** Called when the user cancels streaming. */
	onCancel?: () => void;
	/** Called when the user wants to start a new chat. */
	onNewChat?: () => void;
	/** Whether the assistant is currently streaming. */
	isStreaming?: boolean;
	/** Whether to show the new-chat button (e.g. when messages exist). */
	showNewChat?: boolean;
	/** Placeholder text for the input. */
	placeholder?: string;
	/** Whether the input is disabled. */
	disabled?: boolean;
	/** Auto-focus the input on mount. */
	autoFocus?: boolean;
	/** Initial value for the input. */
	initialValue?: string;
}

export function ChatInput({
	onSend,
	onCancel,
	onNewChat,
	isStreaming = false,
	showNewChat = false,
	placeholder = 'Ask about runDisney events, races, and results...',
	disabled = false,
	autoFocus = false,
	initialValue = '',
}: ChatInputProps) {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const [text, setText] = useState(initialValue);
	const [isFocused, setIsFocused] = useState(false);
	const inputRef = useRef<TextInput>(null);

	// Animate gradient border from center outward
	const gradientScale = useSharedValue(0);
	useEffect(() => {
		gradientScale.value = withTiming(isFocused ? 1 : 0, {
			duration: 300,
			easing: Easing.out(Easing.cubic),
		});
	}, [isFocused]);

	const gradientAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scaleX: gradientScale.value }],
		opacity: gradientScale.value,
	}));

	const canSend = text.trim().length > 0 && !isStreaming && !disabled;

	const handleSend = () => {
		if (!canSend) return;
		onSend(text.trim());
		setText('');
	};

	const handleKeyPress = (e: any) => {
		// Submit on Enter (without Shift) on web; Shift+Enter inserts a newline
		if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	// On web, onKeyPress fires after the newline is inserted for multiline TextInputs.
	// Use a ref-based onKeyDown listener to intercept Enter before the textarea processes it.
	useEffect(() => {
		if (Platform.OS !== 'web' || !inputRef.current) return;
		const node = inputRef.current as unknown as { _node?: HTMLTextAreaElement };
		const el = node._node ?? (inputRef.current as any);
		if (!el?.addEventListener) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				handleSend();
			}
		};

		el.addEventListener('keydown', handleKeyDown);
		return () => el.removeEventListener('keydown', handleKeyDown);
	});

	return (
		<View style={[styles.container, themedStyles.container]}>
			{/* New-chat button — shown when conversation has messages */}
			{showNewChat && (
				<Pressable
					style={[styles.newChatButton, themedStyles.newChatButton]}
					onPress={onNewChat}
					accessibilityLabel="New chat"
				>
					<Ionicons name="add-circle-outline" size={typography.fontSize.base} color={colors.textSecondary} />
					<Text style={[styles.newChatText, themedStyles.newChatText]}>New chat</Text>
				</Pressable>
			)}
			{/* Gradient border backing — animates from center outward on focus */}
			<View style={styles.gradientWrapper}>
				{/* @ts-expect-error - reanimated v4 type patches incorrectly strip children from Animated.View */}
				<Animated.View style={[styles.gradientBacking, gradientAnimatedStyle]}>
					<LinearGradient
						colors={[palette.villains.green, palette.villains.purple] as const}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						// @ts-expect-error - reanimated type patches break LinearGradient style inference
						style={{ flex: 1 }}
					/>
				</Animated.View>

				<View
					style={[
						styles.inputWrapper,
						themedStyles.inputWrapper,
						isFocused && styles.inputWrapperFocused,
					]}
				>
					<TextInput
						ref={inputRef}
						style={[styles.input, themedStyles.input]}
						value={text}
						onChangeText={setText}
						placeholder={placeholder}
						placeholderTextColor={colors.textDisabled}
						multiline
						numberOfLines={2}
						autoFocus={autoFocus}
						editable={!disabled}
						onFocus={() => setIsFocused(true)}
						onBlur={() => setIsFocused(false)}
						onKeyPress={handleKeyPress}
						onSubmitEditing={handleSend}
						blurOnSubmit={false}
					/>

					{/* Send / cancel button inside the input box */}
					{isStreaming ? (
						<Pressable
							style={[styles.inlineButton, themedStyles.cancelButton]}
							onPress={onCancel}
							accessibilityLabel="Cancel streaming"
						>
							<Text style={[styles.cancelText, themedStyles.cancelText]}>■</Text>
						</Pressable>
					) : (
						<Pressable
							style={[
								styles.inlineButton,
								themedStyles.sendButton,
								!canSend && styles.sendButtonDisabled,
							]}
							onPress={handleSend}
							disabled={!canSend}
							accessibilityLabel="Send message"
						>
							<Ionicons name="send-sharp" size={typography.fontSize.lg} color={colors.textInverse} />
						</Pressable>
					)}
				</View>
			</View>
		</View>
	);
}
