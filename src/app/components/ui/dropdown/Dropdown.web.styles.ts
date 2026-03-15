/**
 * Dropdown Component Styles - Web
 *
 * CSS-in-JS styles for web dropdown component
 * Separated into structure (base) and colors (themed)
 */

import type { ThemeColors } from '../../../theme';

/**
 * Base dropdown styles (structure, no colors)
 */
export const baseStyles = {
	select: {
		width: '100%',
		padding: '12px',
		borderRadius: '8px',
		fontSize: '14px',
		fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
		outline: 'none',
		appearance: 'none',
		backgroundRepeat: 'no-repeat',
		backgroundPosition: 'right 12px center',
		backgroundSize: '16px',
		paddingRight: '40px',
		cursor: 'pointer',
	} as const,
	selectDisabled: {
		cursor: 'not-allowed',
	} as const,
};

/**
 * Theme-aware styles for dropdown
 */
export const getThemedStyles = (colors: ThemeColors) => ({
	select: {
		border: `1px solid ${colors.border}`,
		backgroundColor: colors.background,
		color: colors.textPrimary,
		backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(colors.textPrimary)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
	},
	selectDisabled: {
		opacity: 0.6,
	},
});
