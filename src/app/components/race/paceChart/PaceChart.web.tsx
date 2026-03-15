/**
 * Pace Chart Component - Web Version
 * 
 * Displays split-by-split pace analysis using Victory charts for web
 * Supports both individual runner results and race-wide statistics
 */

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { VictoryChart, VictoryBar, VictoryLine, VictoryAxis, VictoryLegend, VictoryGroup, VictoryContainer } from 'victory';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { createVictoryTheme, getSeriesChartPalette } from '../../../theme/chartTheme';
import { getRaceDistanceMiles, RaceDistance } from '../../../models';
import type { RaceResultDetailed, SplitTimeInfo, SplitTimeStats } from '../../../models';
import { calculatePaceData, calculateRaceStatsPaceData } from './PaceChart.logic';
import { createStyles } from './PaceChart.styles';
import { paceToMinutes, minutesToPace } from '../../../utils';
import { PaceChartProps } from './PaceChart.types';


/**
 * Pace Chart Component (Web)
 * Shows pace progression through split segments
 * For individual: compares split pace to overall pace
 * For race stats: shows average and median paces
 */
export const PaceChart: React.FC<PaceChartProps> = ({
	result,
	splitTimes,
	raceDistance,
	statsSplits,
	title = 'Segment Pace',
}) => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
	const victoryTheme = useMemo(() => createVictoryTheme(colors, isDark), [colors, isDark]);
	const palette = useMemo(() => getSeriesChartPalette(isDark), [isDark]);

	// Determine if we're in stats mode
	const isStatsMode = !!statsSplits;

	// Get total distance in miles (for individual mode)
	const totalDistanceInMiles = raceDistance ? getRaceDistanceMiles(raceDistance) : 0;

	// Calculate pace data based on mode
	const paceData = useMemo(() => {
		if (isStatsMode && statsSplits) {
			return calculateRaceStatsPaceData(statsSplits);
		} else if (result && splitTimes && raceDistance) {
			return calculatePaceData(result, splitTimes, totalDistanceInMiles);
		}
		return [];
	}, [isStatsMode, statsSplits, result, splitTimes, raceDistance, totalDistanceInMiles]);

	// Convert pace data to bar chart format (using indices)
	const barData = useMemo(() => {
		return paceData.map((point, index) => ({
			x: index,
			y: point.y,
			segmentLabel: point.segmentLabel,
			paceLabel: point.paceLabel,
			...(isStatsMode && 'median' in point ? {
				median: (point as any).median,
				medianLabel: (point as any).medianLabel
			} : {})
		}));
	}, [paceData, isStatsMode]);

	// Get overall pace value (only for individual mode)
	const overallPace = useMemo(() => {
		if (isStatsMode || !result) return null;
		const pace = result.overallPace;
		if (!pace) return null;
		return paceToMinutes(pace);
	}, [isStatsMode, result]);

	// Create overall pace line data spanning all bars (only for individual mode)
	const overallPaceLine = useMemo(() => {
		if (isStatsMode || overallPace === null || barData.length === 0) return [];
		return [
			{ x: -0.5, y: overallPace },
			{ x: barData.length - 0.5, y: overallPace },
		];
	}, [isStatsMode, overallPace, barData.length]);

	// Calculate Y-axis domain
	const yDomain = useMemo(() => {
		const allPaces = [...barData.map(d => d.y)];
		if (!isStatsMode && overallPace !== null) allPaces.push(overallPace);
		if (isStatsMode) {
			barData.forEach(d => {
				if ('median' in d && d.median) allPaces.push(d.median);
			});
		}
		if (allPaces.length === 0) return [0, 20];

		const minPace = Math.min(...allPaces);
		const maxPace = Math.max(...allPaces);
		const range = maxPace - minPace;
		const padding = range * 0.1;

		return [
			Math.max(0, minPace - padding),
			maxPace + padding,
		];
	}, [barData, overallPace, isStatsMode]);

	// If no pace data, show message
	if (barData.length === 0) {
		return (
			<View style={styles.container}>
				<Text style={styles.title}>{title}</Text>
				<View style={styles.noDataContainer}>
					<Text style={styles.noDataText}>
						No pace data available
					</Text>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>{title}</Text>
			<View style={styles.chartContainer}>
				<VictoryChart
					width={500}
					height={300}
					padding={{ top: 40, bottom: 40, left: 70, right: 20 }}
					domain={{ x: [-0.5, barData.length - 0.5], y: yDomain as [number, number] }}
					domainPadding={{ x: 0 }}
					theme={victoryTheme as any}
					containerComponent={
						<VictoryContainer style={{ touchAction: 'pan-y' }} />
					}
				>
					{/* X-Axis (Split Segments) */}
					<VictoryAxis
						tickFormat={(t: number) => barData[t]?.segmentLabel || ''}
						crossAxis={false}
						style={{
							tickLabels: { angle: -25, textAnchor: 'end' },
						}}
					/>

					{/* Y-Axis (Pace) */}
					<VictoryAxis
						dependentAxis
						label="Pace (min/mile)"
						tickFormat={(t: number) => minutesToPace(t)}
						offsetX={70}
						style={{
							axisLabel: { padding: 45 },
						}}
					/>

					{/* Stats Mode: Grouped bars for average and median */}
					{isStatsMode && barData.some(d => 'median' in d) ? (
						<VictoryGroup
							offset={30}
							colorScale={[palette[0], palette[1]]}
						>
							{/* Average Pace Bars */}
							<VictoryBar
								data={barData}
								style={{
									data: {
										fill: palette[0],
										opacity: 0.8,
									},
								}}
								labels={({ datum }) => datum.paceLabel}
								barWidth={20}
							/>

							{/* Median Pace Bars */}
							<VictoryBar
								data={barData.map((d, i) => ({
									x: i,
									y: 'median' in d ? d.median : 0,
									medianLabel: 'median' in d ? d.medianLabel : '',
								}))}
								style={{
									data: {
										fill: palette[1],
										opacity: 0.8,
									},
								}}
								labels={({ datum }) => datum.medianLabel}
								barWidth={20}
							/>
						</VictoryGroup>
					) : (
							/* Individual Mode: Single bars */
							<VictoryBar
								data={barData}
								style={{
									data: {
										fill: palette[0],
										opacity: 0.8,
									},
								}}
								barWidth={30}
								labels={({ datum }) => datum.paceLabel}
							/>
						)}

					{/* Overall Pace Reference Line (individual mode only) */}
					{!isStatsMode && overallPaceLine.length > 0 && (
						<VictoryLine
							data={overallPaceLine}
							style={{
								data: {
									stroke: palette[2],
									strokeWidth: 2,
									strokeDasharray: '5,5',
								},
							}}
						/>
					)}

					{/* Legend */}
					<VictoryLegend
						x={60}
						y={10}
						orientation="horizontal"
						gutter={20}
						style={{
							labels: { fontSize: 12, fill: colors.textSecondary },
						}}
						data={
							isStatsMode
								? [
									{ name: 'Average Pace', symbol: { fill: palette[0], type: 'square' } },
									{ name: 'Median Pace', symbol: { fill: palette[1], type: 'square' } },
								]
								: [
									{ name: 'Split Pace', symbol: { fill: palette[0], type: 'square' } },
									{ name: 'Overall Pace', symbol: { fill: palette[2], type: 'minus' } },
								]
						}
					/>
				</VictoryChart>
			</View>
		</View>
	);
};
