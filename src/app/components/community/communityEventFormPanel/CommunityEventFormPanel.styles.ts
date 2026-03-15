/**
 * CommunityEventFormPanel Styles
 *
 * Theme-aware styles for the event creation/editing panel.
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
	fieldLabel: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.medium,
		marginBottom: spacing.xxs,
	},
	textInput: {
		fontSize: typography.fontSize.sm,
		borderWidth: 1,
		borderRadius: borderRadius.sm,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.sm,
	},
	textArea: {
		fontSize: typography.fontSize.sm,
		borderWidth: 1,
		borderRadius: borderRadius.sm,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.sm,
		minHeight: 72,
		textAlignVertical: 'top',
	},
	sectionTitle: {
		fontSize: typography.fontSize.md,
		fontWeight: typography.fontWeight.semibold,
		marginTop: spacing.sm,
	},
	raceSection: {
		borderWidth: 1,
		borderRadius: borderRadius.md,
		padding: spacing.md,
		marginBottom: spacing.sm,
		gap: spacing.sm,
	},
	raceHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	raceNumber: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.semibold,
	},
	distanceRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
	},
	distanceInput: {
		flex: 1,
		fontSize: typography.fontSize.sm,
		borderWidth: 1,
		borderRadius: borderRadius.sm,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.sm,
		minWidth: 130,
	},
	unitToggle: {
		flexDirection: 'row',
		borderWidth: 1,
		borderRadius: borderRadius.sm,
		overflow: 'hidden',
	},
	unitButton: {
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.sm,
	},
	unitButtonActive: {
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.sm,
	},
	unitButtonText: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.medium,
	},
	dateButton: {
		borderWidth: 1,
		borderRadius: borderRadius.sm,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.sm,
	},
	checkboxRow: {
		gap: spacing.sm,
	},
	addRaceButton: {
		alignSelf: 'flex-start',
	},
	deleteSection: {
		borderTopWidth: 1,
		paddingTop: spacing.md,
		marginTop: spacing.sm,
	},
	deleteLabel: {
		fontSize: typography.fontSize.sm,
		textAlign: 'center',
		marginBottom: spacing.sm,
	},
	errorText: {
		fontSize: typography.fontSize.sm,
		textAlign: 'center',
	},
	footerRow: {
		flexDirection: 'row',
		gap: spacing.md,
	},
});

/** Themed styles (color-dependent) */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	fieldLabel: {
		color: colors.textSecondary,
	},
	textInput: {
		color: colors.textPrimary,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	textArea: {
		color: colors.textPrimary,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	sectionTitle: {
		color: colors.textPrimary,
	},
	raceSection: {
		borderColor: colors.borderLight,
		backgroundColor: colors.background,
	},
	raceNumber: {
		color: colors.textSecondary,
	},
	distanceInput: {
		color: colors.textPrimary,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	unitToggle: {
		borderColor: colors.border,
	},
	unitButton: {
		backgroundColor: colors.surface,
	},
	unitButtonActive: {
		backgroundColor: colors.primary,
	},
	unitButtonText: {
		color: colors.textSecondary,
	},
	unitButtonTextActive: {
		color: colors.textInverse,
	},
	deleteSection: {
		borderTopColor: colors.border,
	},
	deleteLabel: {
		color: colors.textTertiary,
	},
	errorText: {
		color: colors.error,
	},
});
