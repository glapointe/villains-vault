/**
 * Tooltip Component Styles
 * 
 * Theme-aware tooltip styles with smart positioning and arrow support
 * Uses design tokens from theme for consistent styling
 */

import { StyleSheet, Platform } from 'react-native';
import { borderRadius, spacing, shadows, typography } from '../../../theme';
import type { ThemeColors } from '../../../theme';

export const ARROW_SIZE = 16;

/**
 * Base tooltip structure (theme-independent)
 */
export const styles = StyleSheet.create({
	// Trigger element should not affect layout
	triggerPressable: {
		// Keep inline with content
	},
	
	// Modal overlay (transparent backdrop)
	modalOverlay: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	
	// Outer wrapper for tooltip and arrow (allows arrow to overflow)
	tooltipWrapper: {
		position: 'absolute',
	},
	
	// Tooltip container (inner, with overflow hidden for content)
	tooltipContainer: {
		paddingVertical: spacing.sm,
		borderRadius: borderRadius.md,
		...shadows.lg,
		overflow: 'hidden',
	},
	
	// ScrollView for content
	scrollView: {
		flexShrink: 1,
	},
	
	scrollViewContent: {
		flexGrow: 1,
	},
	
	// Content container
	contentContainer: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	
	// Default text styling
	contentText: {
		fontFamily: typography.fontFamily,
		fontSize: typography.fontSize.sm,
		lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
	},
	
	// Arrow pointer base styles
	arrow: {
		position: 'absolute',
		width: 0,
		height: 0,
		backgroundColor: 'transparent',
		borderStyle: 'solid',
	},
	
	// Arrow pointing up (for bottom placement)
	arrowTop: {
		borderLeftWidth: ARROW_SIZE,
		borderRightWidth: ARROW_SIZE,
		borderBottomWidth: ARROW_SIZE,
		borderLeftColor: 'transparent',
		borderRightColor: 'transparent',
		// borderBottomColor set in themed styles
		marginLeft: -ARROW_SIZE,
	},
	
	// Arrow pointing down (for top placement)
	arrowBottom: {
		borderLeftWidth: ARROW_SIZE,
		borderRightWidth: ARROW_SIZE,
		borderTopWidth: ARROW_SIZE,
		borderLeftColor: 'transparent',
		borderRightColor: 'transparent',
		// borderTopColor set in themed styles
		marginLeft: -ARROW_SIZE,
	},
	
	// Arrow pointing left (for right placement)
	arrowLeft: {
		borderTopWidth: ARROW_SIZE,
		borderBottomWidth: ARROW_SIZE,
		borderRightWidth: ARROW_SIZE,
		borderTopColor: 'transparent',
		borderBottomColor: 'transparent',
		// borderRightColor set in themed styles
		marginTop: -ARROW_SIZE,
	},
	
	// Arrow pointing right (for left placement)
	arrowRight: {
		borderTopWidth: ARROW_SIZE,
		borderBottomWidth: ARROW_SIZE,
		borderLeftWidth: ARROW_SIZE,
		borderTopColor: 'transparent',
		borderBottomColor: 'transparent',
		// borderLeftColor set in themed styles
		marginTop: -ARROW_SIZE,
	},
	
	// Info icon
	infoIcon: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.bold,
		paddingLeft: spacing.xs,
		marginBottom: Platform.OS !== 'web' ? -8 : 0,
	},
});

/**
 * Theme-aware tooltip styles
 * Returns appropriate colors based on theme mode
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	tooltipContainer: {
		backgroundColor: colors.surfaceMuted,
		borderColor: colors.border,
		borderWidth: 0,
	},
	
	contentText: {
		color: colors.textPrimary,
	},
	
	// Arrow colors for each placement direction
	arrowBackground: {
		backgroundColor: colors.surfaceMuted,
	},
	arrowTop: {
		borderTopColor: colors.surfaceMuted,
	},
	
	arrowBottom: {
		borderBottomColor: colors.surfaceMuted,
	},
	
	arrowLeft: {
		borderLeftColor: colors.surfaceMuted,
	},
	
	arrowRight: {
		borderRightColor: colors.surfaceMuted,
	},
	
	infoIcon: {
		color: colors.textTertiary,
	},
});