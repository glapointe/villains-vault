/**
 * ChatPromptBar Component
 *
 * A lightweight prompt bar that appears on non-chat pages.
 * In "navigate" mode (home page), tapping navigates to the chat page.
 * In "modal" mode (race/results pages), tapping opens a Panel with the chat interface.
 * Shows a context-aware suggestions dropdown when the input is focused.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, TextInput, Platform, Keyboard, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors, palette, typography } from '../../../theme';
import { styles, getThemedStyles } from './ChatPromptBar.styles';
import { useChatEnabled } from '../../../hooks/useChatEnabled';
import { useAuth } from '../../../hooks/useAuth';
import { Panel } from '../../ui';
import { ChatInterface } from '../chatInterface/ChatInterface';
import { getSuggestions, inferSuggestionContext } from '../chatSuggestions';
import type { Suggestion } from '../chatSuggestions';
import type { ChatContext } from '../../../models/chat';
import { Ionicons } from '@expo/vector-icons';

type ChatPromptBarMode = 'navigate' | 'modal';

interface ChatPromptBarProps {
	/** "navigate" opens chat page, "modal" opens Panel */
	mode: ChatPromptBarMode;
	/** Context to pass to the chat (race, event, page info). */
	context?: ChatContext;
	/** Placeholder text. */
	placeholder?: string;
}

