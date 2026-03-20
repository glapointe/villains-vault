/**
 * HeaderMenu Component Styles
 *
 * Desktop nav links and mobile menu dropdown.
 */

import { StyleSheet } from 'react-native';
import { spacing, typography, shadows, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

export const styles = StyleSheet.create({
	// ── Desktop nav links ──────────────────────────────────────────────────────
	navLink: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	navText: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.medium,
	},

	// ── Mobile dropdown ────────────────────────────────────────────────────────
	mobileMenu: {
		position: 'absolute',
		maxWidth: 320,
		width: '100%',
		right: 0,
		borderWidth: 1,
		borderRadius: borderRadius.md,
		zIndex: 9999,
		paddingVertical: spacing.sm,
		...shadows.xl,
	},
	mobileMenuItem: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
	},
	mobileMenuText: {
		fontSize: typography.fontSize.base,
	},

	// ── Backdrop ──────────────────────────────────────────────────────────────
	dropdownBackdrop: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 99,
	},
});

export const getThemedStyles = (colors: ThemeColors) =>
	StyleSheet.create({
		navText: {
			color: colors.textPrimary,
		},
		mobileMenu: {
			backgroundColor: colors.background,
			borderColor: colors.border,
		},
		mobileMenuItem: {
			borderBottomColor: colors.borderLight,
		},
		mobileMenuText: {
			color: colors.textPrimary,
		},
	});
