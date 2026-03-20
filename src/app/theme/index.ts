/**
 * Theme Configuration
 * 
 * Centralized design tokens for consistent styling across the app.
 * Provides comprehensive color palettes, spacing, typography, and utilities
 * for both light and dark mode support.
 */

import { StyleSheet, TextStyle, ViewStyle, ImageStyle } from 'react-native';
import { spacing, typography, borderRadius, shadows } from './tokens';

// Re-export design tokens for convenience
export { spacing, typography, borderRadius, shadows };

/**
 * Base color palette - foundation colors that don't change between themes
 */
export const palette = {
	villains: {
		green: '#9bc94a',
		purple: '#593979',
	},
	// Primary colors (Blue)
	primary: {
		50: '#eff6ff',
		100: '#dbeafe',
		200: '#bfdbfe',
		300: '#93c5fd',
		400: '#60a5fa',
		500: '#3b82f6',
		600: '#2563eb',
		700: '#1d4ed8',
		800: '#1e40af',
		900: '#1e3a8a',
	},
	// Secondary/Purple (for admin features)
	secondary: {
		50: '#faf5ff',
		100: '#f3e8ff',
		200: '#e9d5ff',
		300: '#d8b4fe',
		400: '#c084fc',
		500: '#a855f7',
		600: '#9333ea',
		700: '#7e22ce',
		800: '#6b21a8',
		900: '#581c87',
	},
	// Neutral grays
	gray: {
		0: '#ffffff',
		50: '#f9fafb',
		100: '#f3f4f6',
		200: '#e5e7eb',
		300: '#d1d5db',
		400: '#9ca3af',
		500: '#6b7280',
		600: '#4b5563',
		700: '#374151',
		800: '#1f2937',
		900: '#111827',
	},
	// Semantic state colors
	success: {
		light: '#10b981',
		dark: '#34d399',
	},
	warning: {
		light: '#f59e0b',
		dark: '#fbbf24',
	},
	error: {
		light: '#ef4444',
		dark: '#f87171',
	},
	info: {
		light: '#3b82f6',
		dark: '#60a5fa',
	},
};

/**
 * Semantic colors for light mode
 */
export const lightColors = {
	// Surface colors
	background: palette.gray[0],
	surface: palette.gray[50],
	surfaceElevated: palette.gray[100],
	surfaceMuted: palette.gray[200],
	overlay: 'rgba(0, 0, 0, 0.4)',
    rowHighlightOverlay: 'rgba(0, 0, 0, 0.4)',
	
	// Text colors
	textPrimary: palette.gray[900],
	textSecondary: palette.gray[600],
	textTertiary: palette.gray[500],
	textDisabled: palette.gray[400],
	textInverse: '#ffffff',
	textVillainsPrimary: palette.villains.purple,
	textVillainsSecondary: palette.villains.green,
	
	// Border colors
	border: palette.gray[200],
	borderLight: palette.gray[100],
	borderFocus: palette.primary[500],

	// Table colors
	tableBorder: palette.gray[400],
	tableHeaderBackground: palette.gray[300],
	tableRowEvenBackground: palette.gray[200],
	tableRowOddBackground: palette.gray[100],
	
	// Brand colors
	primary: palette.primary[600],
	primaryHover: palette.primary[700],
	primaryActive: palette.primary[800],
	primarySubtle: palette.primary[50],
	
	secondary: palette.secondary[600],
	secondaryHover: palette.secondary[700],
	secondaryActive: palette.secondary[800],
	secondarySubtle: palette.secondary[50],
	
	// Semantic colors
	success: palette.success.light,
	successSubtle: '#d1fae5',
	warning: palette.warning.light,
	warningSubtle: '#fef3c7',
	error: palette.error.light,
	errorSubtle: '#fee2e2',
	info: palette.info.light,
	infoSubtle: '#dbeafe',
	
	// Component-specific
	buttonPrimary: palette.primary[600],
	buttonSecondary: palette.gray[200],
	buttonGhost: palette.gray[100],
	buttonDanger: palette.error.light,
};

/**
 * Semantic colors for dark mode
 */
export const darkColors = {
	// Surface colors
	background: palette.gray[900],
	surface: palette.gray[800],
	surfaceElevated: palette.gray[700],
	surfaceMuted: palette.gray[600],
	overlay: 'rgba(0, 0, 0, 0.6)',
	rowHighlightOverlay: 'rgba(255, 255, 255, 0.4)',

	// Text colors
	textPrimary: palette.gray[50],
	textSecondary: palette.gray[400],
	textTertiary: palette.gray[500],
	textDisabled: palette.gray[600],
	textInverse: palette.gray[900],
	textVillainsPrimary: palette.villains.green,
	textVillainsSecondary: palette.villains.purple,
	
	// Border colors
	border: palette.gray[700],
	borderLight: palette.gray[800],
	borderFocus: palette.primary[400],

	// Table colors
	tableBorder: palette.gray[900],
	tableHeaderBackground: palette.gray[800],
	tableRowEvenBackground: palette.gray[600],
	tableRowOddBackground: palette.gray[700],

	// Brand colors
	primary: palette.primary[400],
	primaryHover: palette.primary[300],
	primaryActive: palette.primary[200],
	primarySubtle: palette.primary[900],
	
	secondary: palette.secondary[400],
	secondaryHover: palette.secondary[300],
	secondaryActive: palette.secondary[200],
	secondarySubtle: palette.secondary[900],
	
	// Semantic colors
	success: palette.success.dark,
	successSubtle: '#065f46',
	warning: palette.warning.dark,
	warningSubtle: '#78350f',
	error: palette.error.dark,
	errorSubtle: '#7f1d1d',
	info: palette.info.dark,
	infoSubtle: '#1e3a8a',
	
	// Component-specific
	buttonPrimary: palette.primary[500],
	buttonSecondary: palette.gray[600],
	buttonGhost: palette.gray[800],
	buttonDanger: palette.error.dark,
};

/**
 * Default to light colors for backwards compatibility
 */
export const colors = lightColors;

/**
 * Type definitions for theme-aware styling
 */
export type ThemeColors = typeof lightColors;
export type StyleCreator<T> = (colors: ThemeColors, isDark: boolean) => T;

/**
 * Get the appropriate color palette based on theme mode
 */
export function getThemedColors(isDark: boolean): ThemeColors {
	return isDark ? darkColors : lightColors;
}

/**
 * Create theme-aware styles using a factory function
 * Usage: const styles = createThemedStyles(isDark, (colors) => StyleSheet.create({ ... }))
 */
export function createThemedStyles<T>(
	isDark: boolean,
	styleFactory: (colors: ThemeColors) => T
): T {
	return styleFactory(getThemedColors(isDark));
}

// Re-export common styles
export * from './commonStyles';
