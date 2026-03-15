/**
 * AdminEventsList Styles
 * 
 * Theme-aware styles for AdminEventsList component.
 * Enhanced with left accent borders, race count badges,
 * distance badges, animated chevrons, and staggered entrance.
 * Uses design tokens from theme for consistent styling.
 */

import { StyleSheet, Platform } from 'react-native';
import { spacing, typography, borderRadius, shadows, palette } from '../../theme';
import type { ThemeColors } from '../../theme';

/**
 * Base AdminEventsList structure (theme-independent)
 */
export const styles = StyleSheet.create({
	container: {
		paddingVertical: spacing.md,
	},

	// Filter Section
	filterSection: {
		marginBottom: spacing.md,
	},
	filterLabel: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.semibold,
		marginBottom: spacing.sm,
	},

	// Events List
	eventsList: {
		gap: spacing.md,
	},
	eventCard: {
		marginBottom: spacing.sm,
		overflow: 'hidden',
		borderLeftWidth: 4,
	},

	// Event Toolbar (Admin Actions)
	eventToolbar: {
		flexDirection: 'row',
		gap: spacing.sm,
		paddingHorizontal: spacing.md,
		paddingTop: spacing.sm,
		paddingBottom: spacing.xs,
	},

	// Event Header
	eventHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: spacing.md,
		paddingTop: spacing.sm,
		paddingBottom: spacing.md,
		...Platform.select({
			web: {
				cursor: 'pointer',
				transition: 'all 0.2s ease',
			} as any,
			default: {},
		}),
	},
	eventHeaderHover: {
		opacity: 0.85,
	},
	eventHeaderContent: {
		flex: 1,
	},
	eventNameRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		marginBottom: spacing.xs,
	},
	eventName: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.semibold,
		lineHeight: typography.fontSize.lg * typography.lineHeight.tight,
		flexShrink: 1,
	},

	// Race count badge
	raceCountBadge: {
		paddingHorizontal: spacing.sm,
		paddingVertical: 2,
		borderRadius: borderRadius.full,
	},
	raceCountText: {
		fontSize: typography.fontSize.xs,
		fontWeight: typography.fontWeight.semibold,
		lineHeight: typography.fontSize.xs * typography.lineHeight.tight,
	},

	eventMeta: {
		fontSize: typography.fontSize.sm,
		lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
	},

	// Expand icon (chevron)
	expandIconContainer: {
		marginLeft: spacing.sm,
		padding: spacing.xs,
	},

	// Admin Buttons
	adminButton: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		minWidth: 40,
	},

	// Races Container
	racesContainer: {
		paddingHorizontal: spacing.md,
		paddingBottom: spacing.md,
		gap: spacing.sm,
		overflow: 'hidden',
	},
	raceCard: {
		borderWidth: 1,
		borderRadius: borderRadius.md,
		padding: spacing.md,
		...shadows.sm,
	},
	raceContentWrapper: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'flex-start',
		gap: spacing.sm,
	},
	raceContent: {
		flex: 1,
		minWidth: 200,
		...Platform.select({
			web: {
				cursor: 'pointer',
				transition: 'opacity 0.2s ease',
			} as any,
			default: {},
		}),
	},
	raceContentHover: {
		opacity: 0.7,
	},
	raceNameRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		marginBottom: spacing.xs,
	},
	raceName: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.semibold,
		lineHeight: typography.fontSize.base * typography.lineHeight.tight,
		flexShrink: 1,
	},
	raceDetailsRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
	},
	raceDetails: {
		fontSize: typography.fontSize.sm,
		lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
	},
	raceNotes: {
		fontSize: typography.fontSize.sm,
		fontStyle: 'italic',
		marginTop: spacing.xs,
	},
	raceActions: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.sm,
		alignItems: 'center',
		justifyContent: 'flex-end',
	},
});

/**
 * Theme-aware styles for AdminEventsList based on light/dark mode
 */
export const getThemedStyles = (colors: ThemeColors, isDark: boolean) => {
	return StyleSheet.create({
		filterLabel: {
			color: colors.textPrimary,
		},
		eventCard: {
			borderLeftColor: isDark ? palette.villains.green : palette.villains.purple,
		},
		raceCountBadge: {
			backgroundColor: colors.primarySubtle,
		},
		raceCountText: {
			color: colors.primary,
		},
		eventName: {
			color: colors.textPrimary,
		},
		eventMeta: {
			color: colors.textSecondary,
		},
		expandIcon: {
			color: colors.textSecondary,
		},
		raceCard: {
			backgroundColor: colors.surfaceElevated,
			borderColor: colors.border,
		},
		raceName: {
			color: colors.textPrimary,
		},
		raceDetails: {
			color: colors.textSecondary,
		},
		raceNotes: {
			color: colors.textTertiary,
		},
	});
};
