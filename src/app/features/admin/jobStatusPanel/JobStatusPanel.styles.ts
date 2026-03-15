/**
 * JobStatusPanel Component Styles
 * 
 * Theme-aware styles for job status panel component
 * Uses design tokens from theme for consistent styling
 */

import { StyleSheet } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base job status panel structure (theme-independent)
 */
export const styles = StyleSheet.create({
	centerContent: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	statusBox: {
		borderWidth: 1,
		borderRadius: borderRadius.md,
		padding: spacing.sm,
		marginBottom: spacing.md,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	statusMessage: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.semibold,
		flex: 1,
	},
	jobList: {
		paddingBottom: spacing.md,
	},
	jobItem: {
		borderWidth: 1,
		borderRadius: borderRadius.md,
		padding: spacing.sm,
		marginBottom: spacing.sm,
	},
	jobHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	jobStatusRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: spacing.xs,
		marginBottom: spacing.xs,
		gap: spacing.md,
	},
	jobInfo: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginRight: spacing.sm,
	},
	jobActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
	},
	jobStatus: {
		fontSize: typography.fontSize.lg,
		marginRight: spacing.xs,
		marginTop: 2,
	},
	jobStatsRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		borderRadius: borderRadius.md / 1.5,
		borderWidth: 1,
		paddingVertical: spacing.xs,
		paddingHorizontal: spacing.xs,
		marginBottom: spacing.xs / 1.5,
		marginTop: 2,
	},
	jobStat: {
		fontSize: typography.fontSize.xs,
		marginRight: spacing.sm,
	},
	jobDetails: {
		flex: 1,
	},
	jobLabel: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.semibold,
		marginBottom: spacing.xs,
	},
	jobMeta: {
		fontSize: typography.fontSize.xs,
		marginBottom: spacing.xs,
	},
	jobError: {
		fontSize: typography.fontSize.xs,
		fontWeight: typography.fontWeight.medium,
	},
	jobSpinner: {
		marginRight: spacing.sm,
	},
	cancelButton: {
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs / 1.5,
	},
	expandIndicator: {
		fontSize: typography.fontSize.xs,
		marginLeft: spacing.xs,
	},
	divisionsContainer: {
		marginTop: spacing.sm,
		paddingTop: spacing.sm,
		borderTopWidth: 1,
	},
	divisionsHeader: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.semibold,
		marginBottom: spacing.xs,
	},
	divisionItem: {
		borderWidth: 1,
		borderRadius: borderRadius.md / 1.5,
		padding: spacing.xs,
		marginBottom: spacing.xs,
	},
	divisionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: spacing.xs,
	},
	divisionStatus: {
		fontSize: typography.fontSize.xs - 2,
		marginRight: spacing.xs / 1.5,
	},
	divisionName: {
		fontSize: typography.fontSize.sm - 1,
		fontWeight: typography.fontWeight.medium,
		flex: 1,
	},
	divisionStats: {
		flexDirection: 'row',
		gap: spacing.sm,
		marginLeft: spacing.md,
	},
	divisionStat: {
		fontSize: typography.fontSize.xs - 1,
	},
	divisionError: {
		fontSize: typography.fontSize.xs - 1,
		fontWeight: typography.fontWeight.medium,
		marginTop: spacing.xs,
		marginLeft: spacing.md,
	},
	retryButton: {
		marginTop: spacing.md,
		minWidth: 120,
	},
	footerActions: {
		width: '100%',
	},
	closeButton: {
		width: '100%',
	},
	loadMoreContainer: {
		paddingVertical: spacing.md,
		alignItems: 'center',
	},
	loadMoreButton: {
		minWidth: 150,
	},
});

/**
 * Theme-aware styles for JobStatusPanel
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	statusBox: {
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	statusMessage: {
		color: colors.textPrimary,
	},
	jobItem: {
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	jobStatsRow: {
		borderColor: colors.border,
		backgroundColor: colors.surfaceElevated,
	},
	jobStat: {
		color: colors.textSecondary,
	},
	jobLabel: {
		color: colors.textPrimary,
	},
	jobMeta: {
		color: colors.textSecondary,
	},
	jobError: {
		color: colors.error,
	},
	expandIndicator: {
		color: colors.textSecondary,
	},
	divisionsContainer: {
		borderTopColor: colors.border,
	},
	divisionsHeader: {
		color: colors.textPrimary,
	},
	divisionItem: {
		borderColor: colors.borderLight,
		backgroundColor: colors.surfaceElevated,
	},
	divisionName: {
		color: colors.textPrimary,
	},
	divisionStat: {
		color: colors.textSecondary,
	},
	divisionError: {
		color: colors.error,
	},
	message: {
		color: colors.textSecondary,
	},
});
