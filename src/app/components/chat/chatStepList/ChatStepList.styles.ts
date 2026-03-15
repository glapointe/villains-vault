/**
 * ChatStepList Component Styles
 *
 * Styles for the collapsible "thinking" tool-call steps shown in assistant messages.
 * Mimics VS Code's chat tool-call disclosure appearance.
 */

import { StyleSheet, Platform } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base structure styles (theme-independent)
 */
export const styles = StyleSheet.create({
	container: {
		marginBottom: spacing.sm,
	},
	toggleButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
		paddingVertical: spacing.xs,
		paddingHorizontal: spacing.sm,
		borderRadius: borderRadius.sm,
		...Platform.select({
			web: { cursor: 'pointer' } as any,
			default: {},
		}),
	},
	toggleIcon: {
		fontSize: typography.fontSize.xs,
		fontWeight: typography.fontWeight.bold,
	},
	toggleText: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.medium,
	},
	stepsList: {
		marginTop: spacing.xs,
		paddingLeft: spacing.md,
		gap: spacing.xs,
	},
	stepItem: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: spacing.sm,
		paddingVertical: spacing.xs,
		paddingHorizontal: spacing.sm,
		borderRadius: borderRadius.sm,
		borderLeftWidth: 2,
	},
	stepIcon: {
		fontSize: typography.fontSize.sm,
		width: 18,
		textAlign: 'center',
	},
	stepContent: {
		flex: 1,
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	stepToolName: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.semibold,
		lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
	},
	stepResult: {
		fontSize: typography.fontSize.xs,
		lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
		marginTop: 2,
	},
	stepResultTruncated: {
		maxHeight: 60,
		overflow: 'hidden',
	},
	spinner: {
		marginLeft: 2,
	},
});

/**
 * Theme-aware styles
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	toggleButton: {
		backgroundColor: colors.surfaceElevated,
	},
	toggleIcon: {
		color: colors.textTertiary,
	},
	toggleText: {
		color: colors.textSecondary,
	},
	stepItem: {
		backgroundColor: colors.surfaceElevated,
		borderLeftColor: colors.primary,
	},
	stepItemComplete: {
		borderLeftColor: colors.success,
	},
	stepToolName: {
		color: colors.textPrimary,
	},
	stepResult: {
		color: colors.textTertiary,
	},
});
