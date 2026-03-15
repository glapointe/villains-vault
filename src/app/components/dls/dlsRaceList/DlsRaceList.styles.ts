/**
 * DlsRaceList Component Styles
 * 
 * Theme-aware styles for the DLS race declaration list.
 * Displays upcoming DLS races with declaration counts and quick-declare buttons.
 * Uses design tokens from theme for consistent styling.
 */

import { StyleSheet, Platform } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base DLS race list structure (theme-independent)
 */
export const styles = StyleSheet.create({
	container: {
		marginBottom: spacing.lg,
	},
	loginPrompt: {
		fontSize: typography.fontSize.sm,
		fontStyle: 'italic',
		paddingBottom: spacing.md,
	},
	raceCard: {
		padding: spacing.md,
		borderRadius: borderRadius.md,
		marginBottom: spacing.sm,
		borderWidth: 1,
	},
	raceInfo: {
		marginBottom: spacing.sm,
	},
	raceName: {
		fontSize: typography.fontSize.md,
		fontWeight: typography.fontWeight.semibold,
		marginBottom: spacing.xxs,
	},
	raceDate: {
		fontSize: typography.fontSize.sm,
		marginBottom: spacing.xxs,
	},
	declarationCount: {
		fontSize: typography.fontSize.xs,
	},
	actionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
	},
	declaredBadge: {
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.sm,
		borderRadius: borderRadius.sm,
		flexDirection: 'row',
		alignItems: 'baseline',
		gap: spacing.xxs,
	},
	declaredText: {
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
});

/**
 * Themed DLS race list styles (color-dependent)
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	loginPrompt: {
		color: colors.textSecondary,
	},
	raceCard: {
		backgroundColor: colors.surface,
		borderColor: colors.border,
	},
	raceName: {
		color: colors.textPrimary,
	},
	raceDate: {
		color: colors.textSecondary,
	},
	declarationCount: {
		color: colors.textTertiary,
	},
	declarationCountLink: {
		color: colors.primary,
	},
	declarationCountLinkHover: {
		color: colors.primary,
		textDecorationLine: 'underline',
	},
	declaredBadge: {
		backgroundColor: colors.successSubtle,
	},
	declaredText: {
		color: colors.success,
	},
	emptyText: {
		color: colors.textTertiary,
	},
});
