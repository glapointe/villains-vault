/**
 * User Management Route Styles
 * 
 * Theme-aware styles for user management admin page
 * Uses design tokens from theme for consistent styling
 */

import { StyleSheet } from 'react-native';
import { layout } from '../../theme/commonStyles';
import { spacing } from 'theme';
import type { ThemeColors } from '../../theme';

/**
 * Base user management page structure (theme-independent)
 */
export const styles = StyleSheet.create({
	container: {
		...layout.container,
		backgroundColor: 'transparent',
	},
	contentContainer: {
		flexGrow: 1,
		paddingHorizontal: spacing.md,
	},
	content: {
		...layout.wideContent,
		flex: 1,
		paddingHorizontal: spacing.sm,
		paddingTop: spacing.md,
	},
});

/**
 * Theme-dependent dashboard styles
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	container: {
		backgroundColor: 'transparent',
	},
    content: {
        backgroundColor: colors.background,
    },
});
