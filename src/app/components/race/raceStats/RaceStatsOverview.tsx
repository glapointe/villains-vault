/**
 * Race Stats Overview Component
 * 
 * Displays key race statistics in a grid of cards
 */

import React, { useMemo } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { Card, InfoTooltip } from '../../ui';
import type { RaceStats, Race } from '../../../models';
import { createStyles, getThemedStyles } from './RaceStatsOverview.styles';
import { SeriesRunnersChart } from '..';

interface RaceStatsOverviewProps {
	race: Race;
	stats: RaceStats;
}

/**
 * Individual stat card component
 */
interface StatCardProps {
	title: string;
	isHero?: boolean; // For main stats
	value: string | number;
	subtitle?: string;
	variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
	tooltip?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, isHero, value, subtitle, variant = 'default', tooltip }) => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = useMemo(() => getThemedStyles(colors), [colors]);
	const { width } = useWindowDimensions();
	const styles = useMemo(() => createStyles(width), [width]);

	const valueStyle = variant === 'primary' ? themedStyles.valuePrimary
		: variant === 'success' ? themedStyles.valueSuccess
			: variant === 'warning' ? themedStyles.valueWarning
				: variant === 'error' ? themedStyles.valueError
					: themedStyles.value;

	return (
		<Card style={styles.statCard}>
			<View style={[styles.statTitle]}>
				<Text style={[themedStyles.statTitle]}>{title}</Text>
				{Boolean(tooltip) && (
					<InfoTooltip tooltip={tooltip} />
				)}
			</View>
			<Text style={[styles.statValue, valueStyle, isHero ? styles.heroValue : undefined]}>{value}</Text>
			<Text style={[styles.statSubtitle, themedStyles.statSubtitle]}>{subtitle}</Text>
		</Card>
	);
};

/**
 * Race Stats Overview Component
 */
export const RaceStatsOverview: React.FC<RaceStatsOverviewProps> = ({ race, stats }) => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = useMemo(() => getThemedStyles(colors), [colors]);
	const { width } = useWindowDimensions();
	const styles = useMemo(() => createStyles(width), [width]);

	// Calculate percentages
	const malePercent = stats.totalRunners > 0
		? ((stats.maleRunners / stats.totalRunners) * 100).toFixed(2)
		: '0';
	const femalePercent = stats.totalRunners > 0
		? ((stats.femaleRunners / stats.totalRunners) * 100).toFixed(2)
		: '0';
	const dnfPercent = stats.totalRunners > 0
		? ((stats.dnfCount / stats.totalRunners) * 100).toFixed(2)
		: '0';
	const over16MinPercent = stats.totalRunners > 0
		? ((stats.runnersOver16minPace / stats.totalRunners) * 100).toFixed(2)
		: '0';

	// Calculate total missed splits
	const totalMissedSplits = (stats.splits || []).reduce((sum, split) => sum + split.misses, 0);

	// Format time duration (ISO 8601 duration to readable format)
	const formatDuration = (duration: string): string => {
		// Parse ISO 8601 duration (e.g., "00:56:35")
		const match = duration.match(/(\d{2}):(\d{2}):(\d{2})/);
		if (!match) return duration;

		const [, hours, minutes, seconds] = match;
		const h = parseInt(hours, 10);
		const m = parseInt(minutes, 10);

		if (h > 0) {
			return `${h}h ${m}m`;
		}
		return `${m}m ${seconds}s`;
	};

	return (
		<View style={[styles.container, themedStyles.container]}>
			{/* <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Race Overview</Text> */}

			{/* Main stats grid */}
			<View style={styles.grid}>
				<StatCard
					title="Total Runners"
					isHero={true}
					value={stats.totalRunners.toLocaleString()}
					variant="primary"
				/>
				<StatCard
					title="Male Runners"
					isHero={true}
					value={stats.maleRunners.toLocaleString()}
					subtitle={`${malePercent}% of total`}
				/>
				<StatCard
					title="Female Runners"
					isHero={true}
					value={stats.femaleRunners.toLocaleString()}
					subtitle={`${femalePercent}% of total`}
				/>
				<StatCard
					title="DNF Runners"
					isHero={true}
					value={stats.dnfCount.toLocaleString()}
					subtitle={`${dnfPercent}% of total`}
					variant={stats.dnfCount > 0 ? 'warning' : 'default'}
				/>
			</View>

			{/* Runner types and Race Dynamics side-by-side */}
			<View style={styles.sideBySideContainer}>
				{/* Runner types */}
				<View style={styles.sideColumn}>
					<Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Runner Types</Text>
					<View style={styles.grid}>
						<StatCard
							title="Standard Runners"
							value={stats.runnerTypeRunner.toLocaleString()}
							subtitle={`${((stats.runnerTypeRunner / stats.totalRunners) * 100).toFixed(2)}% of total`}
						/>
						<StatCard
							title="Push Rim"
							value={stats.runnerTypePushRim}
							subtitle={`${((stats.runnerTypePushRim / stats.totalRunners) * 100).toFixed(2)}% of total`}
						/>
						<StatCard
							title="Hand Cycle"
							value={stats.runnerTypeHandCycle}
							subtitle={`${((stats.runnerTypeHandCycle / stats.totalRunners) * 100).toFixed(2)}% of total`}
						/>
						<StatCard
							title="Duo Teams"
							value={stats.runnerTypeDuo}
							subtitle={`${((stats.runnerTypeDuo / stats.totalRunners) * 100).toFixed(2)}% of total`}
						/>
					</View>
				</View>

				{/* Race Dynamics */}
				<View style={styles.sideColumn}>
					<Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Race Dynamics</Text>
					<View style={styles.grid}>
						<StatCard
							title="Over 16 Pace"
							value={stats.runnersOver16minPace.toLocaleString()}
							subtitle={`${over16MinPercent}% of total`}
						/>
						<StatCard
							title="Missed Splits"
							tooltip="Number of missed timing splits across all runners and segments. Can indicate congestion or timing issues with a timing mat."
							value={totalMissedSplits.toLocaleString()}
							subtitle="Across all segments"
						/>
						<StatCard
							title="Launch Time"
							tooltip="Time from race start to the last person crossing the start line. Congestion factor indicates the level of crowding."
							value={formatDuration(stats.launchTime)}
							subtitle={`Congestion: ${stats.launchCongestionFactor.toFixed(0)}/m`}
						/>
						<StatCard
							title="Landing Time"
							tooltip="Time from first person crossing the finish line to the last person crossing the finish line. Congestion factor indicates the level of crowding."
							value={formatDuration(stats.landingTime)}
							subtitle={`Congestion: ${stats.landingCongestionFactor.toFixed(0)}/m`}
						/>
					</View>
				</View>
			</View>

			{/* Series Runners Chart – participation trends over time */}
			<View style={styles.statsContainer}>
				<SeriesRunnersChart race={race} />
			</View>
		</View>
	);
};
