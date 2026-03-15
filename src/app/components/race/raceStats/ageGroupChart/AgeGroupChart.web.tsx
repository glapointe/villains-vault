/**
 * Age Group Chart Component - Web Version
 * 
 * Flexible age group visualization supporting multiple metrics
 */

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { VictoryChart, VictoryBar, VictoryAxis, VictoryLegend, VictoryLabel, VictoryGroup, VictoryContainer } from 'victory';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getThemedColors } from '../../../../theme';
import { createVictoryTheme, getSeriesChartPalette } from '../../../../theme/chartTheme';
import type { AgeGroupItem } from '../../../../models';
import { createStyles } from './AgeGroupChart.styles';
import { timeToSeconds, secondsToPace } from '../../../../utils';
import { AgeGroupMetric, AgeGroupChartProps } from './AgeGroupChart.types';

/**
 * Get metric value from age group
 */
const getMetricValue = (group: AgeGroupItem, metric: AgeGroupMetric): number => {
	switch (metric) {
		case 'count':
			return group.count;
		case 'dnfCount':
			return group.dnfCount;
		case 'averagePace':
			return timeToSeconds(group.averagePace) || 0;
		case 'medianPace':
			return timeToSeconds(group.medianPace) || 0;
		case 'averageNetTime':
			return timeToSeconds(group.averageNetTime) || 0;
		default:
			return 0;
	}
};

/**
 * Get metric label
 */
const getMetricLabel = (metric: AgeGroupMetric): string => {
	switch (metric) {
		case 'count':
			return 'Runners';
		case 'dnfCount':
			return 'DNF';
		case 'averagePace':
			return 'Average Pace';
		case 'medianPace':
			return 'Median Pace';
		case 'averageNetTime':
			return 'Average Net Time';
		default:
			return '';
	}
};

/**
 * Format metric value for display
 */
const formatMetricValue = (value: number, metric: AgeGroupMetric): string => {
	if (metric === 'averagePace' || metric === 'medianPace') {
		return secondsToPace(value);
	} else if (metric === 'averageNetTime') {
		const hours = Math.floor(value / 3600);
		const minutes = Math.floor((value % 3600) / 60);
		return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}` : `${minutes}m`;
	}
	return value.toLocaleString();
};

/**
 * Age Group Chart Component (Web)
 * Shows side-by-side comparison of male and female metrics
 */
export const AgeGroupChart: React.FC<AgeGroupChartProps> = ({
	maleAgeGroups,
	femaleAgeGroups,
	title = 'Age Group Distribution',
	metric = 'count',
}) => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
	const victoryTheme = useMemo(() => createVictoryTheme(colors, isDark), [colors, isDark]);
	const palette = useMemo(() => getSeriesChartPalette(isDark), [isDark]);

	// For DNF, we can't distinguish gender, so use single dataset
	const isDnfChart = metric === 'dnfCount';

	// Combine and format data for the chart
	const chartData = useMemo(() => {
		const maleData = maleAgeGroups.map((group, index) => ({
			x: index,
			y: getMetricValue(group, metric),
			label: group.ageGroupLabel,
		}));

		const femaleData = femaleAgeGroups.map((group, index) => ({
			x: index,
			y: getMetricValue(group, metric),
			label: group.ageGroupLabel,
		}));

		return { male: maleData, female: femaleData };
	}, [maleAgeGroups, femaleAgeGroups, metric]);

	// Calculate Y-axis domain
	const yDomain = useMemo(() => {
		// For DNF chart, only use male data (since it's the same as female)
		const allValues = isDnfChart
			? chartData.male.map(d => d.y)
			: [...chartData.male.map(d => d.y), ...chartData.female.map(d => d.y)];

		const maxValue = allValues.length > 0 ? Math.max(...allValues) : 0;

		// Ensure minimum domain to prevent chart display issues when all values are 0
		const domainMax = maxValue > 0 ? maxValue * 1.2 : 10;

		return [0, domainMax] as [number, number]; // Add 20% padding for labels, or min of 10
	}, [chartData, isDnfChart]);

	// If no data, show message
	if (chartData.male.length === 0 && chartData.female.length === 0) {
		return (
			<View style={styles.container}>
				<Text style={styles.title}>{title}</Text>
				<View style={styles.noDataContainer}>
					<Text style={styles.noDataText}>
						No age group data available
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
					width={600}
					height={350}
					padding={{ top: 30, bottom: 40, left: 60, right: 20 }}
					domainPadding={{ x: 0 }}
					domain={{
						x: [-0.5, Math.max(chartData.male.length, chartData.female.length) - 0.5],
						y: yDomain
					}}
					theme={victoryTheme as any}
					containerComponent={
						<VictoryContainer style={{ touchAction: 'pan-y' }} />
					}
				>
					{/* X-Axis (Age Groups) */}
					<VictoryAxis
						tickFormat={(t: number) => chartData.male[t]?.label || chartData.female[t]?.label || ''}
						tickCount={chartData.male.length}
						crossAxis={false}
						style={{
							tickLabels: { angle: -45, textAnchor: 'end' },
						}}
					/>

					{/* Y-Axis */}
					<VictoryAxis
						dependentAxis
						label={getMetricLabel(metric)}
						offsetX={60}
						style={{
							axisLabel: { padding: 45 },
						}}
						tickFormat={(t: number) => formatMetricValue(t, metric)}
					/>

					{isDnfChart ? (
						// DNF chart: single bars (gender can't be determined)
						<VictoryBar
							data={chartData.male}
							style={{
								data: {
									fill: palette[0],
									opacity: 0.8,
								},
								labels: {
									fill: colors.textSecondary,
									fontSize: 10,
								},
							}}
							labelComponent={<VictoryLabel
								angle={-90}
								dy={5}
								dx={15}
								text={({ datum }) => formatMetricValue(datum.y, metric)}
							/>}
						/>
					) : (
							// Other metrics: grouped male/female bars
							<VictoryGroup
								offset={12}
								colorScale={[palette[0], palette[1]]}
							>
								{/* Male Bars */}
								<VictoryBar
									data={chartData.male}
									style={{
										data: {
											fill: palette[0],
											opacity: 0.8,
										},
										labels: {
											fill: colors.textSecondary,
											fontSize: 10,
										},
									}}
									labelComponent={<VictoryLabel
										angle={-90}
										dy={5}
										dx={15}
										text={({ datum }) => formatMetricValue(datum.y, metric)}
									/>}
								/>

								{/* Female Bars */}
								<VictoryBar
									data={chartData.female}
									labelComponent={<VictoryLabel
										angle={-90}
										dy={5}
										dx={15}
										text={({ datum }) => formatMetricValue(datum.y, metric)}
									/>}
									style={{
										data: {
											fill: palette[1],
											opacity: 0.8,
										},
										labels: {
											fill: colors.textSecondary,
											fontSize: 10,
										},
									}}
								/>
							</VictoryGroup>
						)}

					{/* Legend (only for non-DNF charts) */}
					{!isDnfChart && (
						<VictoryLegend
							x={70}
							y={0}
							orientation="horizontal"
							gutter={20}
							style={{
								labels: { fontSize: 12, fill: colors.textSecondary },
							}}
							data={[
								{ name: 'Male', symbol: { fill: palette[0], type: 'square' } },
								{ name: 'Female', symbol: { fill: palette[1], type: 'square' } },
							]}
						/>
					)}
				</VictoryChart>
			</View>
		</View>
	);
};
