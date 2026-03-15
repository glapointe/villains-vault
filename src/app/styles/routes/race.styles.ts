/**
 * Race Dashboard Styles
 * 
 * Theme-aware styles for race dashboard page
 * Uses design tokens from theme for consistent styling
 */

import { StyleSheet } from 'react-native';
import { layout, text } from '../../theme/commonStyles';
import { spacing, typography } from '../../theme';
import type { ThemeColors } from '../../theme';

/**
 * Base race dashboard structure (theme-independent)
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
	header: {
		padding: spacing.lg,
		borderBottomWidth: 1,
	},
	headerTopRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
	},
	headerContent: {
		flex: 1,
		minWidth: 200,
	},
	headerContentRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: spacing.md,
	},
	adminToolbar: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		flexShrink: 0,
	},
    content: layout.wideContent,
	eventName: {
		...text.small,
		fontWeight: typography.fontWeight.medium,
		marginBottom: spacing.xs,
	},
	raceTitleRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: spacing.md,
		marginBottom: spacing.xs,
	},
	raceTitle: {
		fontSize: typography.fontSize['2xl'],
		fontWeight: typography.fontWeight.bold,
	},
	raceDate: {
		...text.body,
		fontSize: typography.fontSize.base,
	},
	promptContainer: {
		paddingHorizontal: spacing.md,
	},
	statsContainer: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.lg,
	},
	gridContainer: {
		flex: 1,
		minHeight: 500,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.lg,
	},
	loadingContainer: layout.centeredContainer,
	errorContainer: {
		flex: 1,
		padding: spacing.md,
	},
});

/**
 * Theme-aware styles for race dashboard
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	container: {
		backgroundColor: 'transparent',
	},
    content: {
        backgroundColor: colors.background,
    },
	header: {
		backgroundColor: colors.background,
		borderBottomColor: colors.border,
	},
	eventName: {
		color: colors.textSecondary,
	},
	raceTitle: {
		color: colors.textPrimary,
	},
	raceDate: {
		color: colors.textSecondary,
	},
});
