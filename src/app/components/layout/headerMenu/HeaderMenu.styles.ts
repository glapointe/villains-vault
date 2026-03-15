/**
 * HeaderMenu Component Styles
 *
 * Desktop nav links and mobile menu dropdown.
 */

import { StyleSheet } from 'react-native';
import { spacing, typography } from '../../../theme';
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
		borderTopWidth: 1,
		paddingVertical: spacing.sm,
	},
	mobileMenuItem: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
		borderBottomWidth: 1,
	},
	mobileMenuText: {
		fontSize: typography.fontSize.base,
	},
});

export const getThemedStyles = (colors: ThemeColors) =>
	StyleSheet.create({
		navText: {
			color: colors.textPrimary,
		},
		mobileMenu: {
			backgroundColor: colors.surfaceElevated,
			borderTopColor: colors.border,
		},
		mobileMenuItem: {
			borderBottomColor: colors.borderLight,
		},
		mobileMenuText: {
			color: colors.textPrimary,
		},
	});
