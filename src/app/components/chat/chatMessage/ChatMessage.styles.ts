/**
 * ChatMessage Component Styles
 *
 * Styles for individual chat messages (user and assistant).
 * User messages appear right-aligned, assistant messages left-aligned.
 * Includes copy/replay action buttons below each message.
 */

import { StyleSheet, Platform } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base structure styles (theme-independent)
 */
export const styles = StyleSheet.create({
	container: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.xs,
	},
	userContainer: {
		alignItems: 'flex-end',
	},
	assistantContainer: {
		alignItems: 'flex-start',
	},
	bubble: {
		maxWidth: '85%',
		borderRadius: borderRadius.lg,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm + 2,
	},
	userBubble: {
		borderBottomRightRadius: borderRadius.sm,
	},
	assistantBubble: {
		borderBottomLeftRadius: borderRadius.sm,
	},
	userText: {
		fontSize: typography.fontSize.base,
		lineHeight: typography.fontSize.base * typography.lineHeight.normal,
	},
	assistantContent: {
		width: '100%',
	},
	streamingCursor: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.bold,
	},
	actionRow: {
		flexDirection: 'row',
		gap: spacing.xs,
		marginTop: 2,
		paddingHorizontal: spacing.xs,
	},
	actionButton: {
		padding: spacing.sm,
		borderRadius: borderRadius.md,
		...Platform.select({
			web: { cursor: 'pointer' } as any,
			default: {},
		}),
	},
	actionIcon: {
		fontSize: typography.fontSize.base,
	},
	errorContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
		marginTop: spacing.xs,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
		borderRadius: borderRadius.sm,
	},
	errorIcon: {
		fontSize: typography.fontSize.sm,
	},
	errorText: {
		fontSize: typography.fontSize.sm,
		lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
	},
	systemText: {
		fontSize: typography.fontSize.sm,
		lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
		fontStyle: 'italic',
		paddingVertical: spacing.xs,
	},
});

/**
 * Theme-aware styles
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	userBubble: {
		backgroundColor: colors.primary,
	},
	assistantBubble: {
		backgroundColor: colors.surfaceElevated,
	},
	userText: {
		color: colors.textInverse,
	},
	streamingCursor: {
		color: colors.primary,
	},
	actionButton: {
		backgroundColor: 'transparent',
	},
	actionIcon: {
		color: colors.textTertiary,
	},
	errorContainer: {
		backgroundColor: colors.errorSubtle,
	},
	errorText: {
		color: colors.error,
	},
	systemText: {
		color: colors.textTertiary,
	},
});
