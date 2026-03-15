/**
 * CommunityParticipantsPanel Styles
 *
 * Theme-aware styles for the read-only participants list panel.
 */

import { StyleSheet } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/** Base structure styles (theme-independent) */
export const styles = StyleSheet.create({
	container: {
		padding: spacing.md,
	},
	countText: {
		fontSize: typography.fontSize.sm,
		paddingBottom: spacing.sm,
	},
	raceGroup: {
		marginBottom: spacing.md,
	},
	raceGroupTitle: {
		fontSize: typography.fontSize.md,
		fontWeight: typography.fontWeight.semibold,
		marginBottom: spacing.sm,
	},
	participantRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		padding: spacing.sm,
		borderRadius: borderRadius.sm,
		marginBottom: spacing.xs,
		borderWidth: 1,
	},
	participantInfo: {
		flex: 1,
		gap: spacing.xxs,
	},
	participantName: {
		fontSize: typography.fontSize.md,
		fontWeight: typography.fontWeight.semibold,
	},
	badges: {
		flexDirection: 'row',
		gap: spacing.xs,
		flexWrap: 'wrap',
		marginTop: spacing.xxs,
	},
	badge: {
		fontSize: typography.fontSize.xs,
		fontWeight: typography.fontWeight.medium,
		paddingHorizontal: spacing.xs,
		paddingVertical: 2,
		borderRadius: borderRadius.sm,
		overflow: 'hidden',
	},
	notes: {
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

/** Themed styles (color-dependent) */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	countText: {
		color: colors.textSecondary,
	},
	raceGroupTitle: {
		color: colors.textPrimary,
	},
	participantRow: {
		backgroundColor: colors.surface,
		borderColor: colors.border,
	},
	participantName: {
		color: colors.textPrimary,
	},
	badgeDls: {
		backgroundColor: colors.warningSubtle,
		color: colors.warning,
	},
	badgeVirtual: {
		backgroundColor: colors.infoSubtle,
		color: colors.info,
	},
	badgeChallenge: {
		backgroundColor: colors.successSubtle,
		color: colors.success,
	},
	badgeSpectator: {
		backgroundColor: colors.infoSubtle,
		color: colors.info,
	},
	notes: {
		color: colors.textTertiary,
	},
	emptyText: {
		color: colors.textTertiary,
	},
});
