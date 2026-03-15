/**
 * Checkbox Component Styles
 * 
 * Theme-aware styles for checkbox component
 * Uses design tokens from theme for consistent styling
 */

import { StyleSheet } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base checkbox structure (theme-independent)
 */
export const styles = StyleSheet.create({
	container: {
		paddingVertical: spacing.xs,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	checkbox: {
		width: 24,
		height: 24,
		borderRadius: borderRadius.sm,
		borderWidth: 2,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: spacing.sm,
		marginTop: 2,
	},
	checkmark: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.bold,
	},
	textContainer: {
		flexShrink: 1,
	},
	label: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.medium,
		lineHeight: typography.fontSize.base * typography.lineHeight.normal,
	},
	description: {
		fontSize: typography.fontSize.sm,
		lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
		marginTop: spacing.xs,
	},
});

/**
 * Theme-aware styles for Checkbox
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	checkbox: {
		borderColor: colors.border,
		backgroundColor: 'transparent',
	},
	checkboxChecked: {
		borderColor: colors.primary,
		backgroundColor: colors.primary,
	},
	checkboxDisabled: {
		borderColor: colors.borderLight,
		backgroundColor: colors.surfaceElevated,
		opacity: 0.5,
	},
	checkboxDisabledChecked: {		
		borderColor: colors.primary,
		backgroundColor: colors.primary,
		opacity: 0.5,
	},
	checkmark: {
		color: colors.textInverse,
	},
	label: {
		color: colors.textPrimary,
	},
	labelDisabled: {
		color: colors.textDisabled,
	},
	description: {
		color: colors.textSecondary,
	},
});
