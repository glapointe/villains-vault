/**
 * EditUserPanel Styles
 * 
 * Styles for the edit user panel component.
 * Follows split pattern: static structure + themed colors.
 */

import { StyleSheet } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Static structural styles (no colors)
 */
export const styles = StyleSheet.create({
	scrollContent: {
		paddingBottom: spacing.xl,
		paddingHorizontal: spacing.sm,
	},
	description: {
		fontSize: typography.fontSize.sm,
		lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
		marginBottom: spacing.lg,
	},
	fieldGroup: {
		marginBottom: spacing.lg,
	},
	label: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.medium,
		marginBottom: spacing.xs,
	},
	input: {
		borderWidth: 1,
		borderRadius: borderRadius.md,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm + 2,
		fontSize: typography.fontSize.sm,
	},
	readOnlyField: {
		fontSize: typography.fontSize.sm,
		paddingVertical: spacing.sm,
	},
	checkboxContainer: {
		marginTop: spacing.sm,
	},
	checkboxGroup: {
		gap: spacing.xs,
	},
	sectionHeader: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.semibold,
		marginBottom: spacing.xs,
	},
	disabledNote: {
		fontSize: typography.fontSize.xs,
		fontStyle: 'italic',
		marginTop: spacing.xs,
	},
	footerButtons: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: spacing.sm,
	},
});

/**
 * Theme-aware styles
 */
export const getThemedStyles = (colors: ThemeColors) =>
	StyleSheet.create({
		description: {
			color: colors.textSecondary,
		},
		label: {
			color: colors.textPrimary,
		},
		input: {
			color: colors.textPrimary,
			borderColor: colors.border,
			backgroundColor: colors.surface,
		},
		readOnlyField: {
			color: colors.textSecondary,
		},
		disabledNote: {
			color: colors.textTertiary,
		},
	});
