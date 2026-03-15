/**
 * FollowedResultsList Styles
 *
 * Structure-only styles for the followed results list component.
 * Color/theme styles are in getThemedStyles.
 */

import { StyleSheet, Platform } from 'react-native';
import { spacing, typography, borderRadius, shadows } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/** Structure-only styles (no colors) */
export const styles = StyleSheet.create({
	container: {
		flex: 1,
		gap: spacing.lg,
		paddingHorizontal: spacing.md,
	},
	filterRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.md,
		alignItems: 'flex-end',
		marginBottom: spacing.md,
	},
	filterGroup: {
		minWidth: 150,
		maxWidth: 220,
		flex: 1,
	},
	filterLabel: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.medium,
		marginBottom: spacing.xs,
	},
	columnsRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.lg,
	},
	columnPrimary: {
		flex: 2,
		minWidth: 280,
	},
	columnSecondary: {
		flex: 1,
		minWidth: 280,
	},
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: spacing.md,
	},
	sectionTitle: {
		fontSize: typography.fontSize.xl,
		fontWeight: typography.fontWeight.bold,
		lineHeight: typography.fontSize.xl * typography.lineHeight.tight,
	},
	sectionCount: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.medium,
	},
	eventGroupContainer: {
		marginVertical: spacing.lg,
	},
	eventGroupHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		marginBottom: spacing.sm,
		paddingBottom: spacing.xs,
		borderBottomWidth: 1,
	},
	eventGroupName: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.semibold,
		lineHeight: typography.fontSize.base * typography.lineHeight.normal,
		flex: 1,
	},
	resultCard: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: spacing.sm,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
		borderRadius: borderRadius.md,
		borderWidth: 1,
		marginBottom: spacing.xs,
	},
	resultContent: {
		flex: 1,
		minWidth: 250,
		gap: 2,
	},
	resultRaceName: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.semibold,
		lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
	},
	resultMeta: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.sm,
		alignItems: 'center',
	},
	resultMetaText: {
		fontSize: typography.fontSize.xs,
		lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
	},
	resultStats: {
		flexDirection: 'row',
		gap: spacing.md,
		alignItems: 'center',
		flex: 1,
	},
	resultRightGroup: {
		flexDirection: 'row',
		alignItems: 'center',
		minWidth: 250,
		flex: 1,
	},
	statItem: {
		alignItems: 'center',
	},
	statValue: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.bold,
		lineHeight: typography.fontSize.sm * typography.lineHeight.tight,
	},
	statLabel: {
		fontSize: 10,
		fontWeight: typography.fontWeight.medium,
		textTransform: 'uppercase' as const,
		letterSpacing: 0.5,
	},
	resultActions: {
		flexDirection: 'row',
		gap: spacing.xs,
		alignItems: 'center',
	},
	actionButton: {
		padding: spacing.xs,
		borderRadius: borderRadius.sm,
	},
	dlsBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 2,
		paddingHorizontal: spacing.xs,
		paddingVertical: 2,
		borderRadius: borderRadius.sm,
	},
	dlsBadgeText: {
		fontSize: 10,
		fontWeight: typography.fontWeight.bold,
		textTransform: 'uppercase' as const,
	},
	emptyState: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: spacing['2xl'],
		gap: spacing.sm,
	},
	emptyTitle: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.semibold,
		lineHeight: typography.fontSize.base * typography.lineHeight.normal,
	},
	emptySubtitle: {
		fontSize: typography.fontSize.sm,
		lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
		textAlign: 'center',
	},
	// Search panel styles
	searchContainer: {
		gap: spacing.md,
		paddingTop: spacing.sm,
	},
	searchFilterRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.md,
		alignItems: 'flex-end',
	},
	searchFilterGroup: {
		minWidth: 140,
		flex: 1,
		maxWidth: 260,
	},
	searchResultCount: {
		fontSize: typography.fontSize.xs,
		lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
	},
	searchResultsHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	searchResultsList: {
		gap: spacing.sm,
	},
	searchResultCard: {
		flexDirection: 'column',
		gap: spacing.sm,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
		borderRadius: borderRadius.md,
		borderWidth: 1,
	},
	searchResultContent: {
		gap: 2,
	},
	searchCardHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
	},
	searchCardFooter: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: spacing.sm,
	},
	searchStatsRow: {
		flexDirection: 'row',
		gap: spacing.md,
		alignItems: 'center',
	},
	searchRunnerName: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.bold,
		lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
		flex: 1,
	},
	searchRunnerDetails: {
		fontSize: typography.fontSize.xs,
		lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
	},
	searchCheckboxes: {
		flexDirection: 'row',
		gap: spacing.md,
		alignItems: 'center',
	},
	checkboxRow: {
		flexDirection: 'row',
		gap: spacing.xs,
		alignItems: 'center',
	},
	checkboxLabel: {
		fontSize: typography.fontSize.xs,
		fontWeight: typography.fontWeight.medium,
	},
});

/** Theme-dependent styles */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	filterLabel: {
		color: colors.textPrimary,
	},
	sectionTitle: {
		color: colors.textPrimary,
	},
	sectionCount: {
		color: colors.textSecondary,
	},
	eventGroupHeader: {
		borderBottomColor: colors.borderLight,
	},
	eventGroupName: {
		color: colors.textPrimary,
	},
	resultCard: {
		backgroundColor: colors.surface,
		borderColor: colors.border,
	},
	resultRaceName: {
		color: colors.primary,
	},
	resultMetaText: {
		color: colors.textSecondary,
	},
	statValue: {
		color: colors.textPrimary,
	},
	statLabel: {
		color: colors.textTertiary,
	},
	actionButtonHover: {
		backgroundColor: colors.surfaceElevated,
	},
	dlsBadge: {
		backgroundColor: colors.warningSubtle,
	},
	dlsBadgeText: {
		color: colors.warning,
	},
	emptyTitle: {
		color: colors.textPrimary,
	},
	emptySubtitle: {
		color: colors.textSecondary,
	},
	searchResultCard: {
		backgroundColor: colors.surface,
		borderColor: colors.border,
	},
	searchRunnerName: {
		color: colors.textPrimary,
	},
	searchRunnerDetails: {
		color: colors.textSecondary,
	},
	checkboxLabel: {
		color: colors.textPrimary,
	},
});
