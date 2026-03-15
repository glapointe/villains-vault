/**
 * UserMenu Component Styles
 *
 * Covers: avatar button, sign-in button, dropdown (desktop card + mobile sheet),
 * user identity header inside the dropdown, and the backdrop overlay.
 */

import { StyleSheet } from 'react-native';
import { spacing, typography, shadows, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

export const styles = StyleSheet.create({
	// ── Sign-in button ────────────────────────────────────────────────────────
	signInButton: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderRadius: borderRadius.sm + 2,
	},
	signInText: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.semibold,
	},

	// ── Avatar button ─────────────────────────────────────────────────────────
	userMenuContainer: {
		position: 'relative',
		zIndex: 100,
	},
	avatarButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
	},
	avatarImage: {
		width: 36,
		height: 36,
		borderRadius: 18,
	},
	avatarInitial: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.bold,
	},

	// ── User identity header inside dropdown ──────────────────────────────────
	dropdownUserHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderBottomWidth: 1,
		gap: spacing.md,
	},
	dropdownUserAvatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
		flexShrink: 0,
	},
	dropdownUserAvatarImage: {
		width: 48,
		height: 48,
		borderRadius: 24,
	},
	dropdownUserAvatarInitial: {
		fontSize: typography.fontSize.xl,
		fontWeight: typography.fontWeight.bold,
	},
	dropdownUserName: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.semibold,
	},
	dropdownUserEmail: {
		fontSize: typography.fontSize.xs,
		marginTop: 2,
	},

	// ── Desktop floating card ─────────────────────────────────────────────────
	userDropdown: {
		position: 'absolute',
		top: 68,
		right: spacing.md,
		width: 280,
		borderWidth: 1,
		borderRadius: borderRadius.md,
		...shadows.md,
		zIndex: 9999,
	},
	userDropdownItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm + 2,
		gap: spacing.sm,
	},
	userDropdownItemText: {
		fontSize: typography.fontSize.sm,
	},
	dropdownItemIcon: {
		width: 16,
	},

	// ── Mobile full-width sheet ────────────────────────────────────────────────
	userDropdownMobile: {
		position: 'absolute',
		left: 0,
		right: 0,
		borderTopWidth: 1,
		zIndex: 9999,
	},
	mobileMenuItem: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
		borderBottomWidth: 1,
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
		signInButton: {
			backgroundColor: colors.buttonPrimary,
		},
		signInText: {
			color: colors.textInverse,
		},
		avatarButton: {
			backgroundColor: colors.primary,
		},
		avatarInitial: {
			color: colors.textInverse,
		},
		dropdownUserHeader: {
			borderBottomColor: colors.borderLight,
		},
		dropdownUserHeaderMobile: {
			backgroundColor: colors.surfaceElevated,
		},
		dropdownUserAvatar: {
			backgroundColor: colors.primary,
		},
		dropdownUserAvatarInitial: {
			color: colors.textInverse,
		},
		dropdownUserName: {
			color: colors.textPrimary,
		},
		dropdownUserEmail: {
			color: colors.textSecondary,
		},
		userDropdown: {
			backgroundColor: colors.surface,
			borderColor: colors.border,
		},
		userDropdownItem: {
			backgroundColor: 'transparent',
		},
		userDropdownItemHovered: {
			backgroundColor: colors.background,
		},
		userDropdownItemText: {
			color: colors.textPrimary,
		},
		userDropdownMobile: {
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
