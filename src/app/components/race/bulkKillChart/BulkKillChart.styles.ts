/**
 * Bulk Kill Chart component styles
 *
 * Theme-aware styles for the bulk kill chart panel and bib input dialog.
 * Uses design tokens from theme for consistent styling.
 */

import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base bulk kill chart structure (theme-independent)
 */
const baseStyles = {
	panelContent: {
		gap: spacing.lg,
	},
	bibInputRow: {
		flexDirection: 'row' as const,
		alignItems: 'center' as const,
		gap: spacing.sm,
		flexWrap: 'wrap' as const,
	},
	bibInput: {
		flex: 1,
		minWidth: 200,
		borderWidth: 1,
		borderRadius: borderRadius.md,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		fontSize: typography.fontSize.base,
		lineHeight: typography.fontSize.base * typography.lineHeight.normal,
	},
	buttonRow: {
		flexDirection: 'row' as const,
		gap: spacing.sm,
	},
	chartsContainer: {
		gap: spacing.xl,
	},
	chartWrapper: {
		borderWidth: 1,
		borderRadius: borderRadius.lg,
		overflow: 'hidden' as const,
	},
	chartLabel: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.semibold,
		paddingHorizontal: spacing.md,
		paddingTop: spacing.sm,
		paddingBottom: spacing.xs,
	},
	errorText: {
		fontSize: typography.fontSize.sm,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	loadingRow: {
		flexDirection: 'row' as const,
		alignItems: 'center' as const,
		gap: spacing.sm,
		paddingVertical: spacing.md,
	},
	loadingText: {
		fontSize: typography.fontSize.sm,
	},
	emptyText: {
		fontSize: typography.fontSize.base,
		textAlign: 'center' as const,
		paddingVertical: spacing.xl,
	},
	dialogInput: {
		borderWidth: 1,
		borderRadius: borderRadius.md,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		fontSize: typography.fontSize.base,
		lineHeight: typography.fontSize.base * typography.lineHeight.normal,
		marginTop: spacing.sm,
		width: '100%' as const,
	},
	dialogHint: {
		fontSize: typography.fontSize.sm,
		marginTop: spacing.xs,
	},
	footerRow: {
		flexDirection: 'row' as const,
		justifyContent: 'flex-end' as const,
		gap: spacing.sm,
	},
};

/**
 * Create theme-aware styles based on current color scheme
 */
export const createStyles = (colors: ThemeColors) => {
	return {
		...baseStyles,
		bibInput: {
			...baseStyles.bibInput,
			borderColor: colors.border,
			backgroundColor: colors.surface,
			color: colors.textPrimary,
		},
		chartWrapper: {
			...baseStyles.chartWrapper,
			borderColor: colors.border,
			backgroundColor: colors.surface,
		},
		chartLabel: {
			...baseStyles.chartLabel,
			color: colors.textPrimary,
		},
		errorText: {
			...baseStyles.errorText,
			color: colors.error,
		},
		loadingText: {
			...baseStyles.loadingText,
			color: colors.textSecondary,
		},
		emptyText: {
			...baseStyles.emptyText,
			color: colors.textTertiary,
		},
		dialogInput: {
			...baseStyles.dialogInput,
			borderColor: colors.border,
			backgroundColor: colors.surface,
			color: colors.textPrimary,
		},
		dialogHint: {
			...baseStyles.dialogHint,
			color: colors.textTertiary,
		},
	};
};
