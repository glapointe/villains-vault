/**
 * Login Route Styles
 * 
 * Theme-aware styles for login page
 * Uses design tokens from theme for consistent styling
 */

import { StyleSheet } from 'react-native';
import { layout, text } from '../../theme/commonStyles';
import { spacing, typography } from '../../theme';
import type { ThemeColors } from '../../theme';

/**
 * Base login page structure (theme-independent)
 */
export const styles = StyleSheet.create({
	container: {
		...layout.centeredContainer,
		backgroundColor: 'transparent',
	},
	card: {
		...layout.cardContainer,
		maxWidth: 400,
	},
	title: text.pageTitle,
	subtitle: {
		...text.body,
		fontSize: typography.fontSize.base,
		marginBottom: spacing['2xl'],
	},
	button: {
		marginBottom: spacing.sm,
	},
	footer: {
		fontSize: typography.fontSize.sm,
		marginTop: spacing.lg,
		textAlign: 'center',
	},
});

/**
 * Theme-aware styles for login page
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	title: {
		color: colors.textPrimary,
	},
	subtitle: {
		color: colors.textSecondary,
	},
	footer: {
		color: colors.textTertiary,
	},
});
