/**
 * ChatInput Component Styles
 *
 * Theme-aware styles for the chat text input and send button.
 * Features a 2-line minimum height input with a gradient border effect
 * achieved via a LinearGradient backing behind the input box.
 * The send button sits inside the input wrapper.
 */

import { StyleSheet, Platform } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/** Approximate height of 2 lines of text + padding */
const TWO_LINE_HEIGHT = Math.ceil(typography.fontSize.base * typography.lineHeight.normal * 2);

/** Width of the gradient border effect (how much the backing peeks out) */
export const GRADIENT_BORDER_WIDTH = 2;

/**
 * Base structure styles (theme-independent)
 */
export const styles = StyleSheet.create({
	container: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderTopWidth: 1,
	},
	/** Wraps the gradient backing + the input box */
	gradientWrapper: {
		position: 'relative',
	},
	/** The gradient that sits behind the input to create a border effect */
	gradientBacking: {
		...StyleSheet.absoluteFillObject,
		borderRadius: borderRadius.lg + GRADIENT_BORDER_WIDTH,
		// Expand beyond the input by GRADIENT_BORDER_WIDTH on all sides
		top: -GRADIENT_BORDER_WIDTH,
		left: -GRADIENT_BORDER_WIDTH,
		right: -GRADIENT_BORDER_WIDTH,
		bottom: -GRADIENT_BORDER_WIDTH,
		overflow: 'hidden',
	},
	inputWrapper: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		borderRadius: borderRadius.lg,
		borderWidth: 1,
		paddingLeft: spacing.md,
		paddingRight: spacing.xs,
		paddingVertical: Platform.OS === 'web' ? spacing.sm : spacing.xs,
		minHeight: TWO_LINE_HEIGHT + spacing.sm * 2,
		maxHeight: 150,
		// Ensure the input sits above the gradient backing
		position: 'relative',
		zIndex: 1,
	},
	/** When focused, hide the normal border so only the gradient shows */
	inputWrapperFocused: {
		borderColor: 'transparent',
	},
	input: {
		flex: 1,
		fontSize: typography.fontSize.base,
		lineHeight: typography.fontSize.base * typography.lineHeight.normal,
		maxHeight: 130,
		minHeight: TWO_LINE_HEIGHT,
		...Platform.select({
			web: {
				outlineStyle: 'none',
			} as any,
			default: {},
		}),
	},
	/** Send / cancel button sitting inside the input box */
	inlineButton: {
		width: 32,
		height: 32,
		borderRadius: borderRadius.full,
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: spacing.xs,
		marginBottom: Platform.OS === 'web' ? 0 : 2,
		...Platform.select({
			web: { cursor: 'pointer' } as any,
			default: {},
		}),
	},
	sendButtonDisabled: {
		opacity: 0.4,
	},
	cancelText: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.bold,
	},
	/** New-chat button above the input */
	newChatButton: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'flex-end',
		gap: spacing.xs,
		paddingVertical: spacing.xs,
		paddingHorizontal: spacing.sm,
		marginBottom: spacing.xs,
		borderRadius: borderRadius.sm,
		...Platform.select({
			web: { cursor: 'pointer' } as any,
			default: {},
		}),
	},
	newChatText: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.medium,
	},
});

/**
 * Theme-aware styles
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	container: {
		borderTopColor: colors.border,
		backgroundColor: colors.background,
	},
	inputWrapper: {
		backgroundColor: colors.surface,
		borderColor: colors.border,
	},
	input: {
		color: colors.textPrimary,
	},
	sendButton: {
		backgroundColor: colors.buttonPrimary,
	},
	cancelButton: {
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	cancelText: {
		color: colors.textSecondary,
	},
	newChatButton: {
		backgroundColor: 'transparent',
	},
	newChatText: {
		color: colors.textSecondary,
	},
});
