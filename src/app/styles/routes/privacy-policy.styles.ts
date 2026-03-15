/**
 * Privacy Policy Route Styles
 * 
 * Theme-aware styles for the privacy policy page
 * Uses design tokens from theme for consistent styling
 */

import { StyleSheet } from 'react-native';
import { spacing, typography, borderRadius } from '../../theme';
import type { ThemeColors } from '../../theme';

/**
 * Base privacy policy structure (theme-independent)
 */
export const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	content: {
		padding: spacing.lg,
		paddingBottom: spacing.xl * 2,
	},
	header: {
		marginBottom: spacing.xl,
	},
	title: {
		fontSize: typography.fontSize['3xl'],
		fontWeight: typography.fontWeight.bold as any,
		marginBottom: spacing.sm,
	},
	lastUpdated: {
		fontSize: typography.fontSize.sm,
		fontStyle: 'italic',
	},
	section: {
		marginBottom: spacing.xl,
	},
	sectionTitle: {
		fontSize: typography.fontSize.xl,
		fontWeight: typography.fontWeight.semibold as any,
		marginBottom: spacing.md,
	},
	subsectionTitle: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.semibold as any,
		marginTop: spacing.md,
		marginBottom: spacing.sm,
	},
	paragraph: {
		fontSize: typography.fontSize.base,
		lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
		marginBottom: spacing.md,
	},
	bulletPoint: {
		fontSize: typography.fontSize.base,
		lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
		marginBottom: spacing.xs,
		paddingLeft: spacing.md,
	},
	footer: {
		marginTop: spacing.xl,
		alignItems: 'center',
	},
	backButton: {
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.xl,
		borderRadius: borderRadius.md,
		minWidth: 200,
		alignItems: 'center',
	},
	backButtonText: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.semibold as any,
	},
});

/**
 * Theme-aware styles for privacy policy
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	container: {
		backgroundColor: colors.background,
	},
	title: {
		color: colors.textPrimary,
	},
	subtitle: {
		color: colors.textSecondary,
	},
	text: {
		color: colors.textPrimary,
	},
	sectionTitle: {
		color: colors.textPrimary,
	},
	subsectionTitle: {
		color: colors.textPrimary,
	},
	backButton: {
		backgroundColor: colors.primary,
	},
	backButtonText: {
		color: colors.textInverse,
	},
});
