/**
 * Design Tokens
 * 
 * Core design system values used throughout the app.
 * Separated into its own file to avoid circular dependencies.
 */

import { TextStyle } from 'react-native';

/**
 * Spacing scale - consistent spacing throughout the app
 */
export const spacing = {
	xxs: 2,
	xs: 4,
	sm: 8,
	md: 16,
	lg: 24,
	xl: 32,
	'2xl': 48,
	'3xl': 64,
};

/**
 * Border radius scale
 */
export const borderRadius = {
	sm: 4,
	md: 8,
	lg: 12,
	xl: 16,
	'2xl': 24,
	full: 9999,
};

/**
 * Typography scale
 * 
 * IMPORTANT: lineHeight values are MULTIPLIERS, not pixel values.
 * To use them correctly, multiply by fontSize:
 * 
 * @example
 * // Correct usage:
 * {
 *   fontSize: typography.fontSize.base,
 *   lineHeight: typography.fontSize.base * typography.lineHeight.normal
 * }
 * 
 * // Incorrect usage (will be interpreted as pixels):
 * {
 *   fontSize: typography.fontSize.base,
 *   lineHeight: typography.lineHeight.normal  // ❌ This becomes 1.5px!
 * }
 */
export const typography = {
	fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
	fontSize: {
		xxs: 10,
		xs: 12,
		sm: 14,
		md: 16,
		base: 16,
		lg: 18,
		xl: 20,
		'2xl': 24,
		'3xl': 30,
		'4xl': 36,
	},
	fontWeight: {
		normal: '400' as TextStyle['fontWeight'],
		medium: '500' as TextStyle['fontWeight'],
		semibold: '600' as TextStyle['fontWeight'],
		bold: '700' as TextStyle['fontWeight'],
	},
	lineHeight: {
		tight: 1.25,
		normal: 1.5,
		relaxed: 1.75,
	},
};

/**
 * Shadow styles with proper elevation
 */
export const shadows = {
	none: {
		boxShadow: 'none',
		elevation: 0,
	},
	sm: {
		boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
		elevation: 1,
	},
	md: {
		boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
		elevation: 3,
	},
	lg: {
		boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
		elevation: 5,
	},
	xl: {
		boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.15)',
		elevation: 8,
	},
};
