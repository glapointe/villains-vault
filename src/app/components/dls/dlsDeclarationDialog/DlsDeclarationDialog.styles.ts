/**
 * DlsDeclarationDialog Styles
 *
 * Theme-aware styles for the DLS declaration dialog.
 * Uses three-tier architecture: base structure + themed colors.
 */

import { StyleSheet } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base structural styles (theme-independent)
 */
export const styles = StyleSheet.create({
	form: {
		gap: spacing.md,
		paddingTop: spacing.sm,
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
	commentsInput: {
		fontSize: typography.fontSize.sm,
		borderWidth: 1,
		borderRadius: borderRadius.sm,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.sm,
		minHeight: 72,
		textAlignVertical: 'top',
	},
	checkboxGroup: {
		gap: spacing.sm,
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
});

/**
 * Themed styles (color-dependent)
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	fieldLabel: {
		color: colors.textSecondary,
	},
	textInput: {
		color: colors.textPrimary,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	commentsInput: {
		color: colors.textPrimary,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	withdrawContainer: {
		borderTopColor: colors.border,
	},
	withdrawLabel: {
		color: colors.textTertiary,
	},
});
