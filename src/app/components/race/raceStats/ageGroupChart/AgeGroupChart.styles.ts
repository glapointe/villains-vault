import { StyleSheet } from 'react-native';
import { spacing, typography } from '../../../../theme';
import type { ThemeColors } from '../../../../theme';

// Base styles - structure, spacing, typography (NO colors)
export const createStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
	container: {
		padding: spacing.md,
	},
	title: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.bold,
		marginBottom: spacing.md,
		color: colors.textPrimary,
	},
	chartContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
		maxHeight: 800,
	},
	noDataContainer: {
		padding: spacing.xl,
		alignItems: 'center',
		justifyContent: 'center',
	},
	noDataText: {
		fontSize: typography.fontSize.base,
		color: colors.textSecondary,
	},
	legendContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: spacing.lg,
		marginTop: spacing.md,
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
