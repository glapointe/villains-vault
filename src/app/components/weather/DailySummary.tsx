/**
 * Shared component for displaying daily weather summary
 * Used by both web and native Weather components
 */

import React from 'react';
import { View, Text } from 'react-native';
import type { DailyWeatherSummary } from '../../models';
import { Card } from 'components/ui';

interface DailySummaryProps {
	summary: DailyWeatherSummary;
	styles: any;
}

export const DailySummary: React.FC<DailySummaryProps> = ({ summary, styles }) => (
	<Card style={styles.card}>
		<Text style={styles.title}>Race Day Weather Summary</Text>

		<View style={styles.summaryRow}>
			<Text style={styles.summaryLabel}>Temperature Range</Text>
			<Text style={styles.summaryValue}>
				{summary.temperatureMin.toFixed(1)}°F - {summary.temperatureMax.toFixed(1)}°F
			</Text>
		</View>

		<View style={styles.summaryRow}>
			<Text style={styles.summaryLabel}>Average Temperature</Text>
			<Text style={styles.summaryValue}>{summary.temperatureMean.toFixed(1)}°F</Text>
		</View>

		<View style={styles.summaryRow}>
			<Text style={styles.summaryLabel}>Feels Like Range</Text>
			<Text style={styles.summaryValue}>
				{summary.apparentTemperatureMin.toFixed(1)}°F - {summary.apparentTemperatureMax.toFixed(1)}°F
			</Text>
		</View>

		<View style={styles.summaryRow}>
			<Text style={styles.summaryLabel}>Total Rain</Text>
			<Text style={styles.summaryValue}>{summary.rainSum.toFixed(2)} in</Text>
		</View>

		<View style={styles.summaryRow}>
			<Text style={styles.summaryLabel}>Max Wind Speed</Text>
			<Text style={styles.summaryValue}>{summary.windSpeedMax.toFixed(1)} mph</Text>
		</View>

		<View style={styles.summaryRow}>
			<Text style={styles.summaryLabel}>Max Wind Gusts</Text>
			<Text style={styles.summaryValue}>{summary.windGustsMax.toFixed(1)} mph</Text>
		</View>

		<View style={styles.summaryRow}>
			<Text style={styles.summaryLabel}>Sunrise</Text>
			<Text style={styles.summaryValue}>
				{summary.sunrise.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
			</Text>
		</View>

		<View style={styles.summaryRow}>
			<Text style={styles.summaryLabel}>Sunset</Text>
			<Text style={styles.summaryValue}>
				{summary.sunset.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
			</Text>
		</View>
	</Card>
);