export function ChatPromptBar({
	mode,
	context,
	placeholder = 'Ask about runDisney events and results...',
}: ChatPromptBarProps) {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const router = useRouter();
	const { enabled, isLoading } = useChatEnabled();
	const { isAuthenticated } = useAuth();
	const [isPanelOpen, setIsPanelOpen] = useState(false);
	const [pendingPrompt, setPendingPrompt] = useState<string | undefined>();
	const [pendingInstructions, setPendingInstructions] = useState<string | undefined>();
	const [inputText, setInputText] = useState('');
	const [isFocused, setIsFocused] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);
	const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const inputRef = useRef<TextInput>(null);
	const { height: screenHeight } = useWindowDimensions();

	const suggestions = getSuggestions(inferSuggestionContext(context), isAuthenticated);

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

	// Show dropdown when focused and input is empty (or very short)
	useEffect(() => {
		setShowDropdown(isFocused && inputText.trim().length === 0);
	}, [isFocused, inputText]);

	const handleSubmit = useCallback((text?: string, instructions?: string) => {
		const prompt = text || inputText.trim();
		if (!prompt) return;

		setShowDropdown(false);

		if (mode === 'navigate') {
			if (Platform.OS === 'web' && typeof window !== 'undefined') {
				// Store in sessionStorage so the prompt never appears in the address bar
				const payload: Record<string, string> = { prompt };
				if (instructions) payload.instructions = instructions;
				sessionStorage.setItem('pendingChatPrompt', JSON.stringify(payload));
				router.push('/(tabs)/chat');
			} else {
				const params: Record<string, string> = { prompt };
				if (instructions) params.instructions = instructions;
				router.push({ pathname: '/(tabs)/chat', params });
			}
		} else {
			setPendingPrompt(prompt);
			setPendingInstructions(instructions);
			setIsPanelOpen(true);
			setInputText('');
		}
	}, [mode, inputText, router]);

	const handleSuggestionPress = useCallback((suggestion: Suggestion) => {
		// Clear the blur timeout so the dropdown dismiss doesn't race
		if (blurTimeoutRef.current) {
			clearTimeout(blurTimeoutRef.current);
			blurTimeoutRef.current = null;
		}
		setShowDropdown(false);
		setInputText('');
		handleSubmit(suggestion.prompt, suggestion.instructions);
	}, [handleSubmit]);

	const handleKeyPress = useCallback((e: any) => {
		if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	}, [handleSubmit]);

	const handleFocus = useCallback(() => {
		if (blurTimeoutRef.current) {
			clearTimeout(blurTimeoutRef.current);
			blurTimeoutRef.current = null;
		}
		setIsFocused(true);
	}, []);

	const handleBlur = useCallback(() => {
		// Delay blur so suggestion press can fire first.
		// Native needs a longer delay since onPressIn fires after blur on some devices.
		const delay = Platform.OS === 'web' ? 150 : 400;
		blurTimeoutRef.current = setTimeout(() => {
			setIsFocused(false);
			setShowDropdown(false);
		}, delay);
	}, []);

	const handleBackdropPress = useCallback(() => {
		if (blurTimeoutRef.current) {
			clearTimeout(blurTimeoutRef.current);
			blurTimeoutRef.current = null;
		}
		inputRef.current?.blur();
		Keyboard.dismiss();
		setIsFocused(false);
		setShowDropdown(false);
	}, []);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
		};
	}, []);

	// Don't render until we know chat is enabled (after all hooks)
	if (isLoading || !enabled) return null;

	/** Shared input bar + dropdown renderer */
	const renderInputBar = () => (
		<View>
		{/* Backdrop to dismiss input/dropdown when tapping outside on native */}
		{Platform.OS !== 'web' && isFocused && (
				<Pressable
					style={{
						position: 'absolute',
						top: -screenHeight,
						left: -9999,
						right: -9999,
						height: screenHeight * 3,
						zIndex: 10,
					}}
					onPress={handleBackdropPress}
				/>
			)}
			<View style={styles.barContainer}>
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
					<View style={[styles.bar, themedStyles.bar, !isFocused && themedStyles.barBorder]}>
						<Text style={styles.icon}>💬</Text>
						<TextInput
							ref={inputRef}
							style={[styles.placeholderText, { color: colors.textPrimary }]}
							placeholder={placeholder}
							placeholderTextColor={colors.textDisabled}
							value={inputText}
							onChangeText={setInputText}
							onSubmitEditing={() => handleSubmit()}
							onKeyPress={handleKeyPress}
							onFocus={handleFocus}
							onBlur={handleBlur}
							blurOnSubmit={false}
						/>
						{inputText.trim() ? (
							<Pressable onPress={() => handleSubmit()}>
								<Text style={[styles.badge, themedStyles.badge]}>
									<Ionicons name="send-sharp" size={typography.fontSize.sm} />
								</Text>
							</Pressable>
						) : (
							<Text style={[styles.badge, themedStyles.badge]}>AI</Text>
						)}
					</View>
				</View>
			</View>

			{/* Suggestions dropdown — rendered in normal flow so touches work on native */}
			{showDropdown && suggestions.length > 0 && (
				<View style={[styles.dropdown, themedStyles.dropdown]}>
					{suggestions.map((suggestion) => (
							<Pressable
								key={suggestion.prompt}
								style={({ hovered }: any) => [
									styles.dropdownItem,
									themedStyles.dropdownItem,
									hovered && themedStyles.dropdownItemHovered,
								]}
								onPress={() => handleSuggestionPress(suggestion)}
							>
								<Ionicons
									name="chatbubble-ellipses-outline"
									size={typography.fontSize.sm}
									color={colors.textTertiary}
									style={styles.dropdownItemIcon}
								/>
								<Text
									style={[styles.dropdownItemText, themedStyles.dropdownItemText]}
									numberOfLines={2}
								>
									{suggestion.prompt}
								</Text>
							</Pressable>
					))}
				</View>
			)}
		</View>
	);

	// Navigate mode
	if (mode === 'navigate') {
		return <View style={styles.container}>{renderInputBar()}</View>;
	}

	// Modal mode
	return (
		<>
			<View style={styles.container}>{renderInputBar()}</View>

			<Panel
				isOpen={isPanelOpen}
				onClose={() => {
					setIsPanelOpen(false);
					setPendingPrompt(undefined);
					setPendingInstructions(undefined);
				}}
				headerTitle="AI Chat"
				width="xLarge"
				scrollable={false}
			>
				<ChatInterface
					initialPrompt={pendingPrompt}
					context={pendingInstructions ? { ...context, supplementalInstructions: pendingInstructions } : context}
					compact
				/>
			</Panel>
		</>
	);
}
