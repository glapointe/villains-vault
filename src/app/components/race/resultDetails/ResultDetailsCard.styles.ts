/**
 * Result Details Card Styles
 * Base styles (structure, spacing) and themed styles (colors)
 */

import { StyleSheet, Platform } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base styles - structure, spacing, typography (NO colors)
 */
export const styles = StyleSheet.create({
	container: {
		gap: spacing.lg,
	},
	loadingContainer: {
		padding: spacing.xl,
		alignItems: 'center',
		justifyContent: 'center',
	},

	// Header Section
	headerSection: {
		gap: spacing.xs,
		...Platform.select({
			web: {
				flexDirection: 'row' as const,
				flexWrap: 'wrap' as const,
				alignItems: 'center' as const,
				gap: spacing.md,
			},
			default: {},
		}),
	},
	headerSectionMobile: {
		gap: spacing.xs,
	},
	runnerName: {
		fontSize: typography.fontSize['2xl'],
		fontWeight: typography.fontWeight.bold,
		lineHeight: typography.fontSize['2xl'] * typography.lineHeight.tight,
		...Platform.select({
			web: {
				marginRight: spacing.sm,
			},
			default: {},
		}),
	},
	bibNumber: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.semibold,
		...Platform.select({
			web: {
				marginRight: spacing.sm,
			},
			default: {},
		}),
	},
	runnerMetaRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		...Platform.select({
			web: {
				marginTop: 0,
			},
			default: {
				marginTop: spacing.xs,
			},
		}),
	},
	runnerMeta: {
		fontSize: typography.fontSize.base,
	},
	runnerType: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.medium,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
		borderRadius: borderRadius.sm,
	},
	hometown: {
		fontSize: typography.fontSize.sm,
		marginTop: spacing.xs,
	},

	// Stats Grid
	statsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.md,
	},
	statTile: {
		flex: 1,
		minWidth: 130,
		maxWidth: '48%', // 2 columns on larger screens
		paddingHorizontal: spacing.sm,
	},
	statContent: {
		alignItems: 'center',
		gap: spacing.xs,
	},
	statLabel: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.medium,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	statPlace: {
		fontSize: typography.fontSize['4xl'],
		fontWeight: typography.fontWeight.bold,
		lineHeight: typography.fontSize['4xl'] * typography.lineHeight.tight,
	},
	statPercentage: {
		fontSize: typography.fontSize.xl,
		fontWeight: typography.fontWeight.semibold,
	},
	statCount: {
		fontSize: typography.fontSize.xs,
		textAlign: 'center',
	},

	// Time Section
	timeSection: {
		gap: spacing.md,
	},
	sectionTitle: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.semibold,
		marginBottom: spacing.xs,
	},
	timeGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.md,
	},
	timeItem: {
		flex: 1,
		minWidth: 105,
		gap: spacing.xs,
	},
	timeLabel: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.medium,
	},
	timeValue: {
		fontSize: typography.fontSize.xl,
		fontWeight: typography.fontWeight.bold,
	},

	// Splits Section
	splitsSection: {
		gap: spacing.md,
	},
	splitsAndPaceContainer: {
		...Platform.select({
			web: {
				flexDirection: 'row' as const,
				gap: spacing.lg,
				alignItems: 'flex-start',
                flexWrap: 'wrap' as const,
			},
			default: {
				gap: spacing.lg,
			},
		}),
	},
	splitsColumn: {
		...Platform.select({
			web: {
				flex: 1,
                minWidth: 250,
			},
			default: {},
		}),
	},
	paceChartColumn: {
		...Platform.select({
			web: {
				flex: 1,
                minWidth: 250,
                padding: 0,
			},
			default: {},
		}),
	},
	splitsGrid: {
		...Platform.select({
			web: {
				flexDirection: 'column' as const,
				gap: spacing.sm,
			},
			default: {
				gap: 0,
			},
		}),
	},
	splitRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: spacing.sm,
		borderBottomWidth: 1,
		...Platform.select({
			web: {
				paddingHorizontal: spacing.sm,
			},
			default: {},
		}),
	},
	splitInfo: {
		flex: 1,
		gap: spacing.xs / 2,
	},
	splitValues: {
		alignItems: 'flex-end',
		gap: spacing.xs / 2,
	},
	splitLabel: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.medium,
	},
	splitDistance: {
		fontSize: typography.fontSize.xs,
	},
	splitValue: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.semibold,
	},
	splitPace: {
		fontSize: typography.fontSize.sm,
	},
	splitPaceContainer: {
		alignItems: 'flex-end',
	},
	splitUnavailable: {
		fontSize: typography.fontSize.sm,
		fontStyle: 'italic',
	},
});

/**
 * Theme-aware styles - colors only
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	// Header Section
	runnerName: {
		color: colors.textPrimary,
	},
	bibNumber: {
		color: colors.textSecondary,
	},
	runnerMeta: {
		color: colors.textSecondary,
	},
	runnerType: {
		color: colors.primary,
		backgroundColor: colors.primarySubtle,
	},
	hometown: {
		color: colors.textTertiary,
	},

	// Stats Grid
	statLabel: {
		color: colors.textSecondary,
	},
	statPlace: {
		color: colors.primary,
	},
	statPercentage: {
		color: colors.textPrimary,
	},
	statCount: {
		color: colors.textTertiary,
	},

	// Time Section
	sectionTitle: {
		color: colors.textPrimary,
	},
	timeLabel: {
		color: colors.textSecondary,
	},
	timeValue: {
		color: colors.textPrimary,
	},

	// Splits Section
	splitLabel: {
		color: colors.textPrimary,
	},
	splitDistance: {
		color: colors.textTertiary,
	},
	splitValue: {
		color: colors.textPrimary,
	},
	splitPace: {
		color: colors.textSecondary,
	},
	paceFaster: {
		color: colors.success,
	},
	paceSlower: {
		color: colors.warning,
	},
	paceNeutral: {
		color: colors.textPrimary,
	},
	splitUnavailable: {
		color: colors.textDisabled,
	},
	splitRow: {
		...Platform.select({
			web: {
				backgroundColor: colors.surfaceElevated,
			},
			default: {
				borderBottomColor: colors.border,
			},
		}),
	},
});
