/**
 * EventsList Styles
 * 
 * Theme-aware styles for the home page events list component.
 * Displays events with always-visible race distance badges.
 * Uses design tokens from theme for consistent styling.
 */

import { StyleSheet, Platform } from 'react-native';
import { spacing, typography, borderRadius, shadows, palette } from '../../theme';
import type { ThemeColors } from '../../theme';

/**
 * Base EventsList structure (theme-independent)
 */
export const styles = StyleSheet.create({
	container: {
		paddingVertical: spacing.sm,
	},
	eventsList: {
		gap: spacing.md,
	},

	// Event card
	eventCard: {
		marginBottom: spacing.sm,
		overflow: 'hidden',
		borderLeftWidth: 4,
	},
	eventContent: {
		padding: spacing.md,
	},
	eventContentClickable: {
		...Platform.select({
			web: {
				cursor: 'pointer',
				transition: 'opacity 0.2s ease',
			} as any,
			default: {},
		}),
	},
	eventContentHover: {
		opacity: 0.85,
	},

	// Event name
	eventNameRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: spacing.sm,
	},
	eventName: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.semibold,
		lineHeight: typography.fontSize.lg * typography.lineHeight.tight,
		flexShrink: 1,
	},

	// Navigate chevron
	chevron: {
		marginLeft: spacing.sm,
	},

	// Race distance badges row
	badgesRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.xs,
		marginBottom: spacing.sm,
	},

	// Date range row
	dateRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
	},
	dateText: {
		fontSize: typography.fontSize.sm,
		lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
	},
});

/**
 * Theme-aware styles for EventsList
 */
export const getThemedStyles = (colors: ThemeColors, isDark: boolean) => {
	return StyleSheet.create({
		eventCard: {
			borderLeftColor: isDark ? palette.villains.green : palette.villains.purple,
		},
		eventName: {
			color: colors.textPrimary,
		},
		chevron: {
			color: colors.textTertiary,
		},
		dateText: {
			color: colors.textSecondary,
		},
	});
};
