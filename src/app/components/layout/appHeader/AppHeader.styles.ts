/**
 * AppHeader Component Styles
 *
 * Layout-level styles only: header shell, brand row, desktop nav container,
 * mobile actions row, and icon buttons. Navigation link styles live in
 * HeaderMenu.styles.ts; user menu / avatar styles live in UserMenu.styles.ts.
 */

import { StyleSheet, Platform } from 'react-native';
import { spacing, typography, shadows } from '../../../theme';
import type { ThemeColors } from '../../../theme';

export const styles = StyleSheet.create({
	header: {
		borderBottomWidth: 1,
		...shadows.sm,
	},
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
		maxWidth: 1200,
		marginHorizontal: 'auto',
		width: '100%',
	},

	// ── Brand ─────────────────────────────────────────────────────────────────
	brandRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm + 2,
		flexShrink: 1,
	},
	brandLogo: {
		paddingRight: spacing.sm,
		height: 55,
		width: 55,
		marginTop: -10,
		marginBottom: -10,
	},
	brandTextContainer: {
		flexShrink: 1,
	},
	brandText: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.bold,
		flexWrap: 'wrap',
	},

	// ── Desktop nav row ───────────────────────────────────────────────────────
	desktopNav: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
	},

	// ── Mobile actions row ────────────────────────────────────────────────────
	mobileActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.md,
	},
	themeToggle: {
		padding: spacing.sm,
	},
	menuButton: {
		padding: spacing.sm,
	},

	// ── Shared icon button (theme toggle on desktop) ──────────────────────────
	iconButton: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
});

export const getThemedStyles = (colors: ThemeColors) =>
	StyleSheet.create({
		header: {
			backgroundColor: colors.surface,
			borderBottomColor: colors.border,
		},
		brandText: {
			color: colors.textPrimary,
		},
	});


