/**
 * LoadingSpinner Component Styles
 * 
 * Theme-aware styles for loading spinner component
 * Uses design tokens from theme for consistent styling
 */

import { StyleSheet } from 'react-native';
import type { ThemeColors } from '../../../theme';

/**
 * Base spinner structure (theme-independent)
 */
export const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

/**
 * Theme-aware styles for LoadingSpinner
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	container: {
		backgroundColor: colors.background,
	},
});
