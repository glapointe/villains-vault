/**
 * Weather component for displaying race day weather data (Web)
 * Uses Victory library for web-optimized charts
 */

import React, { useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryBar, VictoryLegend, VictoryContainer } from 'victory';
import { useTheme } from '../../contexts/ThemeContext';
import { MessageBox, Card } from '../ui';
import { useWeatherData } from './useWeatherData';
import { DailySummary } from './DailySummary';
import { createStyles } from './Weather.styles';
import { createVictoryTheme, getSeriesChartPalette } from '../../theme/chartTheme';
import { getThemedColors } from '../../theme';
import { WeatherProps } from './Weather.types';


/**
 * Weather component - displays comprehensive weather data for a race day
 */
export const Weather: React.FC<WeatherProps> = ({
	raceId,
	showDailySummary = true,
	showTemperatureChart = true,
	showWindChart = true,
	showRainChart = true,
}) => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);

	const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
	const victoryTheme = useMemo(() => createVictoryTheme(colors, isDark), [colors, isDark]);
	const palette = useMemo(() => getSeriesChartPalette(isDark), [isDark]);
	const { loading, error, hourlyData, dailySummary } = useWeatherData(raceId);

	const formatTime = (date: Date): string => {
		const hour = date.getHours();
		if (hour === 0) return '12 AM';
		if (hour === 12) return '12 PM';
		if (hour < 12) return `${hour} AM`;
		return `${hour - 12} PM`;
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color={colors.primary[600]} />
				<Text style={styles.loadingText}>Loading weather data...</Text>
			</View>
		);
	}

	if (error || !dailySummary) {
		return (
			<View style={styles.container}>
				<MessageBox
					type="error"
					title="Weather Data Unavailable"
					message={error || 'No weather data available'}
					showIcon
				/>
			</View>
		);
	}
	const getHeightWidth = () => {
		// Adjust the height and width of the charts to maximize the use of available space while maintaining a good aspect ratio and factoring in whether the chart is hidden
		const baseWidth = 280; // Base width for the chart if all charts are shown
		const baseHeight = 180; // Base height for the chart if all charts are shown
		const shouldShowRain = showRainChart && hourlyData.filter(d => d.rain > 0).length > 0;
		const visibleCharts = [showTemperatureChart, showWindChart, shouldShowRain].filter(Boolean).length;
		const width = visibleCharts > 0 ? baseWidth * (3 / visibleCharts) : baseWidth; // Increase width if fewer charts are shown
		const height = visibleCharts > 0 ? baseHeight * (3 / visibleCharts) : baseHeight; // Increase height if fewer charts are shown
		return { width, height };
	}

	return (
		<View style={styles.container}>
			<View style={styles.tilesWrapper}>
				{showDailySummary && <DailySummary summary={dailySummary} styles={styles} />}

				{showTemperatureChart && (
					<Card style={styles.card} allowPopout={true}>
						{({ isModal }) => (
							<>
								{!isModal && <Text style={styles.sectionTitle}>Hourly Temperature</Text>}
								<View style={styles.chartContainer}>
									<VictoryChart
										width={getHeightWidth().width}
										height={getHeightWidth().height}
										theme={victoryTheme as any}
										padding={{ top: 5, bottom: 45, left: 50, right: 0 }}
										containerComponent={
											<VictoryContainer style={{ touchAction: 'pan-y' }} />
										}
									>
										<VictoryAxis
											tickFormat={(t: any) => formatTime(new Date(t))}
											tickCount={5}
										/>
										<VictoryAxis
											dependentAxis
											label="Temp (°F)"
											style={{
												axisLabel: { padding: 35 },
											}}
										/>
										<VictoryLine
											data={hourlyData}
											x={(d: any) => d.time.getTime()}
											y="temperature"
											style={{ data: { stroke: palette[0], strokeWidth: 2 } }}
										/>
										<VictoryLine
											data={hourlyData}
											x={(d: any) => d.time.getTime()}
											y="apparentTemperature"
											style={{ data: { stroke: palette[3], strokeWidth: 2, strokeDasharray: '4,4' } }}
										/>

										{/* Legend */}
										<VictoryLegend
											x={60}
											y={getHeightWidth().height - 20}
											orientation="horizontal"
											gutter={20}
											style={{
												labels: { fontSize: 12, fill: colors.textSecondary },
											}}
											data={[
												{ name: 'Actual', symbol: { fill:palette[0], type: 'square' } },
												{ name: 'Feels Like', symbol: { fill: palette[3], type: 'square' } },
											]}
										/>
									</VictoryChart>
								</View>

							</>
						)}
					</Card>
				)}
				{showWindChart && (
					<Card style={styles.card} allowPopout={true}>
						{({ isModal }) => (
							<>
								{!isModal && <Text style={styles.sectionTitle}>Hourly Wind Speed</Text>}
								<View style={styles.chartContainer}>
									<VictoryChart
										width={getHeightWidth().width}
										height={getHeightWidth().height}
										theme={victoryTheme as any}
										padding={{ top: 5, bottom: 45, left: 40, right: 0 }}
										containerComponent={
											<VictoryContainer style={{ touchAction: 'pan-y' }} />
										}
									>
										<VictoryAxis
											tickFormat={(t: any) => formatTime(new Date(t))}
											tickCount={5}
										/>
										<VictoryAxis
											dependentAxis
											label="Wind (mph)"
											style={{
												axisLabel: { padding: 28 },
											}}
										/>
										<VictoryLine
											data={hourlyData}
											x={(d: any) => d.time.getTime()}
											y="windSpeed"
											style={{ data: { stroke: palette[1], strokeWidth: 2 } }}
										/>
										<VictoryLine
											data={hourlyData}
											x={(d: any) => d.time.getTime()}
											y="windGusts"
											style={{ data: { stroke: palette[3], strokeWidth: 2, strokeDasharray: '4,4' } }}
										/>

										{/* Legend */}
										<VictoryLegend
											x={60}
											y={getHeightWidth().height - 20}
											orientation="horizontal"
											gutter={20}
											style={{
												labels: { fontSize: 12, fill: colors.textSecondary },
											}}
											data={[
												{ name: 'Wind Speed', symbol: { fill: palette[1], type: 'square' } },
												{ name: 'Wind Gusts', symbol: { fill: palette[3], type: 'square' } },
											]}
										/>
									</VictoryChart>
								</View>

							</>
						)}
					</Card>
				)}
				{showRainChart && hourlyData.filter(d => d.rain > 0).length > 0 && (
					<Card style={styles.card} allowPopout={true}>
						{({ isModal }) => (
							<>
								{!isModal && <Text style={styles.sectionTitle}>Hourly Precipitation</Text>}
								<View style={styles.chartContainer}>
									<VictoryChart
										width={getHeightWidth().width}
										height={getHeightWidth().height}
										theme={victoryTheme as any}
										padding={{ top: 5, bottom: 30, left: 60, right: 0 }}
										containerComponent={
											<VictoryContainer style={{ touchAction: 'pan-y' }} />
										}
									>
										<VictoryAxis
											tickFormat={(t: any) => formatTime(new Date(t))}
											tickCount={5}
										/>
										<VictoryAxis
											dependentAxis
											label="Rain (in)"
											style={{
												axisLabel: { padding: 45 },
											}}
										/>
										<VictoryBar
											data={hourlyData}
											x={(d: any) => d.time.getTime()}
											y="rain"
											style={{ data: { fill: palette[0] } }}
										/>
									</VictoryChart>
								</View>
							</>
						)}
					</Card>
				)}
			</View>
		</View>
	);
};
