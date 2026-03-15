/**
 * Pace Chart Styles
 */

import { StyleSheet } from 'react-native';
import { spacing, typography } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Create styles for PaceChart component
 */
export const createStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
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
		minHeight: 180,
		width: '100%',
	},
	noDataContainer: {
		padding: spacing.xl,
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 200,
	},
	noDataText: {
		fontSize: typography.fontSize.base,
		color: colors.textSecondary,
		textAlign: 'center',
	},
	legendContainer: {
		flexDirection: 'row',
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
		width: 16,
		height: 16,
		borderRadius: 4,
	},
	legendText: {
		fontSize: typography.fontSize.sm,
		color: colors.textSecondary,
	},
});
