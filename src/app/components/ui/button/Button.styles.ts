/**
 * Button Component Styles
 * 
 * Theme-aware button styles with variant support
 * Uses design tokens from theme for consistent styling
 */

import { StyleSheet } from 'react-native';
import { spacing, borderRadius, typography } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base button styles (theme-independent structure)
 */
export const styles = StyleSheet.create({
	button: {
		paddingVertical: spacing.sm + 4, // 12px for better touch target
		paddingHorizontal: spacing.lg,
		borderRadius: borderRadius.md,
		alignItems: 'center',
		justifyContent: 'center',
		cursor: 'pointer',
		transition: 'opacity 0.2s, transform 0.1s',
		borderWidth: 1,
		borderStyle: 'solid',
	},
	buttonPaddingLg: {
		paddingVertical: spacing.sm + 4, // 12px for better touch target
		paddingHorizontal: spacing.lg,
	},
	buttonPaddingMd: {
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.sm,
	},
	buttonPaddingSm: {
		paddingVertical: spacing.xs,
		paddingHorizontal: spacing.sm,
	},
	hovered: {
		opacity: 0.8,
		transform: [{ scale: 0.98 }],
	},
	content: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: spacing.xs,
	},
	icon: {
		width: 20,
		height: 20,
		alignItems: 'center',
		justifyContent: 'center',
	},
	fullWidth: {
		width: '100%',
	},
	disabled: {
		opacity: 0.5,
	},
	text: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.semibold,
		textAlign: 'center',
	},
});

/**
 * Theme-aware variant styles
 * Returns appropriate colors based on theme mode
 */
export const getVariantStyles = (colors: ThemeColors) => ({
	primary: { 
		backgroundColor: colors.buttonPrimary,
		borderColor: colors.buttonPrimary,
	},
	secondary: { 
		backgroundColor: colors.buttonSecondary,
		borderColor: colors.border,
	},
	ghost: { 
		backgroundColor: colors.buttonGhost,
		borderColor: colors.border,
	},
	danger: { 
		backgroundColor: colors.buttonDanger,
		borderColor: colors.buttonDanger,
	},
});

/**
 * Theme-aware text color styles
 */
export const getVariantTextStyles = (colors: ThemeColors) => ({
	primary: { color: colors.textInverse },
	secondary: { color: colors.textPrimary },
	ghost: { color: colors.textPrimary },
	danger: { color: colors.textInverse },
});
