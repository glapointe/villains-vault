/**
 * HeroCarousel Styles
 * 
 * Full-bleed hero carousel that spans the entire viewport width.
 * Text content is constrained to 800px max-width for readability.
 * Uses design tokens from theme for consistent styling.
 */

import { StyleSheet, Platform } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/** Hero height by platform */
export const HERO_HEIGHT_MOBILE = 320;
export const HERO_HEIGHT_WEB = 580;

/**
 * Base hero carousel structure (theme-independent)
 */
export const styles = StyleSheet.create({
	container: {
		width: '100%',
		overflow: 'hidden',
		position: 'relative',
	},
	containerMobile: {
		height: HERO_HEIGHT_MOBILE,
	},
	containerWeb: {
		height: HERO_HEIGHT_WEB,
	},

	// Slide layers (stacked absolutely)
	slideLayer: {
		...StyleSheet.absoluteFillObject,
	},
	slideImage: {
		width: '100%',
		height: '100%',
	},
	slideGradient: {
		...StyleSheet.absoluteFillObject,
	},

	// Dark scrim overlay for text readability
	scrimOverlay: {
		...StyleSheet.absoluteFillObject,
		zIndex: 2,
	},

	// Villains logo watermark
	logoWatermark: {
		position: 'absolute',
		zIndex: 3,
		opacity: 0.45,
	},
	logoWatermarkMobile: {
		width: 180,
		height: 180,
		top: '50%',
		left: '50%',
		marginTop: -90,
		marginLeft: -90,
	},
	logoWatermarkWeb: {
		width: 500,
		height: 500,
		top: '50%',
		left: '50%',
		marginTop: -250,
		marginLeft: -250,
	},

	// Text content overlay — constrained to content max-width
	contentOverlay: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		zIndex: 4,
		paddingHorizontal: spacing.lg,
		paddingBottom: spacing['2xl'],
		paddingTop: spacing['2xl'],
		maxWidth: 800,
		marginHorizontal: 'auto',
		width: '100%',
	},
	title: {
		fontSize: typography.fontSize['4xl'],
		fontWeight: typography.fontWeight.bold,
		lineHeight: typography.fontSize['4xl'] * typography.lineHeight.tight,
		marginBottom: spacing.xs,
		...Platform.select({
			web: {
				textShadow: '0 2px 8px rgba(0,0,0,0.5)',
			} as any,
			default: {
				textShadowColor: 'rgba(0,0,0,0.5)',
				textShadowOffset: { width: 0, height: 2 },
				textShadowRadius: 8,
			},
		}),
	},
	subtitle: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.normal,
		lineHeight: typography.fontSize.lg * typography.lineHeight.relaxed,
		...Platform.select({
			web: {
				textShadow: '0 1px 4px rgba(0,0,0,0.4)',
			} as any,
			default: {
				textShadowColor: 'rgba(0,0,0,0.4)',
				textShadowOffset: { width: 0, height: 1 },
				textShadowRadius: 4,
			},
		}),
	},

	// Gradient accent bar at bottom
	accentBar: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		height: 3,
		zIndex: 5,
	},

	// Slide indicator dots
	dotsContainer: {
		position: 'absolute',
		bottom: spacing.sm,
		right: spacing.lg,
		zIndex: 5,
		flexDirection: 'row',
		gap: spacing.xs,
	},
	dot: {
		width: 6,
		height: 6,
		borderRadius: borderRadius.full,
	},
});

/**
 * Theme-aware hero carousel styles
 */
export const getThemedStyles = (_colors: ThemeColors) => StyleSheet.create({
	title: {
		color: '#ffffff',
	},
	subtitle: {
		color: 'rgba(255, 255, 255, 0.85)',
	},
	dotActive: {
		backgroundColor: 'rgba(255, 255, 255, 0.9)',
	},
	dotInactive: {
		backgroundColor: 'rgba(255, 255, 255, 0.35)',
	},
});
