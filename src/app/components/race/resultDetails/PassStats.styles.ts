import { StyleSheet, Platform } from 'react-native';
import { spacing, typography } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Width breakpoint for switching between 2-column and 4-column native layouts.
 */
const WIDE_BREAKPOINT = 600;

export const createStyles = (windowWidth: number = 400) => {
	const isWide = windowWidth >= WIDE_BREAKPOINT;

	return StyleSheet.create({
		container: {
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
				},
				default: isWide ? { flex: 1 } : { flex: 0 },
			}),
			minWidth: 250,
		},
		sectionTitle: {
			fontSize: typography.fontSize.lg,
			fontWeight: typography.fontWeight.bold,
			paddingBottom: spacing.sm,
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
			padding: spacing.md,
			alignItems: 'center',
		},
		statTitle: {
			fontSize: typography.fontSize.sm,
			fontWeight: typography.fontWeight.medium,
			paddingBottom: spacing.xs,
			textAlign: 'center',
			flexDirection: 'row',
			gap: spacing.xs,
			alignItems: 'baseline',
		},
		statValue: {
			fontSize: typography.fontSize['2xl'],
			fontWeight: typography.fontWeight.bold,
			paddingBottom: spacing.xs,
		},
		statSubtitle: {
			fontSize: typography.fontSize.xs,
			textAlign: 'center',
		},
	});
};

export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	sectionTitle: {
		color: colors.textPrimary,
	},
	statTitle: {
		color: colors.textSecondary,
	},
	value: {
		color: colors.textPrimary,
	},
	valueKill: {
		color: colors.error,
	},
	valueAssassin: {
		color: colors.success,
	},
	statSubtitle: {
		color: colors.textTertiary,
	},
});
