/**
 * Footer Component Styles
 * 
 * Theme-aware styles for the footer component that appears on all pages
 */

import { StyleSheet } from 'react-native';
import { spacing, typography, shadows } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base footer structure (theme-independent)
 */
export const styles = StyleSheet.create({
	footer: {
		paddingVertical: spacing.lg,
		paddingHorizontal: spacing.lg,
		borderTopWidth: 1,
		...shadows.md,
		zIndex: 10,
	},
	footerContent: {
		maxWidth: 1200,
		width: '100%',
		alignSelf: 'center',
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: spacing.lg,
	},
	footerLeft: {
		alignItems: 'flex-start',
		flex: 1,
	},
	footerRight: {
		alignItems: 'flex-end',
		flex: 1,
	},
	footerText: {
		fontSize: typography.fontSize.xs,
		textAlign: 'center',
		lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
		marginBottom: spacing.xs,
	},
	footerSubtext: {
		fontSize: typography.fontSize.xs,
		textAlign: 'center',
		lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
		marginTop: spacing.xs,
	},
	footerLinks: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		flexWrap: 'wrap',
		gap: spacing.sm,
		marginTop: spacing.xs,
		marginBottom: spacing.xs,
	},
	footerLink: {
		fontSize: typography.fontSize.xs,
		fontWeight: typography.fontWeight.medium,
		lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
	},
	footerSeparator: {
		fontSize: typography.fontSize.xs,
	},
});

/**
 * Theme-aware styles for footer
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	footer: {
		backgroundColor: colors.surface,
		borderTopColor: colors.border,
	},
	footerText: {
		color: colors.textSecondary,
	},
	footerSubtext: {
		color: colors.textTertiary,
	},
	footerLink: {
		color: colors.primary,
	},
});
