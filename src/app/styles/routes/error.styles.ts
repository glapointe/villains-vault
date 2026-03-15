/**
 * Error Route Styles
 * 
 * Theme-aware styles for error page
 * Uses design tokens from theme for consistent styling
 */

import { StyleSheet } from 'react-native';
import { layout, text } from '../../theme/commonStyles';
import { spacing, borderRadius } from '../../theme';
import type { ThemeColors } from '../../theme';

/**
 * Base error page structure (theme-independent)
 */
export const styles = StyleSheet.create({
	container: layout.centeredContainer,
	card: layout.cardContainer,
	title: text.title,
	message: {
		...text.body,
		marginBottom: spacing.lg,
	},
	icon: {
		fontSize: 60,
		marginBottom: spacing.md,
	},
	stackTrace: {
		marginBottom: spacing.lg,
		padding: spacing.md,
		borderRadius: borderRadius.md,
		width: '100%',
	},
	stackTraceText: {
		fontSize: 12,
		fontFamily: 'monospace',
	},
	buttonContainer: {
		width: '100%',
		gap: spacing.sm,
	},
});

/**
 * Theme-aware styles for error page
 */
export const getThemedStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
    title: {
        color: colors.textPrimary,
    },
    message: {
        color: colors.textSecondary,
    },
	icon: {
		color: colors.error,
	},
	stackTrace: {
		backgroundColor: colors.errorSubtle,
	},
	stackTraceText: {
		color: colors.error,
	},
});
