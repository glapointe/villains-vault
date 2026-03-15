/**
 * ChatPromptBar Component Styles
 *
 * Lightweight prompt input bar that appears on non-chat pages.
 * On the home page it navigates to the chat page; on race/results
 * pages it opens the chat in a Panel modal.
 * Includes a suggestions dropdown that appears on focus.
 */

import { StyleSheet, Platform } from 'react-native';
import { spacing, typography, borderRadius, shadows } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/** Width of the gradient border effect */
export const GRADIENT_BORDER_WIDTH = 2;

/**
 * Base structure styles (theme-independent)
 */
export const styles = StyleSheet.create({
	container: {
		paddingVertical: spacing.sm,
		zIndex: 10,
		...Platform.select({
			web: { overflow: 'visible' } as any,
			default: {},
		}),
	},
	/** Wraps the bar + dropdown so the dropdown can position relative to the bar */
	barContainer: {
		position: 'relative',
		zIndex: 10,
	},
	/** Wraps the gradient backing + the bar */
	gradientWrapper: {
		position: 'relative',
	},
	/** The gradient that sits behind the bar to create a border effect */
	gradientBacking: {
		position: 'absolute',
		top: -GRADIENT_BORDER_WIDTH,
		left: -GRADIENT_BORDER_WIDTH,
		right: -GRADIENT_BORDER_WIDTH,
		bottom: -GRADIENT_BORDER_WIDTH,
		borderRadius: borderRadius.lg + GRADIENT_BORDER_WIDTH,
		overflow: 'hidden',
	},
	bar: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: borderRadius.lg,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm + 2,
		gap: spacing.sm,
		position: 'relative',
		zIndex: 1,
		...Platform.select({
			web: { cursor: 'text' } as any,
			default: {},
		}),
	},
	icon: {
		fontSize: typography.fontSize.lg,
	},
	placeholderText: {
		flex: 1,
		minWidth: 135,
		fontSize: typography.fontSize.base,
		lineHeight: typography.fontSize.base * typography.lineHeight.normal,
		borderWidth: 0,
		...Platform.select({
			web: { outlineStyle: 'none' } as any,
			default: {},
		}),
	},
	badge: {
		fontSize: typography.fontSize.xs,
		fontWeight: typography.fontWeight.medium,
		paddingHorizontal: spacing.sm,
		paddingVertical: 2,
		borderRadius: borderRadius.full,
		overflow: 'hidden',
		whiteSpace: 'nowrap',
		textAlign: 'center',
		minWidth: 30,
	},

	// ── Suggestions dropdown ──
	dropdown: {
		marginTop: spacing.xs,
		borderRadius: borderRadius.lg,
		borderWidth: 1,
		overflow: 'hidden',
		...shadows.md,
		zIndex: 20,
	},

	dropdownItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm + 2,
		gap: spacing.sm,
		...Platform.select({
			web: { cursor: 'pointer' } as any,
			default: {},
		}),
	},
	dropdownItemIcon: {
		flexShrink: 0,
	},
	dropdownItemText: {
		flex: 1,
		fontSize: typography.fontSize.sm,
		lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
	},
});

/**
 * Theme-aware styles
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	bar: {
		backgroundColor: colors.surface,
	},
	/** Standard border shown when not focused */
	barBorder: {
		borderWidth: 1,
		borderColor: colors.border,
	},
	placeholderText: {
		color: colors.textDisabled,
	},
	badge: {
		backgroundColor: colors.primarySubtle,
		color: colors.primary,
	},

	// ── Suggestions dropdown ──
	dropdown: {
		backgroundColor: colors.surface,
		borderColor: colors.border,
	},
	dropdownItem: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.borderLight,
	},
	dropdownItemHovered: {
		backgroundColor: colors.surfaceMuted,
	},
	dropdownItemText: {
		color: colors.textSecondary,
	},
});
