/**
 * Common Styles
 * 
 * Reusable, theme-independent style definitions used across multiple components.
 * Uses design tokens from tokens.ts for consistency.
 * 
 * Import these to maintain consistency and reduce duplication.
 * For theme-aware colors, use getThemedStyles in your component.
 */

import { StyleSheet } from 'react-native';
import { spacing, typography, borderRadius, shadows } from './tokens';

/**
 * Layout Styles
 * Common container and layout patterns using theme spacing
 */
export const layout = StyleSheet.create({
	// Centered full-screen container
	centeredContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: spacing.md,
	},
	// Full-screen container (background color should be applied via theme in component)
	container: {
		flex: 1,
	},
	// Centered content area with max width
	content: {
		padding: spacing.sm,
		maxWidth: 800,
		marginHorizontal: 'auto',
		width: '100%',
	},
    wideContent: {
		padding: spacing.sm,
		maxWidth: 1280,
		marginHorizontal: 'auto',
		width: '100%',
	},
	// Centered card container (max-w-md)
	cardContainer: {
		width: '100%',
		maxWidth: 448,
		alignItems: 'center',
	},
	// Flex row with centered items
	row: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	// Flex row with space between
	rowBetween: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	// Centered content
	centered: {
		alignItems: 'center',
		justifyContent: 'center',
	},
});

/**
 * Typography Styles
 * Common text styles - colors should be applied via theme in components
 * These define size, weight, and spacing only
 */
export const text = StyleSheet.create({
	// Hero title (largest)
	heroTitle: {
		fontSize: typography.fontSize['4xl'],
		fontWeight: typography.fontWeight.bold,
		marginBottom: spacing.sm,
		textAlign: 'center',
	},
	// Large page title (h1)
	pageTitle: {
		fontSize: typography.fontSize['3xl'],
		fontWeight: typography.fontWeight.bold,
		marginBottom: spacing.sm,
	},
	// Section title (h2)
	title: {
		fontSize: typography.fontSize['2xl'],
		fontWeight: typography.fontWeight.bold,
		marginBottom: spacing.sm,
		textAlign: 'center',
	},
	// Subsection title (h3)
	subtitle: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.semibold,
		marginBottom: spacing.md,
	},
	// Section header (h4)
	sectionTitle: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.semibold,
		marginBottom: spacing.sm,
	},
	// Body text - large
	bodyLarge: {
		fontSize: typography.fontSize.lg,
		lineHeight: typography.fontSize.lg * typography.lineHeight.normal,
	},
	// Body text - regular
	body: {
		fontSize: typography.fontSize.base,
		lineHeight: typography.fontSize.base * typography.lineHeight.normal,
	},
	// Body text - small
	bodySmall: {
		fontSize: typography.fontSize.sm,
		lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
	},
	// Small text (captions, labels)
	small: {
		fontSize: typography.fontSize.xs,
	},
	// Centered text
	centered: {
		textAlign: 'center',
	},
	// Bold emphasis
	bold: {
		fontWeight: typography.fontWeight.bold,
	},
	// Medium emphasis
	medium: {
		fontWeight: typography.fontWeight.medium,
	},
	// Semibold emphasis
	semibold: {
		fontWeight: typography.fontWeight.semibold,
	},
	// Feature card title (for backward compatibility)
	featureTitle: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.semibold,
		marginBottom: spacing.xs,
	},
	// Feature card description (for backward compatibility)
	featureDescription: {
		fontSize: typography.fontSize.sm,
	},
});

/**
 * Spacing Utilities
 * Common margin/padding patterns using theme spacing scale
 */
export const spacingUtils = StyleSheet.create({
	// Margins
	marginXs: { margin: spacing.xs },
	marginSm: { margin: spacing.sm },
	marginMd: { margin: spacing.md },
	marginLg: { margin: spacing.lg },
	marginXl: { margin: spacing.xl },
	
	marginBottomXs: { marginBottom: spacing.xs },
	marginBottomSm: { marginBottom: spacing.sm },
	marginBottomMd: { marginBottom: spacing.md },
	marginBottomLg: { marginBottom: spacing.lg },
	marginBottomXl: { marginBottom: spacing.xl },
	
	marginTopXs: { marginTop: spacing.xs },
	marginTopSm: { marginTop: spacing.sm },
	marginTopMd: { marginTop: spacing.md },
	marginTopLg: { marginTop: spacing.lg },
	marginTopXl: { marginTop: spacing.xl },
	
	// Paddings
	paddingXs: { padding: spacing.xs },
	paddingSm: { padding: spacing.sm },
	paddingMd: { padding: spacing.md },
	paddingLg: { padding: spacing.lg },
	paddingXl: { padding: spacing.xl },
	
	// Gaps (for flex containers)
	gapXs: { gap: spacing.xs },
	gapSm: { gap: spacing.sm },
	gapMd: { gap: spacing.md },
	gapLg: { gap: spacing.lg },
	gapXl: { gap: spacing.xl },
});

/**
 * Component Base Styles
 * Reusable component structure patterns (no colors - apply via theme)
 */
export const components = StyleSheet.create({
	// Card base structure
	card: {
		borderRadius: borderRadius.lg,
		padding: spacing.lg,
		...shadows.md,
	},
	// Card with less padding
	cardCompact: {
		borderRadius: borderRadius.lg,
		padding: spacing.md,
		...shadows.md,
	},
	// Card with no padding (for custom content)
	cardNoPadding: {
		borderRadius: borderRadius.lg,
		...shadows.md,
	},
	// Panel/modal base
	panel: {
		borderRadius: borderRadius.md,
		padding: spacing.md,
		...shadows.lg,
	},
	// Input field base
	input: {
		borderRadius: borderRadius.md,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
		fontSize: typography.fontSize.base,
		borderWidth: 1,
	},
	// Button base
	button: {
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.lg,
		borderRadius: borderRadius.md,
		alignItems: 'center',
		justifyContent: 'center',
	},
	// Button with icon
	buttonWithIcon: {
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
		borderRadius: borderRadius.md,
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
	},
	// Compact button
	buttonCompact: {
		paddingVertical: spacing.xs,
		paddingHorizontal: spacing.md,
		borderRadius: borderRadius.sm,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

/**
 * Utility Styles
 * Helper styles for common patterns
 */
export const utils = StyleSheet.create({
	fullWidth: { width: '100%' },
	fullHeight: { height: '100%' },
	flex1: { flex: 1 },
	hidden: { display: 'none' },
	opacity50: { opacity: 0.5 },
	opacity75: { opacity: 0.75 },
});
