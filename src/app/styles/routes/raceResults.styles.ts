/**
 * Race Dashboard Styles
 * 
 * Theme-aware styles for race dashboard page
 * Uses design tokens from theme for consistent styling
 */

import { StyleSheet, Platform } from 'react-native';
import { layout, text } from '../../theme/commonStyles';
import { spacing, typography, borderRadius, shadows } from '../../theme';
import type { ThemeColors } from '../../theme';

/**
 * Base race dashboard structure (theme-independent)
 */
export const styles = StyleSheet.create({
	container: layout.container,
	contentContainer: {
		flexGrow: 1,
		paddingHorizontal: spacing.md,
	},
	header: {
		padding: spacing.lg,
		borderBottomWidth: 1,
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		gap: spacing.sm,
	},
	headerContent: {

	},
	headerActions: {

	},
    content: layout.wideContent,
	eventName: {
		...text.small,
		fontWeight: typography.fontWeight.medium,
		marginBottom: spacing.xs,
	},
	raceTitleContainer: {
		flexDirection: 'column',
		alignItems: 'flex-start',
        justifyContent: 'flex-start',
		marginBottom: spacing.xs,
	},
	raceTitleRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: spacing.md,
		marginBottom: spacing.xs,
	},
	raceTitle: {
		fontSize: typography.fontSize['2xl'],
		fontWeight: typography.fontWeight.bold,
		flexWrap: 'wrap',
		...Platform.select({
			web: {
				cursor: 'pointer',
			} as any,
			default: {},
		}),
	},
	raceTitleUnderline: {
		...Platform.select({
			web: {
				textDecorationLine: 'underline',
			} as any,
			default: {},
		}),
	},
    raceResultTitle: {
		fontSize: typography.fontSize.xl,
		fontWeight: typography.fontWeight.bold,
		flexWrap: 'wrap',
    },
	raceDate: {
		...text.body,
		fontSize: typography.fontSize.base,
	},
	promptContainer: {
		paddingHorizontal: spacing.md,
	},
	detailsContainer: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
	},
	chartContainer: {
		...Platform.select({
			web: {},
			default: { flex: 1 },
		}),
		minHeight: 600,
		paddingHorizontal: spacing.md,
		paddingTop: spacing.md,
		paddingBottom: spacing.lg,
	},
	closestResultsContainer: {
        flex: 1,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
	},
	closestResultsHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingBottom: spacing.md,
		flexWrap: 'wrap',
		gap: spacing.sm,
	},
	sectionTitle: {
		fontSize: typography.fontSize.xl,
		fontWeight: typography.fontWeight.bold,
	},
	fieldSizeControl: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
	},
	fieldSizeLabel: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.medium,
	},
	fieldSizeDropdown: {
		minWidth: 80,
	},
	gridsContainer: {
		flexDirection: 'column',
		flexWrap: 'wrap',
		gap: spacing.sm,
	},
	allEventsButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
		borderRadius: borderRadius.full,
		...Platform.select({
			web: { cursor: 'pointer' } as any,
			default: {},
		}),
	},
	allEventsButtonText: {
		fontSize: typography.fontSize.xs,
		fontWeight: typography.fontWeight.semibold,
		lineHeight: typography.fontSize.xs * typography.lineHeight.tight,
	},
	panelContent: {
		flex: 1,
		paddingHorizontal: spacing.sm,
	},
	panelYearFilter: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		paddingBottom: spacing.md,
	},
	panelYearLabel: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.medium,
	},
	panelYearDropdown: {
		minWidth: 120,
	},
	gridWrapper: {
		paddingBottom: spacing.sm,
		width: '100%',
	},
	gridTitle: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.semibold,
		paddingBottom: spacing.sm,
	},
	loadingText: {
		fontSize: typography.fontSize.base,
		paddingTop: spacing.sm,
	},
	loadingContainer: layout.centeredContainer,
	errorContainer: {
		flex: 1,
		padding: spacing.md,
	},
});

/**
 * Theme-aware styles for race dashboard
 */
export const getThemedStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
	container: {
		backgroundColor: 'transparent',
	},
    content: {
        backgroundColor: colors.background,
    },
	header: {
		backgroundColor: colors.background,
		borderBottomColor: colors.border,
	},
	eventName: {
		color: colors.textSecondary,
	},
	raceTitle: {
		color: colors.textPrimary,
	},
	raceTitleUnderline: {
		color: colors.textPrimary,
		...Platform.select({
			web: {
				textDecorationLine: 'underline',
			} as any,
			default: {},
		}),
	},
    raceResultTitle: {
        color: colors.textPrimary,
    },
	raceDate: {
		color: colors.textSecondary,
	},
	sectionTitle: {
		color: colors.textPrimary,
	},
	fieldSizeLabel: {
		color: colors.textPrimary,
	},
	gridTitle: {
		color: colors.textPrimary,
	},
	loadingText: {
		color: colors.textSecondary,
	},
	allEventsButton: {
		backgroundColor: colors.secondary,
	},
	allEventsButtonHover: {
		backgroundColor: colors.secondaryHover,
	},
	allEventsButtonText: {
		color: colors.textInverse,
	},
});
