/**
 * Splits Stats Table Component
 * 
 * Displays split time statistics including average time and pace with comparison indicators
 */

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import type { SplitTimeStats } from '../../../models';
import { formatTime, timeToSeconds, secondsToPace, formatDistance } from '../../../utils';
import { styles, getThemedStyles } from './SplitsStatsTable.styles';

interface SplitsStatsTableProps {
	splits: SplitTimeStats[];
}

/**
 * Splits Stats Table Component
 * Shows average time, pace comparison, and misses for each split
 */
export const SplitsStatsTable: React.FC<SplitsStatsTableProps> = ({ splits }) => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = useMemo(() => getThemedStyles(colors), [colors]);
	
	// Calculate cumulative average times for each split
	const cumulativeTimes = useMemo(() => {
		let cumulative = 0;
		return splits.map(split => {
			const avgPaceSeconds = timeToSeconds(split.averagePace) || 0;
			const segmentSeconds = avgPaceSeconds * split.segmentDistanceInMiles;
			cumulative += segmentSeconds;
			
			// Convert to HH:MM:SS format
			const hours = Math.floor(cumulative / 3600);
			const minutes = Math.floor((cumulative % 3600) / 60);
			const seconds = Math.floor(cumulative % 60);
			return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
		});
	}, [splits]);
	
	// Track previous segment pace for comparison
	let previousPaceSeconds: number | null = null;
	
	return (
		<View style={styles.container}>
			<Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>
				Average Split Times & Pace Comparison
			</Text>
			<View style={styles.splitsGrid}>
				{splits.map((split, index) => {
					const avgPaceSeconds = timeToSeconds(split.averagePace) || 0;
					const segmentPace = secondsToPace(avgPaceSeconds);
					
					const isFaster = previousPaceSeconds !== null && avgPaceSeconds < previousPaceSeconds;
					const isSlower = previousPaceSeconds !== null && avgPaceSeconds > previousPaceSeconds;
					previousPaceSeconds = avgPaceSeconds;
					
					return (
						<View key={`split-${index}`} style={[styles.splitRow, themedStyles.splitRow]}>
							<View style={styles.splitInfo}>
								<Text style={[styles.splitLabel, themedStyles.splitLabel]}>
									{split.label}
								</Text>
								<Text style={[styles.splitDistance, themedStyles.splitDistance]}>
									{formatDistance(split.segmentDistanceInMiles)}
								</Text>
							</View>
						
							<View style={styles.splitMissesContainer}>
								<Text style={[styles.splitMissesLabel, themedStyles.splitMissesLabel]}>
									Misses:
								</Text>
								<Text style={[styles.splitMissesValue, themedStyles.splitMissesValue, split.misses > 0 ? themedStyles.splitMissesWarning : null    ]}>
									{split.misses}
								</Text>
							</View>
							<View style={styles.splitValues}>
								<View style={styles.timeContainer}>
									<Text style={[styles.splitValue, themedStyles.splitValue]}>
										{formatTime(cumulativeTimes[index])}
									</Text>
								</View>
								<View style={styles.splitPaceContainer}>
									<Text style={[
										styles.paceValue,
										isFaster ? themedStyles.paceFaster : isSlower ? themedStyles.paceSlower : themedStyles.paceNeutral
									]}>
										{isFaster ? '↑ ' : isSlower ? '↓ ' : ''}{segmentPace}/mi
									</Text>
								</View>
							</View>
						</View>
					);
				})}
			</View>
		</View>
	);
};
