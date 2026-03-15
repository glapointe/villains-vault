/**
 * SectionHeader Styles
 * 
 * Theme-aware styles for the section header component.
 * Uses design tokens from theme for consistent styling.
 */

import { StyleSheet } from 'react-native';
import { spacing, typography } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base section header structure (theme-independent)
 */
export const styles = StyleSheet.create({
	container: {
		marginBottom: spacing.md,
		marginTop: spacing.sm,
	},
	headerRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.lg,
		justifyContent: 'space-between',
		alignItems: 'flex-end',
		marginBottom: spacing.sm,
	},
	pageHeader: {
		paddingBottom: spacing.md,
	},
	title: {
		fontSize: typography.fontSize['2xl'],
		fontWeight: typography.fontWeight.bold,
		lineHeight: 45,
	},
	subTitle: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.semibold,
	},
	leftContent: {
		flex: 1,
		flexShrink: 0,
		marginRight: spacing.sm,
		alignSelf: 'center',
	},
	rightContent: {
		flexShrink: 0,
		minWidth: 120,
		alignSelf: 'center',
	},
	pageHeaderLeftContent: {
		paddingLeft: spacing.lg,
		minWidth: 250,
	},
	pageHeaderRightContent: {
		paddingRight: spacing.lg,
		paddingLeft: spacing.lg,
	},
	accentLine: {
		height: 2,
	},
});

/**
 * Theme-aware section header styles
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	title: {
		color: colors.textPrimary,
	},
	subTitle: {
		color: colors.textSecondary,
	},
});
