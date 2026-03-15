/**
 * ChatChart Component Styles
 *
 * Styles for inline chart rendering within AI chat messages.
 * Separates structure (styles) from theme colours (getThemedStyles).
 */

import { StyleSheet } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base structure styles (theme-independent)
 */
export const styles = StyleSheet.create({
	container: {
		marginVertical: spacing.sm,
		borderRadius: borderRadius.lg,
		overflow: 'hidden',
	},
	chartWrapper: {
		padding: spacing.sm,
	},
});

/**
 * Theme-dependent styles
 */
export const getThemedStyles = (colors: ThemeColors) =>
	StyleSheet.create({
		container: {
			backgroundColor: colors.surface,
			borderColor: colors.borderLight,
			borderWidth: 1,
		},
	});
