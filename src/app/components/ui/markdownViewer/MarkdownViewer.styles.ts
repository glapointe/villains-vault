/**
 * MarkdownViewer Component Styles
 * 
 * Platform-aware markdown styles for web and native
 */

import { StyleSheet } from 'react-native';
import { typography, spacing } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Get themed markdown styles for web (component-based format for react-markdown)
 */
export const getWebMarkdownStyles = (colors: ThemeColors) => ({
	wrapper: {
		fontSize: typography.fontSize.base,
		lineHeight: `${typography.fontSize.base * typography.lineHeight.relaxed}px`,
		color: colors.textPrimary,
		fontFamily: typography.fontFamily,
	},
	h1: {
		fontSize: typography.fontSize['3xl'],
		lineHeight: `${typography.fontSize['3xl'] * typography.lineHeight.tight}px`,
		fontWeight: typography.fontWeight.bold,
		color: colors.textPrimary,
		marginTop: spacing.xl,
		marginBottom: spacing.md,
	},
	h2: {
		fontSize: typography.fontSize.xl,
		lineHeight: `${typography.fontSize.xl * typography.lineHeight.tight}px`,
		fontWeight: typography.fontWeight.bold,
		color: colors.textPrimary,
		marginTop: spacing.lg,
		marginBottom: spacing.sm,
	},
	h3: {
		fontSize: typography.fontSize.lg,
		lineHeight: `${typography.fontSize.lg * typography.lineHeight.normal}px`,
		fontWeight: typography.fontWeight.semibold,
		color: colors.textPrimary,
		marginTop: spacing.md,
		marginBottom: spacing.sm,
	},
	p: {
		marginBottom: spacing.md,
		color: colors.textPrimary,
	},
	ul: {
		marginBottom: spacing.md,
		paddingLeft: spacing.xl,
	},
	ol: {
		marginBottom: spacing.md,
		paddingLeft: spacing.xl,
	},
	li: {
		marginBottom: spacing.xs,
		color: colors.textPrimary,
	},
	a: {
		color: colors.primary,
		textDecoration: 'none',
	},
	linkWrapper: {
		display: 'inline-flex',
		alignItems: 'baseline',
		gap: spacing.xs,
	},
	strong: {
		fontWeight: typography.fontWeight.bold,
		color: colors.textPrimary,
	},
	code: {
		backgroundColor: colors.surfaceElevated,
		padding: `${spacing.xs}px ${spacing.sm}px`,
		borderRadius: 4,
		fontSize: typography.fontSize.sm,
		fontFamily: 'monospace',
	},
	pre: {
		backgroundColor: colors.surfaceElevated,
		padding: spacing.md,
		borderRadius: 8,
		overflow: 'auto',
		marginBottom: spacing.md,
	},
	tableScrollWrapper: {
		overflowX: 'auto',
		WebkitOverflowScrolling: 'touch',
		marginBottom: spacing.md,
	},
	table: {
		borderCollapse: 'collapse',
		width: '100%',
		minWidth: 250,
		marginBottom: spacing.md,
		borderRadius: 6,
		overflow: 'hidden',
		border: `1px solid ${colors.tableBorder}`,
		backgroundColor: colors.tableBorder,
	},
	thead: {
		backgroundColor: colors.tableHeaderBackground,
	},
	th: {
		padding: `${spacing.sm}px ${spacing.md}px`,
		textAlign: 'left' as const,
		fontWeight: typography.fontWeight.semibold,
		color: colors.textPrimary,
		borderBottom: `2px solid ${colors.tableBorder}`,
		fontSize: typography.fontSize.sm,
		backgroundColor: colors.tableHeaderBackground,
	},
	td: {
		padding: `${spacing.sm}px ${spacing.md}px`,
		color: colors.textPrimary,
		borderBottom: `1px solid ${colors.tableBorder}`,
		fontSize: typography.fontSize.sm,
	},
	trEven: {
		backgroundColor: colors.tableRowEvenBackground,
	},
	trOdd: {
		backgroundColor: colors.tableRowOddBackground,
	},
});

/**
 * Get themed markdown styles for native (react-native-markdown-display format)
 */
export const getNativeMarkdownStyles = (colors: ThemeColors) => StyleSheet.create({
	body: {
		color: colors.textPrimary,
		fontSize: typography.fontSize.base,
		lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
		flexShrink: 1,
	},
	heading1: {
		fontSize: typography.fontSize['3xl'],
		lineHeight: typography.fontSize['3xl'] * typography.lineHeight.tight,
		fontWeight: typography.fontWeight.bold,
		color: colors.textPrimary,
		marginTop: spacing.xl,
		marginBottom: spacing.md,
	},
	heading2: {
		fontSize: typography.fontSize.xl,
		lineHeight: typography.fontSize.xl * typography.lineHeight.tight,
		fontWeight: typography.fontWeight.bold,
		color: colors.textPrimary,
		marginTop: spacing.lg,
		marginBottom: spacing.sm,
	},
	heading3: {
		fontSize: typography.fontSize.lg,
		lineHeight: typography.fontSize.lg * typography.lineHeight.normal,
		fontWeight: typography.fontWeight.semibold,
		color: colors.textPrimary,
		marginTop: spacing.md,
		marginBottom: spacing.sm,
	},
	paragraph: {
		marginBottom: spacing.md,
		color: colors.textPrimary,
	},
	listItem: {
		marginBottom: spacing.xs,
		color: colors.textPrimary,
	},
	link: {
		color: colors.primary,
	},
	linkWrapper: {
		flexDirection: 'row',
		alignItems: 'baseline',
		gap: spacing.xs,
		flexWrap: 'wrap',
	},
	strong: {
		fontWeight: typography.fontWeight.bold,
	},
	code_inline: {
		backgroundColor: colors.surfaceElevated,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
		borderRadius: 4,
		fontSize: typography.fontSize.sm,
		fontFamily: 'monospace',
	},
	code_block: {
		backgroundColor: colors.surfaceElevated,
		padding: spacing.md,
		borderRadius: 8,
		marginBottom: spacing.md,
	},
	fence: {
		backgroundColor: colors.surfaceElevated,
		padding: spacing.md,
		borderRadius: 8,
		marginBottom: spacing.md,
	},
	table: {
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 6,
		marginBottom: spacing.md,
	},
	thead: {
		backgroundColor: colors.surfaceMuted,
	},
	th: {
		flex: 1,
		padding: spacing.sm,
		fontWeight: typography.fontWeight.semibold,
		color: colors.textPrimary,
		fontSize: typography.fontSize.sm,
		borderBottomWidth: 2,
		borderColor: colors.border,
	},
	td: {
		flex: 1,
		padding: spacing.sm,
		color: colors.textPrimary,
		fontSize: typography.fontSize.sm,
		borderBottomWidth: 1,
		borderColor: colors.borderLight,
	},
	tr: {
		flexDirection: 'row',
	},
});
