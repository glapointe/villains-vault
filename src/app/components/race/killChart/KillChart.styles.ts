/**
 * Kill Chart component styles
 * 
 * Theme-aware styles for kill chart display component
 * Uses design tokens from theme for consistent styling
 */

import { StyleSheet } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base kill chart component structure (theme-independent)
 */
const baseStyles = {
	container: {
		padding: spacing.md,
		borderRadius: borderRadius.lg,
	},
	loadingContainer: {
		alignItems: 'center' as const,
		justifyContent: 'center' as const,
		padding: spacing.xl,
		minHeight: 200,
	},
	header: {
		marginBottom: spacing.lg,
	},
	headerHidden: {
		borderBottomWidth: 0,
		paddingBottom: 0,
	},
	titleRow: {
		flexDirection: 'row' as const,
		alignItems: 'baseline' as const,
		gap: spacing.sm,
	},
	title: {
		fontSize: typography.fontSize.xl,
		fontWeight: typography.fontWeight.bold,
		marginBottom: spacing.md,
	},
    titleNickname: {
        fontSize: typography.fontSize.sm,
        fontStyle: 'italic' as const,
		paddingLeft: spacing.sm,
    },
	filterRow: {
		flexDirection: 'row' as const,
		flexWrap: 'wrap' as const,
		alignItems: 'center' as const,
		gap: spacing.md,
		marginBottom: spacing.md,
		flex: 1,
	},
	dropdown: {
		flex: 1,
		maxWidth: 250,
	},
	loadingIndicator: {
		flexDirection: 'row' as const,
		alignItems: 'center' as const,
		gap: spacing.sm,
	},
	loadingText: {
		fontSize: typography.fontSize.sm,
	},
	statsRow: {
		flexDirection: 'row' as const,
		flexWrap: 'wrap' as const,
		gap: spacing.xl,
		marginTop: spacing.md,
	},
	stat: {
		alignItems: 'center' as const,
	},
	statValue: {
		fontSize: typography.fontSize['3xl'],
		fontWeight: typography.fontWeight.bold,
	},
	statLabel: {
		fontSize: typography.fontSize.sm,
		marginTop: spacing.xs,
	},
	legend: {
		flexDirection: 'row' as const,
		flexWrap: 'wrap' as const,
		gap: spacing.lg,
		marginBottom: spacing.lg,
		paddingHorizontal: spacing.md,
	},
	legendItem: {
		flexDirection: 'row' as const,
		alignItems: 'center' as const,
		gap: spacing.sm,
	},
	legendDot: {
		width: 12,
		height: 12,
		borderRadius: 6,
	},
	legendText: {
		fontSize: typography.fontSize.sm,
	},
	errorContainer: {
		padding: spacing.md,
		borderRadius: borderRadius.md,
		marginTop: spacing.md,
	},
	errorText: {
		fontSize: typography.fontSize.sm,
	},
	dnfNote: {
		marginBottom: spacing.md,
		padding: spacing.sm,
		borderRadius: borderRadius.md,
	},
	dnfNoteText: {
		fontSize: typography.fontSize.sm,
		fontStyle: 'italic' as const,
		textAlign: 'center' as const,
	},
};

/**
 * Create theme-aware styles based on current color scheme
 */
export const createStyles = (colors: ThemeColors, isDark: boolean) => {
	return {
		...baseStyles,
		container: {
			...baseStyles.container,
			backgroundColor: colors.surface,
		},
		header: {
			...baseStyles.header,
			borderBottomWidth: 1,
			borderBottomColor: colors.border,
			paddingBottom: spacing.md,
		},
		headerHidden: {
			...baseStyles.headerHidden,
		},
		title: {
			...baseStyles.title,
			color: colors.textPrimary,
		},
		loadingText: {
			...baseStyles.loadingText,
			color: colors.textSecondary,
		},
		killValue: {
			...baseStyles.statValue,
			color: '#f97316', // orange-500
		},
		assassinValue: {
			...baseStyles.statValue,
			color: '#22c55e', // green-500
		},
		statLabel: {
			...baseStyles.statLabel,
			color: colors.textSecondary,
		},
		legendText: {
			...baseStyles.legendText,
			color: colors.textSecondary,
		},
		errorContainer: {
			...baseStyles.errorContainer,
			backgroundColor: colors.error,
		},
		errorText: {
			...baseStyles.errorText,
			color: colors.textInverse,
		},
		dnfNote: {
			...baseStyles.dnfNote,
			backgroundColor: colors.surfaceElevated,
			borderWidth: 1,
			borderColor: colors.border,
		},
		dnfNoteText: {
			...baseStyles.dnfNoteText,
			color: colors.textSecondary,
		},
	};
};
