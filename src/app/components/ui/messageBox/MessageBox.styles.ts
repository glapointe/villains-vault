/**
 * MessageBox Component Styles
 * 
 * Styles for the MessageBox component with theme-aware color schemes
 * for different message types (info, success, warning, error).
 */

import { StyleSheet } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';
import type { MessageBoxType } from './MessageBox';

/**
 * Base styles for MessageBox component structure
 */
export const styles = StyleSheet.create({
	container: {
		borderRadius: borderRadius.md,
		borderWidth: 1,
		padding: spacing.sm,
		marginBottom: spacing.md,
	},
	mainContent: {
		flexDirection: 'row',
		alignItems: 'flex-start',
	},
	iconContainer: {
		marginRight: spacing.sm,
		paddingTop: 0,
		height: 24,
		justifyContent: 'center',
	},
	icon: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.bold,
		lineHeight: typography.fontSize.lg, // 1x for icon alignment
	},
	textContainer: {
		flex: 1,
		paddingRight: spacing.xs,
	},
	title: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.semibold,
		marginBottom: spacing.xs,
	},
	message: {
		fontSize: typography.fontSize.sm,
		lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
	},
	actionsContainer: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: spacing.xs,
	},
	childrenContainer: {
		marginTop: spacing.sm,
		paddingTop: spacing.sm,
		borderTopWidth: StyleSheet.hairlineWidth,
	},
	actionButton: {
		padding: spacing.xs,
		minWidth: 24,
		alignItems: 'center',
		justifyContent: 'center',
	},
	actionText: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.semibold,
	},
});

/**
 * Color scheme definitions for each message type
 * Returns theme-aware colors based on message type and current theme
 */
export const getMessageBoxStyles = (type: MessageBoxType, colors: ThemeColors, isDark: boolean) => {
	const schemes = {
		info: {
			light: {
				background: colors.infoSubtle,
				border: colors.info,
				text: '#0c4a6e',
			},
			dark: {
				background: '#0c4a6e',
				border: colors.info,
				text: '#e0f2fe',
			},
		},
		success: {
			light: {
				background: colors.successSubtle,
				border: colors.success,
				text: '#065f46',
			},
			dark: {
				background: '#065f46',
				border: colors.success,
				text: '#d1fae5',
			},
		},
		warning: {
			light: {
				background: colors.warningSubtle,
				border: colors.warning,
				text: '#92400e',
			},
			dark: {
				background: '#92400e',
				border: colors.warning,
				text: '#fef3c7',
			},
		},
		error: {
			light: {
				background: colors.errorSubtle,
				border: colors.error,
				text: '#991b1b',
			},
			dark: {
				background: '#991b1b',
				border: colors.error,
				text: '#fee2e2',
			},
		},
	};

	const scheme = schemes[type][isDark ? 'dark' : 'light'];

	return StyleSheet.create({
		container: {
			backgroundColor: scheme.background,
			borderColor: scheme.border,
		},
		text: {
			color: scheme.text,
		},
		icon: {
			color: scheme.text,
		},
		childrenContainer: {
			borderTopColor: scheme.border,
		},
	});
};
