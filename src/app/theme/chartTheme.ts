/**
 * Chart Theme Configuration
 * 
 * Provides theme-aware styling for Victory charts and other chart components
 * Ensures consistent styling across all chart types in both light and dark modes
 */

import type { ThemeColors } from './index';

/**
 * Creates a custom Victory theme based on the current theme colors
 * Mirrors the Victory theme structure used in grayscale, material, and clean themes
 * 
 * @param colors - Theme colors from the app's theme context
 * @param isDark - Whether dark mode is enabled
 * @returns Victory theme object with proper structure and component definitions
 */
export const createVictoryTheme = (colors: ThemeColors, isDark: boolean) => {
	const textColor = colors.textPrimary;
	const gridColor = isDark ? colors.border : colors.borderLight;
	const backgroundColor = isDark ? colors.surface : colors.surface;
	const dataColor = colors.primary;

	// Base styles that are reused across components
	const baseLabelStyles = {
		fontFamily: "'Helvetica Neue', 'Helvetica', sans-serif",
		fontSize: 12,
		letterSpacing: 'normal',
		padding: 8,
		fill: textColor,
		stroke: 'transparent',
		strokeWidth: 0,
	};

	const centeredLabelStyles = {
		...baseLabelStyles,
		textAnchor: 'middle' as const,
	};

	const baseProps = {
		width: 350,
		height: 350,
		padding: 50,
	};

	const strokeLinecap = 'round';
	const strokeLinejoin = 'round';

	return {
		palette: {
			colors: [colors.primary, colors.secondary, colors.primaryHover, colors.secondaryHover],
		},
		area: {
			...baseProps,
			style: {
				data: {
					fill: dataColor,
					opacity: 0.5,
				},
				labels: baseLabelStyles,
			},
		},
		axis: {
			...baseProps,
			style: {
				axis: {
					fill: 'transparent',
					stroke: gridColor,
					strokeWidth: 2,
					strokeLinecap,
					strokeLinejoin,
				},
				axisLabel: {
					...centeredLabelStyles,
					padding: 8,
					stroke: 'transparent',
                    fontSize: 9
				},
				grid: {
					fill: 'none',
					stroke: gridColor,
					strokeDasharray: undefined,
					strokeLinecap,
					strokeLinejoin,
					pointerEvents: 'painted' as const,
				},
				ticks: {
					fill: 'transparent',
					size: 5,
					stroke: gridColor,
					strokeWidth: 1,
					strokeLinecap,
					strokeLinejoin,
				},
				tickLabels: {
					...baseLabelStyles,
					fill: textColor,
                    fontSize: 9
				},
			},
		},
		bar: {
			...baseProps,
			style: {
				data: {
					fill: dataColor,
					padding: 8,
					strokeWidth: 0,
				},
				labels: baseLabelStyles,
			},
		},
		line: {
			...baseProps,
			style: {
				data: {
					fill: 'none',
					opacity: 1,
					stroke: dataColor,
					strokeWidth: 2,
				},
				labels: baseLabelStyles,
			},
		},
		scatter: {
			...baseProps,
			style: {
				data: {
					fill: dataColor,
					opacity: 1,
					stroke: 'transparent',
					strokeWidth: 0,
				},
				labels: baseLabelStyles,
			},
		},
		tooltip: {
			style: {
				...baseLabelStyles,
				padding: 0,
				pointerEvents: 'none' as const,
			},
			flyoutStyle: {
				stroke: textColor,
				strokeWidth: 1,
				fill: backgroundColor,
				pointerEvents: 'none' as const,
			},
			flyoutPadding: 5,
			cornerRadius: 5,
			pointerLength: 10,
		},
		chart: baseProps,
	};
};

/**
 * Qualitative series palette for multi-series charts.
 *
 * Eight perceptually-distinct colours tuned for legibility on both
 * light and dark backgrounds.  The colours are intentionally fixed
 * (not derived from the semantic theme tokens) so they stay
 * maximally separated regardless of the current brand palette.
 *
 * Order is significant – the first colour is assigned to the first
 * series, the second to the second, and so on (wrapping if needed).
 *
 * Light values use richer/deeper tones; dark values use lighter/pastel
 * variants so they remain visible against dark surfaces.
 *
 * @param isDark - Whether dark mode is active
 * @returns Ordered array of hex colour strings
 */
export const getSeriesChartPalette = (isDark: boolean): string[] => {
	if (isDark) {
		return [
			'#60a5fa', // blue-400
			'#34d399', // emerald-400
			'#fbbf24', // amber-400
			'#f87171', // red-400
			'#c084fc', // purple-400
			'#22d3ee', // cyan-400
			'#f472b6', // pink-400
			'#a3e635', // lime-400
		];
	}
	return [
		'#2563eb', // blue-600
		'#059669', // emerald-600
		'#d97706', // amber-600
		'#dc2626', // red-600
		'#7c3aed', // violet-600
		'#0891b2', // cyan-600
		'#db2777', // pink-600
		'#65a30d', // lime-600
	];
};
