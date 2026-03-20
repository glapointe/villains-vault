import { StyleSheet, Platform } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Width breakpoint for switching between 2-column and 4-column native layouts.
 * Below this: 2 columns (portrait phone). Above: 4 columns (landscape / tablet).
 */
const WIDE_BREAKPOINT = 600;

// Base styles - structure, spacing, typography (NO colors)
export const createStyles = (windowWidth: number = 400) => {
	const isWide = windowWidth >= WIDE_BREAKPOINT;

	return StyleSheet.create({
		container: {
			gap: spacing.sm,
		},
		sectionTitle: {
			fontSize: typography.fontSize.lg,
			fontWeight: typography.fontWeight.bold,
			paddingBottom: spacing.sm,
		},
		statsContainer: {
			flex: 1,
		},
		sideBySideContainer: {
			...Platform.select({
				web: {
					flexDirection: 'row' as const,
					flexWrap: 'wrap' as const,
					gap: spacing.lg,
				},
				default: {
					flexDirection: isWide ? 'row' as const : 'column' as const,
					gap: spacing.lg,
				},
			}),
		},
		sideColumn: {
			...Platform.select({
				web: {
					flex: 1,
					minWidth: 250,
				},
				default: isWide ? { flex: 1 } : { flex: 0 },
			}),
		},
		grid: {
			...Platform.select({
				web: {
					flexDirection: 'row' as const,
					flexWrap: 'wrap' as const,
					gap: spacing.md,
				},
				default: {
					flexDirection: 'row' as const,
					flexWrap: 'wrap' as const,
					gap: spacing.md,
					alignContent: 'flex-start' as const,
				},
			}),
			paddingBottom: spacing.md,
		},
		statCard: {
			...Platform.select({
				web: {
					flex: 1,
				},
				default: {
					width: (isWide ? '22%' : '47%') as any,
				},
			}),
			minWidth: 130,
			paddingHorizontal: spacing.sm,
			paddingVertical: spacing.md,
			alignItems: 'center',
		},
		statTitle: {
			fontSize: typography.fontSize.sm,
			fontWeight: typography.fontWeight.medium,
			paddingBottom: spacing.xs,
			textAlign: 'center',
			flex: 1,
			flexDirection: 'row',
			gap: spacing.xs,
			alignItems: 'baseline',
		},
		statValue: {
			fontSize: typography.fontSize["2xl"],
			fontWeight: typography.fontWeight.bold,
			paddingBottom: spacing.xs,
		},
		heroValue: {
			fontSize: typography.fontSize["4xl"],
		},
		statSubtitle: {
			fontSize: typography.fontSize.xs,
			textAlign: 'center',
			flex: 1,
		},
	});
};

// Theme-aware styles - colors only
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	container: {
		backgroundColor: colors.background,
	},
	sectionTitle: {
		color: colors.textPrimary,
	},
	statTitle: {
		color: colors.textSecondary,
		textAlign: 'center',
		whiteSpace: 'nowrap' as const,
	},
	value: {
		color: colors.textPrimary,
	},
	valuePrimary: {
		color: colors.primary,
	},
	valueSuccess: {
		color: colors.success,
	},
	valueWarning: {
		color: colors.warning,
	},
	valueError: {
		color: colors.error,
	},
	statSubtitle: {
		color: colors.textTertiary,
	},
});
