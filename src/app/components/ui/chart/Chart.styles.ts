/**
 * Chart Component Styles
 *
 * Theme-aware styles shared between Chart.web and Chart.native.
 */

import { StyleSheet } from 'react-native';
import { spacing, typography } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Create styles for the Chart component
 */
export const createStyles = (colors: ThemeColors, _isDark: boolean) =>
	StyleSheet.create({
		container: {
			gap: spacing.md,
		},
		title: {
			fontSize: typography.fontSize.lg,
			fontWeight: typography.fontWeight.semibold,
			color: colors.textPrimary,
		},
		chartContainer: {
			alignItems: 'center',
			justifyContent: 'center',
			width: '100%',
		},
		noDataContainer: {
			padding: spacing.xl,
			alignItems: 'center',
			justifyContent: 'center',
			minHeight: 160,
		},
		noDataText: {
			fontSize: typography.fontSize.base,
			color: colors.textSecondary,
			textAlign: 'center',
		},
		legendContainer: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			justifyContent: 'center',
			gap: spacing.lg,
			marginTop: spacing.xs,
		},
		legendItem: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: spacing.xs,
		},
		legendColor: {
			width: 14,
			height: 14,
			borderRadius: 3,
		},
		legendText: {
			fontSize: typography.fontSize.sm,
			color: colors.textSecondary,
		},
	});
