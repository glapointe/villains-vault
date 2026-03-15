/**
 * Series Runners Chart
 *
 * Displays total, male, female, and DNF runner counts over time
 * for all races in the same event series and distance as the given race.
 *
 * Data is fetched from the getSeriesStats API endpoint.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { Card, Chart } from '../../ui';
import type { ChartSeries } from '../../ui';
import { api } from '../../../services/api';
import type { Race, RaceWithStats } from '../../../models';
import { EventSeries } from '../../../models';

interface SeriesRunnersChartProps {
	/** The current race – used to determine event series and distance */
	race: Race;
}

/**
 * Extract a four-digit year string from an ISO date string
 */
function toYear(dateStr: string): string {
	return dateStr.slice(0, 4);
}

/**
 * SeriesRunnersChart
 *
 * Shows how runner participation (total / male / female / DNF) has changed
 * across every edition of the same RunDisney event series and distance.
 */
export const SeriesRunnersChart: React.FC<SeriesRunnersChartProps> = ({ race }) => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);

	const [seriesData, setSeriesData] = useState<RaceWithStats[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Only fetch when we have a known event series
	const canFetch =
		race.eventSeries !== undefined &&
		race.eventSeries !== null &&
		race.eventSeries !== EventSeries.Unknown;

	useEffect(() => {
		if (!canFetch) return;

		let cancelled = false;
		setLoading(true);
		setError(null);

		api.races
			.getSeriesStats(race.eventSeries!, race.distance)
			.then((data) => {
				if (!cancelled) setSeriesData(data as unknown as RaceWithStats[]);
			})
			.catch((err) => {
				if (!cancelled)
					setError(err instanceof Error ? err.message : 'Failed to load series data');
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => { cancelled = true; };
	}, [race.eventSeries, race.distance, canFetch]);

	// Build chart series from API data (sorted by race date ascending)
	const chartSeries: ChartSeries[] = useMemo(() => {
		if (seriesData.length < 2) return [];

		const sorted = [...seriesData].sort(
			(a, b) => new Date(a.raceDate).getTime() - new Date(b.raceDate).getTime(),
		);

		const totalSeries: ChartSeries = {
			name: 'Total',
			data: sorted.map(r => ({ x: toYear(r.raceDate), y: r.raceStats.totalRunners })),
		};

		const maleSeries: ChartSeries = {
			name: 'Male',
			data: sorted.map(r => ({ x: toYear(r.raceDate), y: r.raceStats.maleRunners })),
		};

		const femaleSeries: ChartSeries = {
			name: 'Female',
			data: sorted.map(r => ({ x: toYear(r.raceDate), y: r.raceStats.femaleRunners })),
		};

		const dnfSeries: ChartSeries = {
			name: 'DNF',
			data: sorted.map(r => ({ x: toYear(r.raceDate), y: r.raceStats.dnfCount })),
		};

		return [totalSeries, maleSeries, femaleSeries, dnfSeries];
	}, [seriesData, colors]);

	// Don't render if there is no event series context
	if (!canFetch) return null;

	if (loading) {
		return (
			<Card>
				<View style={{ padding: 24, alignItems: 'center' }}>
					<ActivityIndicator size="small" color={colors.primary} />
					<Text style={{ marginTop: 8, color: colors.textSecondary, fontSize: 13 }}>
						Loading series data…
					</Text>
				</View>
			</Card>
		);
	}

	if (error) {
		return null; // Silently hide on error – stats are supplementary
	}

	// Need at least two data points to draw a meaningful line
	if (chartSeries.length === 0) return null;

	return (
		<Card>
			<Chart
				type="line"
				title="Runners Over Time"
				series={chartSeries}
				xAxisLabel=""
				yAxisLabel="Runners"
				height={220}
				width="100%"
				formatYLabel={(v) => v.toLocaleString()}
			/>
		</Card>
	);
};
