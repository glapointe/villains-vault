/**
 * Disclaimer Banner Component Styles
 * 
 * Theme-aware styles for the disclaimer banner on the home page
 */

import { StyleSheet } from 'react-native';
import { spacing, typography, borderRadius, shadows } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base disclaimer banner structure (theme-independent)
 */
export const styles = StyleSheet.create({
	disclaimer: {
		marginTop: spacing.xl,
		marginBottom: spacing.lg,
		marginHorizontal: spacing.lg,
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.lg,
		borderRadius: borderRadius.md,
		borderWidth: 1,
		...shadows.md,
	},
	disclaimerText: {
		fontSize: typography.fontSize.xs,
		textAlign: 'center',
		lineHeight: typography.fontSize.xs * typography.lineHeight.relaxed,
	},
});

/**
 * Theme-aware styles for disclaimer banner
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	disclaimer: {
		backgroundColor: colors.surfaceElevated,
		borderColor: colors.borderLight,
	},
	disclaimerText: {
		color: colors.textSecondary,
	},
});
