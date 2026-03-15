/**
 * Dropdown Component Styles - Native
 *
 * React Native styles for native dropdown component
 * Separated into structure (base) and colors (themed)
 */

import { StyleSheet } from 'react-native';
import { borderRadius, typography } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base dropdown structure (theme-independent)
 */
export const styles = StyleSheet.create({
	container: {
		borderRadius: borderRadius.md,
		borderWidth: 1,
		overflow: 'hidden',
        minWidth: 85,
	},
	picker: {
		backgroundColor: 'transparent',
	},
	pickerItem: {
		fontSize: typography.fontSize.sm,
	},
});

/**
 * Theme-aware styles for dropdown
 */
export const getThemedStyles = (colors: ThemeColors) =>
	StyleSheet.create({
		container: {
			borderColor: colors.border,
			backgroundColor: colors.background,
		},
		picker: {
			color: colors.textPrimary,
		},
		pickerItem: {
			color: colors.textPrimary,
			backgroundColor: colors.background,
		},
		pickerItemDisabled: {
			color: colors.textDisabled,
		}
	});
