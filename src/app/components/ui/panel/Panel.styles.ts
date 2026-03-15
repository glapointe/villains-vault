/**
 * Panel Component Styles
 * 
 * Theme-aware styles for side panel/drawer component
 * Uses design tokens from theme for consistent styling
 */

import { StyleSheet, Platform } from 'react-native';
import { spacing, typography, shadows } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base panel structure (theme-independent)
 */
export const styles = StyleSheet.create({
	panelContainer: {
		position: 'absolute',
		top: 0,
		right: 0,
		bottom: 0,
		zIndex: 20,
	},
	panel: Platform.select({
		web: {
			flex: 1,
			width: '100%',
			flexDirection: 'column',
			...shadows.xl,
		},
		default: {
			height: '100%',
			width: '100%',
			flexDirection: 'column',
			...shadows.xl,
		},
	}) as any,
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
		borderBottomWidth: 1,
	},
	headerTitle: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.semibold,
		flex: 1,
	},
	closeButton: {
		padding: spacing.sm,
		minWidth: 32,
		minHeight: 32,
		alignItems: 'center',
		justifyContent: 'center',
	},
	closeButtonText: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.bold,
	},
	content: {
		flex: 1,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
	},
	footer: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
		borderTopWidth: 1,
	},
});

/**
 * Theme-aware styles for Panel based on light/dark mode
 */
export const getThemedStyles = (colors: ThemeColors, isDark: boolean) => {
	return StyleSheet.create({
		backdrop: {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			zIndex: 10,
			backgroundColor: colors.overlay,
		},
		panel: {
			backgroundColor: colors.background,
		},
		header: {
			borderBottomColor: colors.border,
		},
		headerTitle: {
			color: colors.textPrimary,
		},
		closeButtonText: {
			color: colors.textPrimary,
		},
		footer: {
			borderTopColor: colors.border,
			backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
		},
	});
};
