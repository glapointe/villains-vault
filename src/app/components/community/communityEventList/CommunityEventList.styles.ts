/**
 * CommunityEventList Styles
 *
 * Theme-aware styles for the community events list page.
 * Follows the same layout pattern as dashboard/race pages:
 * ScrollView(layout.container) → View(layout.wideContent) → header + body
 */

import { StyleSheet } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import { layout } from '../../../theme/commonStyles';
import type { ThemeColors } from '../../../theme';

/** Base structure styles (theme-independent) */
export const styles = StyleSheet.create({
	/* ── Page-level layout (matches dashboard / race) ── */
	container: {
		...layout.container,
		backgroundColor: 'transparent',
	},
	contentContainer: {
		flexGrow: 1,
		paddingHorizontal: spacing.md,
	},
	content: {
		...layout.wideContent,
		flex: 1,
		paddingHorizontal: spacing.sm,
		paddingTop: spacing.md,
	},
	contentBody: {
		flex: 1,
		paddingHorizontal: spacing.md,
		paddingBottom: spacing.lg,
	},

	/* ── Filters (matches RaceResultsGrid pattern) ── */
	filterContainer: {
		padding: spacing.md,
		borderBottomWidth: 1,
		marginBottom: spacing.md,
	},
	filterRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'flex-end',
		gap: spacing.md,
	},
	filterGroup: {
		minWidth: 150,
		maxWidth: 200,
		flex: 1,
	},
	filterLabel: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.medium,
		marginBottom: spacing.sm,
	},
	filterInput: {
		fontSize: typography.fontSize.sm,
		borderWidth: 1,
		borderRadius: borderRadius.md,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm + 2,
	},
	toggleGroup: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		paddingBottom: spacing.xs,
	},
	toggleLabel: {
		fontSize: typography.fontSize.sm,
	},

	/* ── Month headers ── */
	monthHeader: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.semibold,
		marginTop: spacing.lg,
		marginBottom: spacing.sm,
	},

	/* ── Card grid ── */
	cardsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.md,
	},
	eventCard: {
		width: 265,
		padding: spacing.md,
		borderRadius: borderRadius.md,
		borderWidth: 1,
	},
	cardTitleRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: spacing.sm,
		marginBottom: spacing.xs,
	},
	titleLink: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xxs,
		flex: 1,
	},
	eventTitle: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.semibold,
		flex: 1,
	},
	locationRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xxs,
		marginBottom: spacing.sm,
	},
	locationText: {
		fontSize: typography.fontSize.sm,
		flex: 1,
	},
	racesRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.xs,
		marginBottom: spacing.sm,
	},
	raceBadge: {
		fontSize: typography.fontSize.xs,
		paddingHorizontal: spacing.xs,
		paddingVertical: 3,
		borderRadius: borderRadius.sm,
		overflow: 'hidden',
	},

	/* ── Card footer ── */
	cardFooter: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: spacing.xs,
		paddingTop: spacing.xs,
		borderTopWidth: StyleSheet.hairlineWidth,
	},
	goingButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xxs,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
		borderRadius: borderRadius.sm,
		borderWidth: 1,
	},
	goingButtonText: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.medium,
	},
	goingBadge: {
		flexDirection: 'row',
		alignItems: 'baseline',
		gap: spacing.xxs,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
		borderRadius: borderRadius.sm,
	},
	goingBadgeText: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.medium,
	},
	participantCount: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xxs,
		paddingVertical: spacing.xs,
	},
	participantCountText: {
		fontSize: typography.fontSize.sm,
	},
	createdBy: {
		fontSize: typography.fontSize.xs,
		marginTop: spacing.xs,
	},

	/* ── Paging ── */
	pagingRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: spacing.md,
		paddingVertical: spacing.lg,
	},
	pageInfo: {
		fontSize: typography.fontSize.sm,
	},

	/* ── States ── */
	emptyText: {
		fontSize: typography.fontSize.base,
		textAlign: 'center',
		paddingVertical: spacing.xl,
	},
	loadingContainer: {
		paddingVertical: spacing.xl,
		alignItems: 'center',
	},
});

/** Themed styles (color-dependent) */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	content: {
		backgroundColor: colors.background,
	},
	header: {
		borderBottomColor: colors.border,
	},
	filterContainer: {
		backgroundColor: colors.surface,
		borderBottomColor: colors.border,
	},
	filterLabel: {
		color: colors.textPrimary,
	},
	filterInput: {
		color: colors.textPrimary,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	toggleLabel: {
		color: colors.textSecondary,
	},
	monthHeader: {
		color: colors.textPrimary,
	},
	eventCard: {
		backgroundColor: colors.surface,
		borderColor: colors.border,
	},
	eventTitle: {
		color: colors.textPrimary,
	},
	eventTitleLink: {
		color: colors.primary,
	},
	eventTitleLinkHovered: {
		color: colors.primary,
		textDecorationLine: 'underline' as const,
	},
	locationText: {
		color: colors.textTertiary,
	},
	raceBadge: {
		backgroundColor: colors.infoSubtle,
		color: colors.info,
	},
	cardFooter: {
		borderTopColor: colors.borderLight,
	},
	goingButton: {
		borderColor: colors.primary,
	},
	goingButtonText: {
		color: colors.primary,
	},
	goingBadge: {
		backgroundColor: colors.successSubtle,
	},
	goingBadgeText: {
		color: colors.success,
	},
	participantCountText: {
		color: colors.textSecondary,
	},
	createdBy: {
		color: colors.textTertiary,
	},
	pageInfo: {
		color: colors.textSecondary,
	},
	emptyText: {
		color: colors.textTertiary,
	},
});
