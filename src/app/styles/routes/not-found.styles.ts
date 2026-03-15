/**
 * Not Found Route Styles
 * 
 * Theme-aware styles for 404 page
 * Uses design tokens from theme for consistent styling
 */

import { StyleSheet } from 'react-native';
import { layout, text } from '../../theme/commonStyles';
import { spacing } from '../../theme';
import type { ThemeColors } from '../../theme';

/**
 * Base not found page structure (theme-independent)
 */
export const styles = StyleSheet.create({
	container: layout.centeredContainer,
	card: layout.cardContainer,
	title: text.title,
	message: {
		...text.body,
		marginBottom: spacing['2xl'],
	},
	icon: {
		fontSize: 96,
		marginBottom: spacing.md,
	},
});

/**
 * Theme-aware styles for not found page
 */
export const getThemedStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
	icon: {
		color: colors.textSecondary,
	},
	title: {
		color: colors.textPrimary,
	},
	message: {
		color: colors.textSecondary,
	},
});
