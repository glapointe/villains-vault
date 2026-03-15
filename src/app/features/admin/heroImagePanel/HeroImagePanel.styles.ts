/**
 * HeroImagePanel Component Styles
 *
 * Theme-aware styles for hero image management panel component.
 * Uses design tokens from theme for consistent styling.
 */

import { StyleSheet, Platform } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base hero image panel structure (theme-independent)
 */
export const styles = StyleSheet.create({
	scrollContent: {
		paddingBottom: spacing.xl,
	},
	headerSection: {
		marginBottom: spacing.lg,
	},
	description: {
		fontSize: typography.fontSize.sm,
		lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
		marginBottom: spacing.md,
	},
	uploadRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.md,
	},
	imageCount: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.medium,
	},
	uploadingRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		marginTop: spacing.sm,
	},
	uploadingText: {
		fontSize: typography.fontSize.sm,
		fontStyle: 'italic',
	},
	emptyState: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: spacing['2xl'],
	},
	emptyText: {
		fontSize: typography.fontSize.base,
		textAlign: 'center',
	},
	emptySubtext: {
		fontSize: typography.fontSize.sm,
		textAlign: 'center',
		marginTop: spacing.xs,
	},
	grid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.md,
	},
	imageCard: {
		borderRadius: borderRadius.md,
		overflow: 'hidden',
		borderWidth: 1,
		...Platform.select({
			web: {
				width: 'calc(33.333% - 11px)' as unknown as number,
			},
			default: {
				width: '100%',
			},
		}),
	},
	thumbnail: {
		width: '100%',
		aspectRatio: 16 / 9,
	},
	imageFooter: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
	},
	imageDate: {
		fontSize: typography.fontSize.xs,
	},
	deleteButton: {
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
		borderRadius: borderRadius.sm,
	},
	deleteButtonText: {
		fontSize: typography.fontSize.xs,
		fontWeight: typography.fontWeight.semibold,
	},
});

/**
 * Theme-dependent hero image panel styles
 */
export const getThemedStyles = (colors: ThemeColors) =>
	StyleSheet.create({
		description: {
			color: colors.textSecondary,
		},
		imageCount: {
			color: colors.textSecondary,
		},
		uploadingText: {
			color: colors.textSecondary,
		},
		emptyText: {
			color: colors.textSecondary,
		},
		emptySubtext: {
			color: colors.textTertiary,
		},
		imageCard: {
			borderColor: colors.border,
			backgroundColor: colors.surface,
		},
		imageFooter: {
			backgroundColor: colors.surface,
		},
		imageDate: {
			color: colors.textTertiary,
		},
		deleteButton: {
			backgroundColor: colors.errorSubtle,
		},
		deleteButtonText: {
			color: colors.error,
		},
	});
