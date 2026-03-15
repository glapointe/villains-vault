import { StyleSheet, Platform } from 'react-native';
import { spacing } from '../../../theme';
import type { ThemeColors } from '../../../theme';

// Base styles - structure, spacing, typography (NO colors)
export const createStyles = (colors: ThemeColors, isDark: boolean, windowWidth: number = 1024) => {
	// Compute responsive minWidth based on window width (media query-like behavior)
	// Below 800px: use calc(100% - gap) for single column
	// Above 800px: use calc(33% - gap) for three columns
	const chartMinWidth = windowWidth < 800 ? '100%' : 'calc(33% - 8px)';
	
	return StyleSheet.create({
	container: {
		gap: spacing.lg,
	},
	chartCard: {
		marginBottom: spacing.md,
	},
    splitsCard: {
        padding: spacing.md,
    },
	splitsAndPaceContainer: {
		...Platform.select({
			web: {
				flexDirection: 'row' as const,
				gap: spacing["2xl"],
				alignItems: 'flex-start',
                flexWrap: 'wrap' as const,
			},
			default: {
				gap: spacing["2xl"],
			},
		}),
	},
	splitsColumn: {
		...Platform.select({
			web: {
				flex: 1,
                minWidth: 250,
			},
			default: {},
		}),
	},
	paceChartColumn: {
		...Platform.select({
			web: {
				flex: 1,
                minWidth: 250,
                padding: 0,
			},
			default: {},
		}),
	},
	ageGroupChartsContainer: {
		...Platform.select({
			web: {
				flexDirection: 'row' as const,
				flexWrap: 'wrap' as const,
				gap: spacing.md,
				marginTop: spacing.md,
				justifyContent: 'center' as const,
			},
			default: {
				gap: spacing.md,
				marginTop: spacing.md,
			},
		}),
	},
	ageGroupChartCard: {
		...Platform.select({
			web: {
				flexGrow: 1,
				flexShrink: 1,
				flexBasis: 0,
				minWidth: chartMinWidth as any, // Responsive: 100% below 800px, 50% above
				maxWidth: 800, // Prevent charts from growing too large
				marginBottom: 0,
				boxSizing: 'border-box' as any,
			},
			default: {
				marginBottom: spacing.md,
			},
		}),
        padding: spacing.xs,
	},
});
};
