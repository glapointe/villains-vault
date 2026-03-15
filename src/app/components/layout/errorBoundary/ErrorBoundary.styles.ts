/**
 * ErrorBoundary Component Styles
 * 
 * Styles for the error boundary fallback UI.
 */

import { StyleSheet, Platform } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base styles - structure, spacing, typography (NO colors)
 */
export const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: spacing.lg,
	},
	card: {
		width: '100%',
		maxWidth: 500,
		padding: spacing.xl,
	},
	icon: {
		fontSize: 64,
		textAlign: 'center',
		marginBottom: spacing.lg,
	},
	title: {
		fontSize: typography.fontSize['2xl'],
		fontWeight: typography.fontWeight.bold,
		textAlign: 'center',
		marginBottom: spacing.md,
	},
	message: {
		fontSize: typography.fontSize.base,
		textAlign: 'center',
		marginBottom: spacing.lg,
		lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
	},
	stackTrace: {
		marginTop: spacing.md,
		marginBottom: spacing.lg,
		padding: spacing.md,
		borderRadius: borderRadius.md,
		maxHeight: 300,
	},
	stackTraceTitle: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.bold,
		marginBottom: spacing.xs,
		marginTop: spacing.sm,
	},
	stackTraceText: {
		fontSize: typography.fontSize.xs,
		fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
	},
	buttonContainer: {
		gap: spacing.sm,
		marginTop: spacing.md,
	},
});

/**
 * Theme-aware styles - colors only
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	container: {
		backgroundColor: colors.background,
	},
	title: {
		color: colors.textPrimary,
	},
	message: {
		color: colors.textSecondary,
	},
	stackTrace: {
		backgroundColor: colors.surfaceElevated,
		borderColor: colors.border,
		borderWidth: 1,
	},
	stackTraceTitle: {
		color: colors.textPrimary,
	},
	stackTraceText: {
		color: colors.textSecondary,
	},
});
