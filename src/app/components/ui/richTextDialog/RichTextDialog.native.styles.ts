/**
 * Rich Text Dialog Component Styles (Native)
 * 
 * Theme-aware styles for native rich text dialog component
 * Uses design tokens from theme for consistent styling
 */

import { StyleSheet } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base rich text dialog structure (theme-independent)
 */
export const styles = StyleSheet.create({
	editorContainer: {
		maxHeight: 400,
	},
	toolbar: {
		borderWidth: 1,
		borderRadius: borderRadius.md,
		marginBottom: spacing.xs,
		minHeight: 40,
	},
	editor: {
		minHeight: 150,
		maxHeight: 250,
		borderWidth: 1,
		borderRadius: borderRadius.md,
		fontSize: typography.fontSize.sm,
	},
	footer: {
		marginTop: spacing.xs,
		alignItems: 'flex-end',
	},
	charCount: {
		fontSize: typography.fontSize.xs,
	},
});

/**
 * Theme-aware styles for RichTextDialog
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	toolbar: {
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	editor: {
		borderColor: colors.border,
		backgroundColor: colors.surface,
		color: colors.textPrimary,
	},
	charCount: {
		color: colors.textSecondary,
	},
	charCountWarning: {
		color: colors.warning,
	},
});
