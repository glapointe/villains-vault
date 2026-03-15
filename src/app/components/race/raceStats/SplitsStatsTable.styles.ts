import { StyleSheet, Platform } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

// Base styles - structure, spacing, typography (NO colors)
export const styles = StyleSheet.create({
	container: {
	},
	sectionTitle: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.bold,
		paddingBottom: spacing.md,
	},
	splitsGrid: {
		gap: spacing.sm,
	},
	splitRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: spacing.sm,
		borderBottomWidth: 1,
        gap: spacing.xl,
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
    splitMissesContainer: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    splitMissesLabel: {
        fontSize: typography.fontSize.base,
        fontStyle: 'italic',
    },
    splitMissesValue: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
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
	timeContainer: {
		alignItems: 'flex-end',
	},
	paceValue: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.medium,
	},
	unavailableContainer: {
		alignItems: 'flex-end',
	},
});

// Theme-aware styles - colors only
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	sectionTitle: {
		color: colors.textPrimary,
	},
	
	// Splits Section
	splitLabel: {
		color: colors.textPrimary,
	},
	splitDistance: {
		color: colors.textTertiary,
	},
    splitMissesLabel: {
        color: colors.textPrimary,
    },
    splitMissesValue: {
        color: colors.success,
    },
    splitMissesWarning: {
        color: colors.warning,
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
