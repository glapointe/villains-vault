/**
 * MessageBox Component
 * 
 * Displays informational, warning, error, or success messages with optional title,
 * expandable content, close button, and icon. Inspired by Fluent UI's MessageBar.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { styles, getMessageBoxStyles } from './MessageBox.styles';
import { Ionicons } from '@expo/vector-icons';

/**
 * MessageBox type variants with associated colors and icons
 */
export type MessageBoxType = 'info' | 'success' | 'warning' | 'error';

/**
 * Props for the MessageBox component
 */
export interface MessageBoxProps {
	/** Message type - determines color scheme and default icon */
	type?: MessageBoxType;
	/** Optional title text displayed prominently */
	title?: string;
	/** Main message content */
	message: string;
	/** Whether the message can be expanded/collapsed (default: false) */
	expandable?: boolean;
	/** Whether to show a close button (default: false) */
	dismissible?: boolean;
	/** Callback when the message is dismissed */
	onDismiss?: () => void;
	/** Whether to show an icon (default: true) */
	showIcon?: boolean;
	/** Initial expanded state if expandable (default: false) */
	defaultExpanded?: boolean;
	/** Optional content rendered below the message (e.g. action buttons) */
	children?: React.ReactNode;
}

/**
 * MessageBox Component
 * 
 * Displays contextual messages with optional interactions.
 * Supports theming and responds to light/dark mode.
 * 
 * @example
 * <MessageBox
 *   type="warning"
 *   title="Admin Access"
 *   message="You have full administrative privileges."
 *   dismissible
 *   onDismiss={() => console.log('dismissed')}
 * />
 */
export const MessageBox: React.FC<MessageBoxProps> = ({
	type = 'info',
	title,
	message,
	expandable = false,
	dismissible = false,
	onDismiss,
	showIcon = true,
	defaultExpanded = false,
	children,
}) => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
	const [visible, setVisible] = useState<boolean>(true);
	const [fadeAnim] = useState(new Animated.Value(1));

	/**
	 * Get the icon symbol for each message type
	 * @returns Icon character for the message type
	 */
	const getIcon = (): React.ReactNode => {
		switch (type) {
			case 'success':
				return <Ionicons name="checkmark-circle" size={20} color={colors.textPrimary} />;
			case 'warning':
				return <Ionicons name="warning" size={20} color={colors.textPrimary} />;
			case 'error':
				return <Ionicons name="close-circle" size={20} color={colors.textPrimary} />;
			case 'info':
			default:
				return <Ionicons name="information-circle" size={20} color={colors.textPrimary} />;
		}
	};

	/**
	 * Handle dismiss with fade-out animation
	 * Fades out the message and calls onDismiss callback
	 */
	const handleDismiss = (): void => {
		Animated.timing(fadeAnim, {
			toValue: 0,
			duration: 200,
			useNativeDriver: true,
		}).start(() => {
			setVisible(false);
			if (onDismiss) {
				onDismiss();
			}
		});
	};

	/**
	 * Toggle expanded/collapsed state for expandable messages
	 */
	const toggleExpanded = (): void => {
		setIsExpanded(!isExpanded);
	};

	// Don't render if dismissed
	if (!visible) {
		return null;
	}

	const messageBoxStyles = getMessageBoxStyles(type, colors, isDark);

	const AnimatedView = Animated.View as any;

	return (
		<AnimatedView style={[styles.container, messageBoxStyles.container, { opacity: fadeAnim }]}>
			<View style={styles.mainContent}>
				{/* Icon */}
				{showIcon && (
					<View style={styles.iconContainer}>
						<Text style={[styles.icon, messageBoxStyles.icon]}>{getIcon()}</Text>
					</View>
				)}

				{/* Content */}
				<View style={styles.textContainer}>
					{title && (
						<Text style={[styles.title, messageBoxStyles.text]}>{title}</Text>
					)}
					{(!expandable || isExpanded) && (
						<Text style={[styles.message, messageBoxStyles.text]}>
							{message}
						</Text>
					)}
				</View>

				{/* Actions */}
				<View style={styles.actionsContainer}>
					{expandable && (
						<TouchableOpacity onPress={toggleExpanded} style={styles.actionButton}>
							<Text style={[styles.actionText, messageBoxStyles.text]}>
								{isExpanded ? '▲' : '▼'}
							</Text>
						</TouchableOpacity>
					)}
					{dismissible && (
						<TouchableOpacity onPress={handleDismiss} style={styles.actionButton}>
							<Text style={[styles.actionText, messageBoxStyles.text]}>✕</Text>
						</TouchableOpacity>
					)}
				</View>
			</View>
			{children && (
				<View style={[styles.childrenContainer, messageBoxStyles.childrenContainer]}>
					{children}
				</View>
			)}
		</AnimatedView>
	);
};
