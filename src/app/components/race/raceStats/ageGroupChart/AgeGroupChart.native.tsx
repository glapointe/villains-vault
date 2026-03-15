/**
 * Age Group Chart Component - Native Version
 * 
 * Flexible age group visualization supporting multiple metrics
 */

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { CartesianChart, Bar, BarGroup } from 'victory-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getThemedColors } from '../../../../theme';
import { getSeriesChartPalette } from '../../../../theme/chartTheme';
import type { AgeGroupItem } from '../../../../models';
import { createStyles } from './AgeGroupChart.styles';
import { useFont } from '@shopify/react-native-skia';
import segoeui from '../../../../assets/fonts/SEGOEUI.TTF';
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
 * Age Group Chart Component (Native)
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
	const palette = useMemo(() => getSeriesChartPalette(isDark), [isDark]);
	const font = useFont(segoeui, 10);

	// For DNF, we can't distinguish gender, so use single dataset
	const isDnfChart = metric === 'dnfCount';

	// Combine and format data for the chart
	const chartData = useMemo(() => {
		// Match male and female age groups by label
		const allLabels = new Set([
			...maleAgeGroups.map(g => g.ageGroupLabel),
			...femaleAgeGroups.map(g => g.ageGroupLabel),
		]);

		return Array.from(allLabels).map((label, index) => {
			const maleGroup = maleAgeGroups.find(g => g.ageGroupLabel === label);
			const femaleGroup = femaleAgeGroups.find(g => g.ageGroupLabel === label);

			// For DNF, only use male data (since male/female values are identical)
			if (isDnfChart) {
				return {
					x: index,
					value: maleGroup ? getMetricValue(maleGroup, metric) : 0,
					label,
				};
			}

			// For other metrics, use both male and female
			return {
				x: index,
				male: maleGroup ? getMetricValue(maleGroup, metric) : 0,
				female: femaleGroup ? getMetricValue(femaleGroup, metric) : 0,
				label,
			};
		});
	}, [maleAgeGroups, femaleAgeGroups, metric, isDnfChart]);

	// If no data, show message
	if (chartData.length === 0) {
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

			{/* Note: Victory Native doesn't support labels above bars like web version.
				Values can be read from the y-axis scale. Age group labels are shown on x-axis. */}
			<View style={{ minHeight: 300 }}>
				{isDnfChart ? (
					// DNF chart: single bars (gender can't be determined)
					<CartesianChart
						data={chartData}
						xKey="x"
						yKeys={['value']}
						domainPadding={{ left: 30, right: 30, top: 10, bottom: 0 }}
						{...(font && {
							axisOptions: {
								font,
								labelColor: colors.textPrimary,
								lineColor: colors.border,
								tickCount: { x: chartData.length / 2, y: 5 },
								formatXLabel: (value: number) => chartData[value]?.label || '',
								labelOffset: { x: -2, y: 2 },
							}
						})}
					>
						{({ points, chartBounds }) => (
							<Bar
								points={points.value}
								chartBounds={chartBounds}
								color={palette[0]}
								innerPadding={0.5}
							/>
						)}
					</CartesianChart>
				) : (
						// Other metrics: grouped male/female bars
						<CartesianChart
							data={chartData}
							xKey="x"
							yKeys={['male', 'female']}
							domainPadding={{ left: 30, right: 30, top: 10, bottom: 0 }}
							{...(font && {
								axisOptions: {
									font,
									labelColor: colors.textPrimary,
									lineColor: colors.border,
									tickCount: { x: chartData.length / 2, y: 5 },
									formatXLabel: (value: number) => chartData[value]?.label || '',
								}
							})}
						>
							{({ points, chartBounds }) => {
								const BarGroupComponent = BarGroup as any;
								return (
									<BarGroupComponent chartBounds={chartBounds} betweenGroupPadding={0.6} withinGroupPadding={0.1}>
										<BarGroup.Bar
											points={points.male}
											color={palette[0]}
										/>
										<BarGroup.Bar
											points={points.female}
											color={palette[1]}
										/>
									</BarGroupComponent>
								);
							}}
						</CartesianChart>
					)}
			</View>

			{/* Legend (only for non-DNF charts) */}
			{!isDnfChart && (
				<View style={styles.legendContainer}>
					<View style={styles.legendItem}>
						<View style={[styles.legendColor, { backgroundColor: palette[0] }]} />
						<Text style={styles.legendText}>Male</Text>
					</View>
					<View style={styles.legendItem}>
						<View style={[styles.legendColor, { backgroundColor: palette[1] }]} />
						<Text style={styles.legendText}>Female</Text>
					</View>
				</View>
			)}
		</View>
	);
};
