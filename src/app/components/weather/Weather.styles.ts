/**
 * Weather component styles
 * 
 * Theme-aware styles for weather display component
 * Uses design tokens from theme for consistent styling
 */

import { StyleSheet } from 'react-native';
import { spacing, typography, borderRadius, shadows } from '../../theme';
import type { ThemeColors } from '../../theme';

/**
 * Base weather component structure (theme-independent)
 */
const baseStyles = {
	container: {
		padding: spacing.sm,
        paddingHorizontal: spacing.md,
	},
	tilesWrapper: {
		flexDirection: 'row' as const,
		flexWrap: 'wrap' as const,
		gap: spacing.sm,
	},
	card: {
		padding: spacing.sm,
		...shadows.sm,
		minWidth: 280,
		maxWidth: 425,
        flex: 1,
	},
	title: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.semibold,
		marginBottom: spacing.xs,
	},
	sectionTitle: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.semibold,
		marginBottom: spacing.xs,
	},
	summaryRow: {
		flexDirection: 'row' as const,
		justifyContent: 'space-between' as const,
		marginBottom: spacing.xs,
		gap: spacing.xs,
        paddingHorizontal: spacing.sm
	},
	summaryLabel: {
		fontSize: typography.fontSize.xs,
		flex: 1,
	},
	summaryValue: {
		fontSize: typography.fontSize.xs,
		fontWeight: typography.fontWeight.medium,
		textAlign: 'right' as const,
	},
	chartContainer: {
		marginVertical: spacing.xs,
		width: '100%',
		minHeight: 200,
	},
	chartLegend: {
		textAlign: 'center' as const,
		marginTop: -10,
		fontSize: typography.fontSize.xs,
	},
	loadingContainer: {
		padding: spacing.xl,
		alignItems: 'center' as const,
		justifyContent: 'center' as const,
	},
	loadingText: {
		marginTop: spacing.sm,
	},
};

/**
 * Create theme-aware styles based on current color scheme
 */
export const createStyles = (colors: ThemeColors, isDark: boolean) => {
	return {
		...baseStyles,
		card: {
			...baseStyles.card,
			backgroundColor: colors.surface,
		},
		title: {
			...baseStyles.title,
			color: colors.textPrimary,
		},
		sectionTitle: {
			...baseStyles.sectionTitle,
			color: colors.textPrimary,
		},
		summaryLabel: {
			...baseStyles.summaryLabel,
			color: colors.textSecondary,
		},
		summaryValue: {
			...baseStyles.summaryValue,
			color: colors.textPrimary,
		},
		chartLegend: {
			...baseStyles.chartLegend,
			color: colors.textSecondary,
		},
		loadingText: {
			...baseStyles.loadingText,
			color: colors.textSecondary,
		},
	};
};
