/**
 * CommunityParticipationPanel Styles
 *
 * Theme-aware styles for the participation management panel.
 */

import { StyleSheet } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/** Base structure styles (theme-independent) */
export const styles = StyleSheet.create({
	container: {
		padding: spacing.md,
		gap: spacing.md,
	},
	description: {
		fontSize: typography.fontSize.sm,
		lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
	},
	raceSection: {
		borderWidth: 1,
		borderRadius: borderRadius.md,
		padding: spacing.md,
		gap: spacing.sm,
	},
	raceHeader: {
		marginBottom: spacing.xs,
	},
	raceTitle: {
		fontSize: typography.fontSize.md,
		fontWeight: typography.fontWeight.semibold,
	},
	raceMeta: {
		fontSize: typography.fontSize.sm,
	},
	checkboxGroup: {
		gap: spacing.sm,
	},
	notesInput: {
		fontSize: typography.fontSize.sm,
		borderWidth: 1,
		borderRadius: borderRadius.sm,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.sm,
		minHeight: 56,
		textAlignVertical: 'top',
	},
	copyLink: {
		fontSize: typography.fontSize.xs,
		fontWeight: typography.fontWeight.medium,
	},
	withdrawContainer: {
		borderTopWidth: 1,
		paddingTop: spacing.md,
		marginTop: spacing.xs,
	},
	withdrawLabel: {
		fontSize: typography.fontSize.sm,
		textAlign: 'center',
		marginBottom: spacing.sm,
	},
	footerRow: {
		flexDirection: 'row',
		gap: spacing.md,
	},
	errorText: {
		fontSize: typography.fontSize.sm,
		textAlign: 'center',
	},
});

/** Themed styles (color-dependent) */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	description: {
		color: colors.textSecondary,
	},
	raceSection: {
		borderColor: colors.borderLight,
		backgroundColor: colors.background,
	},
	raceTitle: {
		color: colors.textPrimary,
	},
	raceMeta: {
		color: colors.textSecondary,
	},
	notesInput: {
		color: colors.textPrimary,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	copyLink: {
		color: colors.primary,
	},
	withdrawContainer: {
		borderTopColor: colors.border,
	},
	withdrawLabel: {
		color: colors.textTertiary,
	},
	errorText: {
		color: colors.error,
	},
});
