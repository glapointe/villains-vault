/**
 * Race Statistics Dashboard Component
 * 
 * Comprehensive dashboard displaying race statistics including:
 * - Overview stats (runner counts, gender breakdown, DNF, etc.)
 * - Pace analysis across splits
 * - Age group distribution
 * - Runner type breakdown
 */

import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { Card } from '../../ui';
import { PaceChart } from '../paceChart';
import { RaceStatsOverview } from './RaceStatsOverview';
import { AgeGroupChart } from './ageGroupChart';
import { SplitsStatsTable } from './SplitsStatsTable';
import type { RaceStats, Race } from '../../../models';
import { createStyles } from './RaceStatsDashboard.styles';

export interface RaceStatsDashboardProps {
	stats: RaceStats;
	race: Race;
}

/**
 * Race Statistics Dashboard Component
 * Displays comprehensive race statistics in a dashboard layout
 */
export const RaceStatsDashboard: React.FC<RaceStatsDashboardProps> = ({ stats, race }) => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const { width } = useWindowDimensions();
	const styles = useMemo(() => createStyles(colors, isDark, width), [colors, isDark, width]);
	
	return (
		<View style={styles.container}>
			{/* Overview Stats Cards */}
			<RaceStatsOverview stats={stats} race={race} />
			
			{/* Splits and Pace side-by-side */}
			{stats.splits && stats.splits.length > 0 && (
				<Card style={styles.splitsCard}>
					<View style={styles.splitsAndPaceContainer}>
						{/* Splits Stats Table */}
						<View style={styles.splitsColumn}>
							<SplitsStatsTable splits={stats.splits} />
						</View>
						
						{/* Pace Chart */}
						<Card style={styles.paceChartColumn} allowPopout={true}>
							<PaceChart 
								statsSplits={stats.splits}
								title="Average Pace by Segment"
							/>
						</Card>
					</View>
				</Card>
			)}
			
			{/* Age Group Charts */}
			{((stats.maleAgeGroupStats && stats.maleAgeGroupStats.length > 0) || 
			  (stats.femaleAgeGroupStats && stats.femaleAgeGroupStats.length > 0)) && (
				<View style={styles.ageGroupChartsContainer}>
					{/* Runner Counts */}
					<Card style={styles.ageGroupChartCard} allowPopout={true}>
						<AgeGroupChart 
							maleAgeGroups={stats.maleAgeGroupStats || []}
							femaleAgeGroups={stats.femaleAgeGroupStats || []}
							title="Runners by Age Group"
							metric="count"
						/>
					</Card>
					
					{/* Average Pace */}
					<Card style={styles.ageGroupChartCard} allowPopout={true}>
						<AgeGroupChart 
							maleAgeGroups={stats.maleAgeGroupStats || []}
							femaleAgeGroups={stats.femaleAgeGroupStats || []}
							title="Average Pace by Age Group"
							metric="averagePace"
						/>
					</Card>
					
					{/* DNF Counts */}
					<Card style={styles.ageGroupChartCard} allowPopout={true}>
						<AgeGroupChart 
							maleAgeGroups={stats.maleAgeGroupStats || []}
							femaleAgeGroups={stats.femaleAgeGroupStats || []}
							title="DNF Counts by Age Group"
							metric="dnfCount"
						/>
					</Card>
					
					{/* Average Net Time */}
					{/* <Card style={styles.ageGroupChartCard} allowPopout={true}>
						<AgeGroupChart 
							maleAgeGroups={stats.maleAgeGroupStats || []}
							femaleAgeGroups={stats.femaleAgeGroupStats || []}
							title="Average Finish Time by Age Group"
							metric="averageNetTime"
						/>
					</Card> */}
				</View>
			)}
		</View>
	);
};

export default RaceStatsDashboard;
