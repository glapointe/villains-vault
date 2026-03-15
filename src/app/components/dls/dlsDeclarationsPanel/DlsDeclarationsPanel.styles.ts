/**
 * DlsDeclarationsPanel Styles
 *
 * Theme-aware styles for the DLS declarations panel.
 * Displays the list of declarations (runners) for a DLS race.
 */

import { StyleSheet } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base structure styles (theme-independent)
 */
export const styles = StyleSheet.create({
	container: {
		padding: spacing.md,
	},
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: spacing.md,
	},
	countText: {
		fontSize: typography.fontSize.sm,
		paddingBottom: spacing.sm,
	},
	declarationRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		padding: spacing.sm,
		borderRadius: borderRadius.sm,
		marginBottom: spacing.xs,
		borderWidth: 1,
	},
	declarationInfo: {
		flex: 1,
		gap: spacing.xxs,
	},
	declarationName: {
		fontSize: typography.fontSize.md,
		fontWeight: typography.fontWeight.semibold,
	},
	declarationBib: {
		fontSize: typography.fontSize.sm,
	},
	declarationBadges: {
		flexDirection: 'row',
		gap: spacing.xs,
		flexWrap: 'wrap',
		marginTop: spacing.xxs,
	},
	declarationBadge: {
		fontSize: typography.fontSize.xs,
		fontWeight: typography.fontWeight.medium,
		paddingHorizontal: spacing.xs,
		paddingVertical: 2,
		borderRadius: borderRadius.sm,
		overflow: 'hidden',
	},
	declarationComment: {
		fontSize: typography.fontSize.sm,
		fontStyle: 'italic',
		marginTop: spacing.xxs,
	},
	emptyText: {
		fontSize: typography.fontSize.sm,
		textAlign: 'center',
		paddingVertical: spacing.lg,
	},
	loadingContainer: {
		paddingVertical: spacing.lg,
		alignItems: 'center',
	},
});

/**
 * Themed styles (color-dependent)
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	countText: {
		color: colors.textSecondary,
	},
	declarationRow: {
		backgroundColor: colors.surface,
		borderColor: colors.border,
	},
	declarationName: {
		color: colors.textPrimary,
	},
	declarationBib: {
		color: colors.textSecondary,
	},
	declarationBadgeFirst: {
		backgroundColor: colors.infoSubtle,
		color: colors.info,
	},
	declarationBadgeKills: {
		backgroundColor: colors.warningSubtle,
		color: colors.warning,
	},
	declarationComment: {
		color: colors.textTertiary,
	},
	emptyText: {
		color: colors.textTertiary,
	},
});
