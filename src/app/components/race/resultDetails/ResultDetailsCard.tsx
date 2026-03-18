/**
 * Result Details Card Component
 * 
 * Displays comprehensive race result information for a single runner.
 * Presents stats in an attractive, encouraging, mobile-friendly format
 * with percentages, tiles, and clear data visualization.
 */

import { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { Card, LoadingSpinner, MessageBox } from '../../ui';
import { PaceChart } from '../paceChart';
import { api } from '../../../services/api';
import { formatTime, timeToSeconds, secondsToPace, formatDistance } from '../../../utils';
import { Race, RaceResultDetailed, Division, SplitTimeInfo, RunnerType } from '../../../models';
import { getGenderLabel, getRunnerTypeLabel, getRaceDistanceMiles, Gender, getRaceDistanceMilesLabel } from '../../../models';
import { styles, getThemedStyles } from './ResultDetailsCard.styles';
import { PassStats } from '.';

/**
 * Props for ResultDetailsCard component
 */
interface ResultDetailsCardProps {
	/**
	 * Race object containing metadata
	 */
    race: Race;

	/**
	 * Detailed race result for the runner
	 */
    result: RaceResultDetailed;
}

/**
 * Helper to calculate and format percentage
 */
const calculatePercentage = (value?: number, total?: number): string => {
    if (value === undefined || value === null || !total || total === 0) return '--';
    const percentage = ((value / total) * 100).toFixed(2);
    return `${percentage}%`;
};

/**
 * Result Details Card Component
 */
export const ResultDetailsCard: React.FC<ResultDetailsCardProps> = ({ race, result }) => {
    const { isDark } = useTheme();
    const colors = getThemedColors(isDark);
    const themedStyles = getThemedStyles(colors);
    const { width } = useWindowDimensions();
    const splitTimes = race.metadata?.splitTimes || [];
    const splitTimesWithFinish = useMemo(() => {
        const st = [...splitTimes];
        // Add the finish time as the last split
        st.push({
            label: 'Finish',
            distance: getRaceDistanceMiles(race.distance),
            isKilometers: false,
        });
        return st;
    }, [splitTimes, race.distance]);

    const splitValues = useMemo(() => {
        // Get split values from result
        const sv = [
            result.split1,
            result.split2,
            result.split3,
            result.split4,
            result.split5,
            result.split6,
            result.split7,
            result.split8,
            result.split9,
            result.split10,
        ];
        sv[splitTimes.length ?? sv.length - 1] = result.netTime;
        return sv;
    }, [result, splitTimes]);
    
    // Determine if screen is narrow (should stack vertically)
    const isNarrowScreen = width < 800;

    const [division, setDivision] = useState<Division | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch division data
    useEffect(() => {
        const fetchDivision = async () => {
            setLoading(true);
            try {
                const divisions = await api.raceResults.getDivisions(race.id);
                const foundDivision = divisions.find(d => d.id === result.divisionId);
                setDivision(foundDivision || null);
                setError(null);
            } catch (err) {
                setError('Failed to load division information');
                console.error('Error fetching division:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDivision();
    }, [race.id, result.divisionId]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <LoadingSpinner size="large" />
            </View>
        );
    }

    if (error) {
        return (
            <MessageBox
                type="warning"
                title="Partial Data"
                message={error}
                showIcon
            />
        );
    }

    // Split times from race metadata


    const hasSplits = splitTimesWithFinish.length > 0;
    let previousPaceSeconds: number = NaN; // Track previous segment pace for comparison

    const getSplitRow = (splitTimes: SplitTimeInfo[], index: number) => {
        const split = splitTimes[index];
        const splitValue = splitValues[index];
        const hasValue = splitValue !== null && splitValue !== undefined;
        const previousSplitValue = (index > 0 ? splitValues[index - 1] : '00:00:00') || '00:00:00';
        const startSeconds = timeToSeconds(previousSplitValue);
        const endSeconds = timeToSeconds(splitValue || '00:00:00');
        
        if (startSeconds === null || endSeconds === null) return null;
        const previousDistance = index > 0 ? 
            splitTimes[index - 1].isKilometers ? splitTimes[index - 1].distance * 0.621371 : splitTimes[index - 1].distance : 0;
        const currentDistance = split.isKilometers ? split.distance * 0.621371 : split.distance;
        const segmentDistance = currentDistance - previousDistance;
        const segmentSeconds = endSeconds - startSeconds;
        const paceSeconds = segmentSeconds / segmentDistance;
        const segmentPace = secondsToPace(paceSeconds);

		const isFaster = paceSeconds < previousPaceSeconds;
        const isSlower = paceSeconds > previousPaceSeconds;
        previousPaceSeconds = paceSeconds;

        return (
            <View key={`split-${index}`} style={[styles.splitRow, themedStyles.splitRow]}>
                <View style={styles.splitInfo}>
                    <Text style={[styles.splitLabel, themedStyles.splitLabel]}>
                        {split.label}
                    </Text>                  
                    <Text style={[styles.splitDistance, themedStyles.splitDistance]}>
                        {formatDistance(split.isKilometers ? split.distance * 0.621371 : split.distance)}
                    </Text>
                </View>
                
                <View style={styles.splitValues}>
                    {hasValue ? (
                        <>
                            <Text style={[styles.splitValue, themedStyles.splitValue]}>
                                {formatTime(splitValue)}
                            </Text>
                            {Boolean(segmentPace) && (
                                <View style={styles.splitPaceContainer}>
                                    <Text style={[
                                        isFaster ? themedStyles.paceFaster : isSlower ? themedStyles.paceSlower : themedStyles.paceNeutral
                                    ]}>
                                        {isFaster ? '↑ ' : isSlower ? '↓ ' : ''}{segmentPace}/mi
                                    </Text>
                                </View>
                            )}
                        </>
                    ) : (
                            <Text style={[styles.splitUnavailable, themedStyles.splitUnavailable]}>
                                Not Available
                            </Text>
                        )}
                </View>
            </View>
        );
    }

	const overallPlaceTotal = result.runnerType === RunnerType.Runner ? result.raceRunners : result.divisionRunners;

	return (
        <View style={styles.container}>
            {/* Runner Info Header */}
            <Card>
                <View style={styles.headerSection}>
                    <Text style={[styles.runnerName, themedStyles.runnerName]}>
                        {result.name}
                    </Text>
                    <Text style={[styles.bibNumber, themedStyles.bibNumber]}>
                        Bib #{result.bibNumber}
                    </Text>
                    <View style={styles.runnerMetaRow}>
                        <Text style={[styles.runnerMeta, themedStyles.runnerMeta]}>
                            {result.gender !== Gender.Unknown ? getGenderLabel(result.gender) + ' • ' : ''}Age {result.age}
                        </Text>
                        {result.runnerType !== 0 && (
                            <Text style={[styles.runnerType, themedStyles.runnerType]}>
                                {getRunnerTypeLabel(result.runnerType)}
                            </Text>
                        )}
                    </View>
                    {Boolean(result.hometown) && (
                        <Text style={[styles.hometown, themedStyles.hometown]}>
                            {result.hometown}
                        </Text>
                    )}
                </View>
            </Card>

            {/* Placement Stats Grid */}
            <View style={styles.statsGrid}>
                {/* Overall Placement */}
                {Boolean(result.overallPlace) && (
                    <Card style={styles.statTile}>
                        <View style={styles.statContent}>
                            <Text style={[styles.statLabel, themedStyles.statLabel]}>
                                Overall
							</Text>
                            <Text style={[styles.statPlace, themedStyles.statPlace]}>
                                {result.overallPlace}
                            </Text>
                            <Text style={[styles.statPercentage, themedStyles.statPercentage]}>
                                {calculatePercentage(result.overallPlace, overallPlaceTotal)}
                            </Text>
                            <Text style={[styles.statCount, themedStyles.statCount]}>
                                of {overallPlaceTotal} runners
							</Text>
                        </View>
                    </Card>
                )}

                {/* Gender Placement */}
                {Boolean(result.genderPlace) && Boolean(result.resultData?.rankings?.genderTotal) && (
                    <Card style={styles.statTile}>
                        <View style={styles.statContent}>
                            <Text style={[styles.statLabel, themedStyles.statLabel]}>
                                {getGenderLabel(result.gender)}
                            </Text>
                            <Text style={[styles.statPlace, themedStyles.statPlace]}>
                                {result.genderPlace}
                            </Text>
                            <Text style={[styles.statPercentage, themedStyles.statPercentage]}>
                                {calculatePercentage(
                                    result.genderPlace,
                                    result.resultData!.rankings!.genderTotal ?? undefined
                                )}
                            </Text>
                            <Text style={[styles.statCount, themedStyles.statCount]}>
                                of {result.resultData!.rankings!.genderTotal} {getGenderLabel(result.gender).toLowerCase()}s
							</Text>
                        </View>
                    </Card>
                )}

                {/* Division Placement */}
                {Boolean(result.divisionPlace) && (
                    <Card style={styles.statTile}>
                        <View style={styles.statContent}>
                            <Text style={[styles.statLabel, themedStyles.statLabel]}>
                                {division?.name || 'Division'}
                            </Text>
                            <Text style={[styles.statPlace, themedStyles.statPlace]}>
                                {result.divisionPlace}
                            </Text>
                            <Text style={[styles.statPercentage, themedStyles.statPercentage]}>
                                {calculatePercentage(result.divisionPlace, result.divisionRunners)}
                            </Text>
                            <Text style={[styles.statCount, themedStyles.statCount]}>
                                of {result.divisionRunners} runners
							</Text>
                        </View>
                    </Card>
                )}

                {/* Hometown Placement (from enrichment data) */}
                {Boolean(result.resultData?.rankings?.hometownPlace) && Boolean(result.hometown) && (
                    <Card style={styles.statTile}>
                        <View style={styles.statContent}>
                            <Text style={[styles.statLabel, themedStyles.statLabel]}>
                                Hometown
							</Text>
                            <Text style={[styles.statPlace, themedStyles.statPlace]}>
                                {result.resultData!.rankings!.hometownPlace}
                            </Text>
                            <Text style={[styles.statPercentage, themedStyles.statPercentage]}>
                                {calculatePercentage(result.resultData!.rankings!.hometownPlace ?? undefined, result.resultData!.rankings!.hometownTotal ?? undefined)}
                            </Text>
                            <Text style={[styles.statCount, themedStyles.statCount]}>
                                of {result.resultData!.rankings!.hometownTotal} from {result.hometown}
                            </Text>
                        </View>
                    </Card>
                )}
            </View>

			{/* Kill/Assassin Breakdown */}
			<PassStats result={result} />

            {/* Time Information */}
            <Card>
                <View style={styles.timeSection}>
                    <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>
                        Time Information
					</Text>
                    <View style={styles.timeGrid}>
                        <View style={styles.timeItem}>
                            <Text style={[styles.timeLabel, themedStyles.timeLabel]}>
                                Net Time
							</Text>
                            <Text style={[styles.timeValue, themedStyles.timeValue]}>
                                {formatTime(result.netTime)}
                            </Text>
                        </View>
                        <View style={styles.timeItem}>
                            <Text style={[styles.timeLabel, themedStyles.timeLabel]}>
                                Clock Time
							</Text>
                            <Text style={[styles.timeValue, themedStyles.timeValue]}>
                                {formatTime(result.clockTime)}
                            </Text>
                        </View>
                        <View style={styles.timeItem}>
                            <Text style={[styles.timeLabel, themedStyles.timeLabel]}>
                                Overall Pace
							</Text>
                            <Text style={[styles.timeValue, themedStyles.timeValue]}>
                                {formatTime(result.overallPace, true)}/mi
                            </Text>
                        </View>
                        {Boolean(result.startTime) && (
                            <View style={styles.timeItem}>
                                <Text style={[styles.timeLabel, themedStyles.timeLabel]}>
                                    Start Time
								</Text>
                                <Text style={[styles.timeValue, themedStyles.timeValue]}>
                                    {formatTime(result.startTime)}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Card>

            {/* Splits Section */}
            {hasSplits && (
                <Card>
                    <View style={styles.splitsAndPaceContainer}>
                        {/* Splits Column */}
                        <View style={styles.splitsColumn}>
                            <View style={styles.splitsSection}>
                                <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>
                                    Split Times
								</Text>
                                <View style={styles.splitsGrid}>
                                    {splitTimesWithFinish.map((split, index) => {
                                        return getSplitRow(splitTimesWithFinish, index);
                                    })}
                                </View>
                            </View>
                        </View>

                        {/* Pace Chart Column */}
                        <Card style={styles.paceChartColumn} allowPopout={true}>
                            <PaceChart
                                result={result}
                                splitTimes={splitTimes}
                                raceDistance={race.distance}
                            />
                        </Card>
                    </View>
                </Card>
            )}
        </View>
    );
};
