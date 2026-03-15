/**
 * Pace Chart Component - Native Version
 * 
 * Displays split-by-split pace analysis using Victory Native charts for mobile
 * Supports both individual runner results and race-wide statistics
 */

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { CartesianChart, Line, Bar, BarGroup } from 'victory-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { getRaceDistanceMiles } from '../../../models';
import { minutesToPace, paceToMinutes } from '../../../utils';
import type { RaceResultDetailed, SplitTimeInfo, SplitTimeStats } from '../../../models';
import { calculatePaceData, calculateRaceStatsPaceData } from './PaceChart.logic';
import { getSeriesChartPalette } from '../../../theme/chartTheme';
import { createStyles } from './PaceChart.styles';
import { useFont } from '@shopify/react-native-skia';
import segoeui from '../../../assets/fonts/SEGOEUI.TTF';
import { PaceChartProps } from './PaceChart.types';

/**
 * Pace Chart Component (Native)
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
	const palette = useMemo(() => getSeriesChartPalette(isDark), [isDark]);
	const font = useFont(segoeui, 10);

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

	// Convert pace data to bar chart format
	// For stats mode, create data with both average and median values
	const statsChartData = useMemo(() => {
		if (!isStatsMode) return [];

		return paceData.map((point, index) => ({
			x: index,
			average: point.y,
			median: 'median' in point ? (point as any).median : 0,
			segmentLabel: point.segmentLabel,
		}));
	}, [paceData, isStatsMode]);

	const individualChartData = useMemo(() => {
		if (isStatsMode) return [];

		return paceData.map((point, index) => ({
			x: index,
			y: point.y,
			segmentLabel: point.segmentLabel,
			paceLabel: point.paceLabel,
		}));
	}, [paceData, isStatsMode]);

	const overallPaceData = useMemo(() => {
		if (isStatsMode || !result?.overallPace) return [];

		const overallPaceValue = paceToMinutes(result.overallPace) || 0;
		return paceData.map((point, index) => ({
			x: index,
			y: overallPaceValue,
		}));
	}, [paceData, result, isStatsMode]);

	// If no pace data, show message
	if (paceData.length === 0) {
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

			<View style={{ minHeight: 250 }}>
				{isStatsMode ? (
					// Stats mode: Show grouped bars for average and median pace
					<CartesianChart
						data={statsChartData}
						xKey="x"
						yKeys={['average', 'median']}
						domainPadding={{ left: 30, right: 30, top: 0, bottom: 0 }}
						{...(font && {
							axisOptions: {
								font,
								labelColor: colors.textPrimary,
								lineColor: colors.border,
								tickCount: 5,
								formatYLabel: (value: number) => minutesToPace(value),
								formatXLabel: (value: number) => statsChartData[value]?.segmentLabel || '',
							}
						})}
					>
						{({ points, chartBounds }) => {
							const BarGroupComponent = BarGroup as any;
							return (
								<BarGroupComponent chartBounds={chartBounds} betweenGroupPadding={0.3} withinGroupPadding={0.1}>
									<BarGroup.Bar
										points={points.average}
										color={palette[0]}
									/>
									<BarGroup.Bar
										points={points.median}
										color={palette[1]}
									/>
								</BarGroupComponent>
							);
						}}
					</CartesianChart>
				) : (
						// Individual mode: Show single bar with overall pace line
						<CartesianChart
							data={individualChartData}
							xKey="x"
							yKeys={['y']}
							domainPadding={{ left: 30, right: 30, top: 10, bottom: 10 }}
							{...(font && {
								axisOptions: {
									font,
									labelColor: colors.textPrimary,
									lineColor: colors.border,
									tickCount: 5,
									formatYLabel: (value: number) => minutesToPace(value),
									formatXLabel: (value: number) => individualChartData[value]?.segmentLabel || '',
								}
							})}
						>
							{({ points, chartBounds, yScale }) => (
								<>
									<Bar
										points={points.y}
										chartBounds={chartBounds}
										color={palette[0]}
										innerPadding={0.6}
									/>
									{overallPaceData.length > 0 && (
										<Line
											points={points.y.map((p, i) => ({
												...p,
												y: yScale(overallPaceData[0]?.y || 0),
											}))}
											opacity={0.7}
											color={palette[2]}
											strokeWidth={2}
										/>
									)}
								</>
							)}
						</CartesianChart>
					)}
			</View>

			{/* Legend for stats mode */}
			{isStatsMode && (
				<View style={styles.legendContainer}>
					<View style={styles.legendItem}>
						<View style={[styles.legendColor, { backgroundColor: palette[0] }]} />
						<Text style={styles.legendText}>Average Pace</Text>
					</View>
					<View style={styles.legendItem}>
						<View style={[styles.legendColor, { backgroundColor: palette[1] }]} />
						<Text style={styles.legendText}>Median Pace</Text>
					</View>
				</View>
			)}
		</View>
	);
};

