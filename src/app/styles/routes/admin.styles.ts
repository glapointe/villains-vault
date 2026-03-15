/**
 * Admin Route Styles
 * 
 * Theme-aware styles for admin page
 * Uses design tokens from theme for consistent styling
 */

import { StyleSheet } from 'react-native';
import { layout, text, components } from '../../theme/commonStyles';
import { spacing } from '../../theme';
import type { ThemeColors } from '../../theme';

/**
 * Base admin page structure (theme-independent)
 */
export const styles = StyleSheet.create({
	container: {
		...layout.container,
		backgroundColor: 'transparent',
	},
	content: layout.content,
	headerCard: {
		marginBottom: spacing.md,
	},
	title: text.pageTitle,
	subtitle: {
		...text.small,
		marginBottom: spacing.md,
	},
	featureCard: {
		...components.card,
		marginBottom: spacing.sm,
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: '0%',
		minWidth: 250,
	},
	featureCardsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.md,
		alignItems: 'stretch',
		paddingBottom: spacing.lg,
	},
	actionButton: {
		marginTop: spacing.sm,
	},
});

/**
 * Theme-aware styles for admin page
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	subtitle: {
		color: colors.textSecondary,
	},
});
