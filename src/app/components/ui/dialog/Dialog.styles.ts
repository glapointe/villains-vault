/**
 * Dialog Component Styles
 * 
 * Theme-aware dialog/modal styles
 * Uses design tokens from theme for consistent styling
 */

import { StyleSheet, Platform } from 'react-native';
import { spacing, borderRadius, typography, shadows } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base dialog structure (theme-independent)
 */
export const styles = StyleSheet.create({
	centeredView: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: spacing.md + 4, // 20px for edge spacing
	},
	modalView: {
		borderRadius: borderRadius.lg,
		borderWidth: 1,
		padding: spacing.lg,
		width: '100%',
		maxWidth: Platform.OS === 'web' ? 500 : '100%',
		...shadows.xl,
	},
	title: {
		fontSize: typography.fontSize.xl,
		fontWeight: typography.fontWeight.bold,
		marginBottom: spacing.md,
	},
	message: {
		fontSize: typography.fontSize.sm,
		marginBottom: spacing.md,
		lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
	},
	actions: {
		flexDirection: 'row',
		gap: spacing.md,
		marginTop: spacing.md + 4, // 20px for visual separation
	},
	actionButton: {
		flex: 1,
	},
});

/**
 * Theme-aware dialog styles
 * Returns appropriate colors based on theme mode
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: colors.overlay,
		justifyContent: 'center',
		alignItems: 'center',
		// @ts-ignore - z-index for web
		zIndex: 9999,
	},
	modalView: {
		backgroundColor: colors.surface,
		borderColor: colors.border,
	},
	title: {
		color: colors.textPrimary,
	},
	message: {
		color: colors.textSecondary,
	},
});
