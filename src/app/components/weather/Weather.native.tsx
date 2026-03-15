/**
 * Weather component for displaying race day weather data (Native - iOS/Android)
 * Uses Victory Native's CartesianChart for mobile-optimized charts
 */

import React, { useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { CartesianChart, Line, Bar } from 'victory-native';
import { useTheme } from '../../contexts/ThemeContext';
import { MessageBox, Card } from '../ui';
import { useWeatherData } from './useWeatherData';
import { DailySummary } from './DailySummary';
import { createStyles } from './Weather.styles';
import { getThemedColors } from '../../theme';
import { DashPathEffect, useFont } from '@shopify/react-native-skia';
import segoeui from '../../assets/fonts/SEGOEUI.TTF';
import { getSeriesChartPalette } from 'theme/chartTheme';
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
    const font = useFont(segoeui, 10);
    const styles = useMemo(() => createStyles(colors, isDark), [isDark]);
    const { loading, error, hourlyData, dailySummary } = useWeatherData(raceId);
	const palette = useMemo(() => getSeriesChartPalette(isDark), [isDark]);

    // Convert hourly data to Victory Native format (needs plain objects with x/y keys)
    const temperatureData = useMemo(() =>
        hourlyData.map((entry, index) => ({
            x: index,
            temperature: entry.temperature,
            apparentTemperature: entry.apparentTemperature,
        })),
        [hourlyData]
    );

    const windData = useMemo(() =>
        hourlyData.map((entry, index) => ({
            x: index,
            windSpeed: entry.windSpeed,
            windGusts: entry.windGusts,
        })),
        [hourlyData]
    );

    const rainData = useMemo(() =>
        hourlyData.map((entry, index) => ({
            x: index,
            rain: entry.rain,
        })),
        [hourlyData]
    );

    if (loading || !font) {
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

    return (
        <View style={styles.container}>
            <View style={styles.tilesWrapper}>
                {showDailySummary && <DailySummary summary={dailySummary} styles={styles} />}

                {showTemperatureChart && temperatureData.length > 0 && (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>Hourly Temperature</Text>
                        <View style={styles.chartContainer}>
                            <CartesianChart
                                data={temperatureData}
                                xKey="x"
                                yKeys={["temperature", "apparentTemperature"]}
                                domainPadding={{ left: 10, right: 10, top: 10, bottom: 10 }}
                                {...(font && {
									axisOptions: {
										font,
										labelColor: colors.textPrimary,
										lineColor: colors.border,
										tickCount: 5,
										formatXLabel: (value: number) => temperatureData[value]?.temperature.toString() || '',
									}
								})}
                            >
                                {({ points }) => (
                                    <>
                                        <Line points={points.temperature} color={palette[0]} strokeWidth={2} />
                                        <Line
                                            points={points.apparentTemperature}
                                            color={palette[3]}
                                            strokeWidth={2}
                                        >
                                            <DashPathEffect intervals={[10, 5]} />
                                        </Line>
                                    </>
                                )}
                            </CartesianChart>
                        </View>
                        <Text style={styles.chartLegend}>Solid: Actual | Dashed: Feels Like</Text>
                    </Card>
                )}

                {showWindChart && windData.length > 0 && (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>Hourly Wind Speed</Text>
                        <View style={styles.chartContainer}>
                            <CartesianChart
                                data={windData}
                                xKey="x"
                                yKeys={["windSpeed", "windGusts"]}
                                domainPadding={{ left: 10, right: 10, top: 10, bottom: 10 }}
                                {...(font && {
									axisOptions: {
										font,
										labelColor: colors.textPrimary,
										lineColor: colors.border,
										tickCount: 5,
										formatXLabel: (value: number) => windData[value]?.windSpeed.toString() || '',
									}
								})}
                            >
                                {({ points }) => (
                                    <>
                                        <Line points={points.windSpeed} color={palette[1]} strokeWidth={2} />
                                        <Line
                                            points={points.windGusts}
                                            color={palette[3]}
                                            strokeWidth={2}
                                        >
                                            <DashPathEffect intervals={[10, 5]} />
                                        </Line>
                                    </>
                                )}
                            </CartesianChart>
                        </View>
                        <Text style={styles.chartLegend}>Solid: Wind Speed | Dashed: Wind Gusts</Text>
                    </Card>
                )}

                {showRainChart && rainData.length > 0 && (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>Hourly Precipitation</Text>
                        <View style={styles.chartContainer}>
                            <CartesianChart
                                data={rainData}
                                xKey="x"
                                yKeys={["rain"]}
                                domainPadding={{ left: 10, right: 10, top: 10, bottom: 0 }}
                                {...(font && {
									axisOptions: {
										font,
										labelColor: colors.textPrimary,
										lineColor: colors.border,
										tickCount: 5,
										formatXLabel: (value: number) => rainData[value]?.rain.toString() || '',
									}
								})}
                            >
                                {({ points, chartBounds }) => (
                                    <Bar
                                        points={points.rain}
                                        chartBounds={chartBounds}
                                        color={palette[0]}
                                    />
                                )}
                            </CartesianChart>
                        </View>
                    </Card>
                )}
            </View>
        </View>
    );
};
