/**
 * ChatInterface Component Styles
 *
 * Styles for the main chat container that holds the message list,
 * input area, and header. Full-height layout with scroll.
 */

import { StyleSheet, Platform } from 'react-native';
import { spacing, typography, borderRadius, shadows } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base structure styles (theme-independent)
 */
export const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderBottomWidth: 1,
	},
	headerLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
	},
	headerTitle: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.semibold,
		lineHeight: typography.fontSize.lg * typography.lineHeight.normal,
	},
	headerBadge: {
		fontSize: typography.fontSize.xs,
		fontWeight: typography.fontWeight.medium,
		paddingHorizontal: spacing.sm,
		paddingVertical: 2,
		borderRadius: borderRadius.full,
		overflow: 'hidden',
	},
	clearButton: {
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
		borderRadius: borderRadius.sm,
		...Platform.select({
			web: { cursor: 'pointer' } as any,
			default: {},
		}),
	},
	clearButtonText: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.medium,
	},
	messageBody: {
		flex: 1,
	},
	emptyScrollContent: {
		flexGrow: 1,
	},
	messageList: {
		flex: 1,
	},
	messageListContent: {
		paddingVertical: spacing.md,
	},
	emptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: spacing.xl,
	},
	emptyIcon: {
		fontSize: 48,
		marginBottom: spacing.md,
	},
	emptyTitle: {
		fontSize: typography.fontSize.xl,
		fontWeight: typography.fontWeight.semibold,
		marginBottom: spacing.sm,
		textAlign: 'center',
	},
	emptySubtitle: {
		fontSize: typography.fontSize.base,
		lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
		textAlign: 'center',
		maxWidth: 400,
	},
	suggestionsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.sm,
		marginTop: spacing.lg,
		justifyContent: 'center',
		maxWidth: 500,
	},
	suggestionChip: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderRadius: borderRadius.lg,
		borderWidth: 1,
		...Platform.select({
			web: { cursor: 'pointer' } as any,
			default: {},
		}),
	},
	suggestionText: {
		fontSize: typography.fontSize.sm,
		lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
	},
	authBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderBottomWidth: 1,
	},
	authBannerText: {
		fontSize: typography.fontSize.sm,
		lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
		flex: 1,
	},
	authBannerButton: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.xs,
		borderRadius: borderRadius.sm,
		marginLeft: spacing.sm,
	},
	authBannerButtonText: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.semibold,
	},
});

/**
 * Theme-aware styles
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	container: {
		backgroundColor: colors.background,
	},
	header: {
		borderBottomColor: colors.border,
		backgroundColor: colors.surface,
	},
	headerTitle: {
		color: colors.textPrimary,
	},
	headerBadge: {
		backgroundColor: colors.primarySubtle,
		color: colors.primary,
	},
	clearButton: {
		backgroundColor: colors.buttonGhost,
	},
	clearButtonText: {
		color: colors.textSecondary,
	},
	emptyTitle: {
		color: colors.textPrimary,
	},
	emptySubtitle: {
		color: colors.textSecondary,
	},
	suggestionChip: {
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	suggestionText: {
		color: colors.textSecondary,
	},
	authBanner: {
		borderBottomColor: colors.border,
		backgroundColor: colors.infoSubtle,
	},
	authBannerText: {
		color: colors.textSecondary,
	},
	authBannerButton: {
		backgroundColor: colors.primary,
	},
	authBannerButtonText: {
		color: colors.textInverse,
	},
});
