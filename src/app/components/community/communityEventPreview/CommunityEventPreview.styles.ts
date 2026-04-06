/**
 * CommunityEventPreview Styles
 * 
 * Theme-aware styles for the community event sidebar preview on the home page.
 */

import { StyleSheet } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/** Base structure styles (theme-independent) */
export const styles = StyleSheet.create({
	container: {
		marginBottom: spacing.lg,
	},
	eventCard: {
		padding: spacing.md,
		borderRadius: borderRadius.md,
		marginBottom: spacing.sm,
		borderWidth: 1,
	},
	eventTitle: {
		fontSize: typography.fontSize.md,
		fontWeight: typography.fontWeight.semibold,
		marginBottom: spacing.xxs,
	},
	titleLink: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xxs,
		marginBottom: spacing.xxs,
	},
	eventMeta: {
		fontSize: typography.fontSize.sm,
		marginBottom: spacing.xxs,
	},
	participantCount: {
		fontSize: typography.fontSize.xs,
	},
	actionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		marginTop: spacing.sm,
	},
	viewAllRow: {
		alignItems: 'center',
		marginTop: spacing.sm,
	},
	viewAllText: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.medium,
	},
	emptyText: {
		fontSize: typography.fontSize.sm,
		textAlign: 'center',
		paddingVertical: spacing.md,
	},
	loadingContainer: {
		paddingVertical: spacing.md,
		alignItems: 'center',
	},
	loginPrompt: {
		fontSize: typography.fontSize.sm,
		fontStyle: 'italic',
		paddingBottom: spacing.md,
	},
	locationRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xxs,
	},
	goingBadge: {
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.sm,
		borderRadius: borderRadius.sm,
		flexDirection: 'row',
		alignItems: 'baseline',
		gap: spacing.xxs,
	},
	goingText: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.medium,
	},
});

/** Themed styles (color-dependent) */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	eventCard: {
		backgroundColor: colors.surface,
		borderColor: colors.border,
	},
	eventTitle: {
		color: colors.textPrimary,
	},
	eventTitleLink: {
		color: colors.primary,
	},
	eventTitleLinkHovered: {
		color: colors.primary,
		textDecorationLine: 'underline' as const,
	},
	eventMeta: {
		color: colors.textSecondary,
	},
	participantCount: {
		color: colors.textTertiary,
	},
	participantCountLink: {
		color: colors.primary,
	},
	participantCountLinkHovered: {
		color: colors.primary,
		textDecorationLine: 'underline' as const,
	},
	viewAllText: {
		color: colors.primary,
	},
	viewAllTextHovered: {
		color: colors.primary,
		textDecorationLine: 'underline' as const,
	},
	emptyText: {
		color: colors.textTertiary,
	},
	loginPrompt: {
		color: colors.textSecondary,
	},
	locationText: {
		color: colors.textSecondary,
	},
	goingBadge: {
		backgroundColor: colors.successSubtle,
	},
	goingText: {
		color: colors.success,
	},
});
