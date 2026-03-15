/**
 * Card Component Styles
 * 
 * Theme-aware card styles with optional padding and popout modal support
 * Uses design tokens from theme for consistent styling
 */

import { StyleSheet, Platform } from 'react-native';
import { borderRadius, spacing, shadows, typography } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base card structure (theme-independent)
 */
export const styles = StyleSheet.create({
	card: {
		borderRadius: borderRadius.lg,
		padding: spacing.md,
		...shadows.md,
	},
	cardNoPadding: {
		borderRadius: borderRadius.lg,
		...shadows.md,
	},
	popoutCard: {
		...Platform.select({
			web: {
				cursor: 'pointer' as any,
			},
			default: {},
		}),
	},
	modalContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: spacing.lg,
	},
	modalContentWrapper: {
		maxHeight: '95%',
		width: '100%',
	},
	modalScrollContent: {
		flexGrow: 1,
	},
	modalCard: {
		minHeight: 400,
		width: '100%',
	},
	closeButton: {
		position: 'absolute',
		top: spacing.md,
		right: spacing.md,
		zIndex: 1000,
		width: 40,
		height: 40,
		borderRadius: borderRadius.full,
		justifyContent: 'center',
		alignItems: 'center',
		...shadows.md,
		...Platform.select({
			web: {
				cursor: 'pointer' as any,
			},
			default: {},
		}),
	},
	closeButtonText: {
		fontSize: typography.fontSize.xl,
		fontWeight: typography.fontWeight.bold,
		lineHeight: typography.fontSize.xl * 1.2,
	},
});

/**
 * Theme-aware card styles
 * Returns appropriate background color based on theme mode
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	card: {
		backgroundColor: colors.surface,
		color: colors.textPrimary,
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: colors.overlay,
	},
	closeButton: {
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
	},
	closeButtonText: {
		color: colors.textPrimary,
	},
});
