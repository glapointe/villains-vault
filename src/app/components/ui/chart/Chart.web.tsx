/**
 * Chart Component – Web
 *
 * Generic line / bar chart built on Victory for web.
 * Supports multiple named series, an optional title, axis labels,
 * configurable height, and automatic theming (light / dark).
 */

import React, { useMemo, useState } from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import {
	VictoryChart,
	VictoryBar,
	VictoryLine,
	VictoryAxis,
	VictoryGroup,
	VictoryLegend,
	VictoryContainer,
	VictoryScatter,
	VictoryTooltip,
} from 'victory';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { createVictoryTheme, getSeriesChartPalette } from '../../../theme/chartTheme';
import { createStyles } from './Chart.styles';
import type { ChartProps } from './Chart.types';

/**
 * Generic Chart (Web)
 *
 * Renders a line or bar chart supporting one or more data series.
 */
const DEFAULT_WIDTH = 520;

export const Chart: React.FC<ChartProps> = ({
	type,
	title,
	series,
	xAxisLabel,
	yAxisLabel,
	height = 260,
	width = DEFAULT_WIDTH,
	formatYLabel,
}) => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
	const victoryTheme = useMemo(() => createVictoryTheme(colors, isDark), [colors, isDark]);
	const palette = useMemo(() => getSeriesChartPalette(isDark), [isDark]);

	// For fluid (100%) width mode we measure the container via onLayout
	const [measuredWidth, setMeasuredWidth] = useState<number>(DEFAULT_WIDTH);
	const isFluid = width === '100%';
	const chartWidth: number = isFluid ? measuredWidth : (width as number);

	const handleLayout = (e: LayoutChangeEvent) => {
		if (isFluid) setMeasuredWidth(e.nativeEvent.layout.width);
	};

	const hasData = series.length > 0 && series.some(s => s.data.length > 0);

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

	// Legend entries (only shown when there is more than one series)
	const legendData = series.map((s, i) => ({
		name: s.name,
		symbol: {
			fill: s.color ?? palette[i % palette.length],
			type: type === 'bar' ? ('square' as const) : ('minus' as const),
		},
	}));

	// Work out a reasonable domain to avoid clipping
	const allYValues = series.flatMap(s => s.data.map(d => d.y));
	const minY = Math.min(...allYValues);
	const maxY = Math.max(...allYValues);
	const yPad = (maxY - minY) * 0.1 || maxY * 0.1 || 10;
	const yDomain: [number, number] = [Math.max(0, minY - yPad), maxY + yPad];

	return (
		<View style={styles.container}>
			{title && <Text style={styles.title}>{title}</Text>}

			<View style={[styles.chartContainer, isFluid && { width: '100%' }]} onLayout={handleLayout}>
				<VictoryChart
					width={chartWidth}
					height={height}
					padding={{ top: series.length > 1 ? 40 : 20, bottom: 50, left: yAxisLabel ? 80 : 65, right: 20 }}
					domain={{ y: yDomain }}
					theme={victoryTheme as any}
					containerComponent={<VictoryContainer style={{ touchAction: 'pan-y' }} />}
				>
					{/* X-axis */}
					<VictoryAxis
						label={xAxisLabel}
						tickFormat={(t: string | number) => String(t)}
						style={{
							axisLabel: { padding: 36 },
							tickLabels: { angle: series[0]?.data.length > 6 ? -30 : 0, textAnchor: series[0]?.data.length > 6 ? 'end' : 'middle', fontSize: 9 },
						}}
					/>

					{/* Y-axis */}
					<VictoryAxis
						dependentAxis
						label={yAxisLabel}
						tickFormat={formatYLabel ?? ((t: number) => t.toLocaleString())}
						offsetX={yAxisLabel ? 80 : 65}
						style={{
							axisLabel: { padding: yAxisLabel ? 55 : 40 },
						}}
					/>

					{/* Legend inside the chart (multi-series only) */}
					{series.length > 1 && (
						<VictoryLegend
							x={yAxisLabel ? 80 : 65}
							y={8}
							orientation="horizontal"
							gutter={20}
							style={{ labels: { fontSize: 11, fill: colors.textSecondary } }}
							data={legendData}
						/>
					)}

					{/* Data series */}
					{type === 'bar' ? (
						series.length === 1 ? (
							// Single bar series – no grouping needed
							<VictoryBar
								data={series[0].data.map(d => ({ x: d.x, y: d.y }))}
								labels={({ datum }) => String(datum.y)}
								labelComponent={<VictoryTooltip constrainToVisibleArea />}
								style={{ data: { fill: series[0].color ?? palette[0], opacity: 0.85 } }}
							/>
						) : (
							// Multiple bar series – group them side by side
							<VictoryGroup offset={18} style={{ data: { width: 14 } }}>
								{series.map((s, i) => (
									<VictoryBar
										key={s.name}
										data={s.data.map(d => ({ x: d.x, y: d.y }))}
										labels={({ datum }) => String(datum.y)}
										labelComponent={<VictoryTooltip constrainToVisibleArea />}
										style={{ data: { fill: s.color ?? palette[i % palette.length], opacity: 0.85 } }}
									/>
								))}
							</VictoryGroup>
						)
					) : (
						// Line chart – one VictoryLine per series
						series.map((s, i) => (							
							<VictoryLine
								key={s.name}
								data={s.data.map(d => ({ x: d.x, y: d.y }))}
								style={{
									data: {
										stroke: s.color ?? palette[i % palette.length],
										strokeWidth: 2,
									},
								}}
							/>
						))						
					)}
					{type === 'line' && series.map((s, i) => (
						<VictoryScatter
							key={`${s.name}-scatter`}
							data={s.data.map(d => ({ x: d.x, y: d.y }))}
							labels={({ datum }) => `${s.name}: ${String(datum.y)}`}
							labelComponent={<VictoryTooltip constrainToVisibleArea />}
							size={4}
							style={{
								data: {
									fill: s.color ?? palette[i % palette.length],
								},
							}}
						/>						
					))}
				</VictoryChart>
			</View>
		</View>
	);
};
