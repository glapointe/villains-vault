/**
 * Index Route Styles
 * 
 * Theme-aware styles for home page.
 * Hero section is full-bleed (no max-width constraint).
 * Content sheet overlaps hero bottom with rounded top corners.
 * Uses design tokens from theme for consistent styling.
 */

import { StyleSheet, Platform } from 'react-native';
import { layout } from '../../theme/commonStyles';
import { spacing, borderRadius } from '../../theme';
import type { ThemeColors } from '../../theme';

/**
 * Base home page structure (theme-independent)
 */
export const styles = StyleSheet.create({
	container: {
		...layout.container,
		backgroundColor: 'transparent',
	},

	// Hero section — full width, no horizontal padding
	heroSection: {
		width: '100%',
	},

	// Content sheet — overlaps hero bottom, rounded top corners
	contentSheet: {
		marginTop: -28,
		borderTopLeftRadius: borderRadius.xl,
		borderTopRightRadius: borderRadius.xl,
		paddingTop: spacing.xl,
		paddingHorizontal: spacing.lg,
		maxWidth: 900,
		marginHorizontal: 'auto',
		width: '100%',
		position: 'relative',
		zIndex: 1,
	},

	// Events section (section header + list)
	eventsSection: {
		marginBottom: spacing.lg,
	},

	// Two-column layout: events (left) + DLS sidebar (right) on web
	mainContentRow: {
		flexDirection: 'row' as const,
		flexWrap: 'wrap',
		gap: spacing.lg,
	},

	// Events column — takes 2/3 on web, full width on native
	eventsColumn: {
		flex: 2,
		minWidth: 250,
	},

	// DLS sidebar — takes 1/3 on web, full width on native
	miscColumn: {
		flex: 1,
		minWidth: 250,
	},

	// Disclaimer at bottom
	disclaimerSection: {
		marginTop: spacing.md,
	},
});

/**
 * Theme-aware styles for home page
 */
export const getThemedStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
	contentSheet: {
		backgroundColor: colors.background,
	},
});
