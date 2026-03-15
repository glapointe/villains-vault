/**
 * DistanceBadge Styles
 * 
 * Theme-aware styles for the distance badge pill component.
 * Uses design tokens from theme for consistent styling.
 */

import { StyleSheet, Platform } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base distance badge structure (theme-independent)
 */
export const styles = StyleSheet.create({
	badge: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderRadius: borderRadius.full,
		alignSelf: 'flex-start',
		minWidth: 48,
		alignItems: 'center',
	},
	badgeCompact: {
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
		borderRadius: borderRadius.full,
		alignSelf: 'flex-start',
		minWidth: 40,
		alignItems: 'center',
	},
	label: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.semibold,
		lineHeight: typography.fontSize.sm * typography.lineHeight.tight,
	},
	labelCompact: {
		fontSize: typography.fontSize.xs,
		fontWeight: typography.fontWeight.bold,
		lineHeight: typography.fontSize.xs * typography.lineHeight.tight,
	},
	pressable: {
		alignSelf: 'center',
		...Platform.select({
			web: {
				cursor: 'pointer',
				transition: 'opacity 0.15s ease',
			} as any,
			default: {},
		}),
	},
	pressableRow: {
		flexDirection: 'row',
		gap: spacing.xs,
	},
	pressableHover: {
		opacity: 0.8,
	},
});

/**
 * Theme-aware distance badge styles are applied inline
 * using getDistanceColor() for dynamic background/text colors
 */
export const getThemedStyles = (_colors: ThemeColors) => StyleSheet.create({
	// Intentionally empty — colors come from getDistanceColor() per badge instance
});
