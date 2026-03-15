/**
 * Chart Component – Native
 *
 * Generic line / bar chart built on victory-native for iOS & Android.
 * Supports multiple named series, an optional title, axis labels,
 * configurable height, and automatic theming (light / dark).
 */

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { CartesianChart, Line, Bar, BarGroup, Scatter } from 'victory-native';
import { useFont } from '@shopify/react-native-skia';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { getSeriesChartPalette } from '../../../theme/chartTheme';
import { createStyles } from './Chart.styles';
import type { ChartProps } from './Chart.types';
import segoeui from '../../../assets/fonts/SEGOEUI.TTF';

/**
 * Generic Chart (Native)
 *
 * Renders a line or bar chart supporting one or more data series.
 */
export const Chart: React.FC<ChartProps> = ({
	type,
	title,
	series,
	xAxisLabel: _xAxisLabel,
	yAxisLabel: _yAxisLabel,
	height = 260,
	width = 520,
	formatYLabel,
}) => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
	const palette = useMemo(() => getSeriesChartPalette(isDark), [isDark]);
	const font = useFont(segoeui, 10);

	const hasData = series.length > 0 && series.some(s => s.data.length > 0);

	// Build flat CartesianChart data using indices as x; original labels used for formatting
	const { flatData, yKeys, xLabels } = useMemo(() => {
		if (!hasData) return { flatData: [], yKeys: [], xLabels: [] };

		// Use the first series with data as the canonical x-label list
		const canonical = series.find(s => s.data.length > 0)!;
		const labels = canonical.data.map(d => String(d.x));

		const keys = series.map((_, i) => `series${i}`);

		const data = canonical.data.map((_, idx) => {
			const point: Record<string, number> = { x: idx };
			series.forEach((s, si) => {
				point[`series${si}`] = s.data[idx]?.y ?? 0;
			});
			return point;
		});

		return { flatData: data, yKeys: keys, xLabels: labels };
	}, [series, hasData]);

	if (!hasData) {
		return (
			<View style={styles.container}>
				{title && <Text style={styles.title}>{title}</Text>}
				<View style={styles.noDataContainer}>
					<Text style={styles.noDataText}>No data available</Text>
				</View>
			</View>
		);
	}

	const seriesColors = series.map((s, i) => s.color ?? palette[i % palette.length]);

	const axisOptions = font
		? {
			font,
			labelColor: colors.textPrimary,
			lineColor: colors.border,
			tickCount: Math.min(xLabels.length, 8),
			formatXLabel: (value: number) => xLabels[value] ?? String(value),
			...(formatYLabel && { formatYLabel }),
		}
		: undefined;

	return (
		<View style={styles.container}>
			{title && <Text style={styles.title}>{title}</Text>}

			<View style={[styles.chartContainer, { height, width: width === '100%' ? '100%' : width }]}>
				{/* Inner flex wrapper gives CartesianChart a concrete measured size */}
				<View style={{ flex: 1, width: '100%' }}>
				{type === 'line' ? (
					// --- LINE CHART ---
					<CartesianChart
						data={flatData as any}
						xKey="x"
						yKeys={yKeys as any}
						domainPadding={{ left: 20, right: 20, top: 20, bottom: 0 }}
						axisOptions={axisOptions as any}
					>
						{({ points }: any) =>
							series.map((s, i) => (
								<React.Fragment key={s.name}>
									<Line
										points={(points as any)[`series${i}`]}
										color={seriesColors[i]}
										strokeWidth={2}
									/>
									<Scatter
										points={(points as any)[`series${i}`]}
										color={seriesColors[i]}
										radius={4}
									/>
								</React.Fragment>
							))
						}
					</CartesianChart>
				) : (
					// --- BAR CHART ---
					<CartesianChart
						data={flatData as any}
						xKey="x"
						yKeys={yKeys as any}
						domainPadding={{ left: 30, right: 30, top: 20, bottom: 0 }}
						axisOptions={axisOptions as any}
					>
						{({ points, chartBounds }: any) => {
							if (series.length === 1) {
								return (
									<Bar
										points={(points as any).series0}
										chartBounds={chartBounds}
										color={seriesColors[0]}
									/>
								);
							}
							const BarGroupComponent = BarGroup as any;
							return (
								<BarGroupComponent
									chartBounds={chartBounds}
									betweenGroupPadding={0.3}
									withinGroupPadding={0.1}
								>
									{series.map((s, i) => (
										<BarGroup.Bar
											key={s.name}
											points={(points as any)[`series${i}`]}
											color={seriesColors[i]}
										/>
									))}
								</BarGroupComponent>
							);
						}}
					</CartesianChart>
				)}
				</View>
			</View>

			{/* Legend (shown when there is more than one series) */}
			{series.length > 1 && (
				<View style={styles.legendContainer}>
					{series.map((s, i) => (
						<View key={s.name} style={styles.legendItem}>
							<View style={[styles.legendColor, { backgroundColor: seriesColors[i] }]} />
							<Text style={styles.legendText}>{s.name}</Text>
						</View>
					))}
				</View>
			)}
		</View>
	);
};
