/**
 * Result Dashboard Screen
 * 
 * Public race result details view - accessible to all users.
 * Displays race result information for a single runner.
 */

import { useState, useEffect, useMemo, Suspense } from 'react';
import type { ReactNode } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { Card, LoadingSpinner, MessageBox, Dropdown, Panel, DistanceBadge, SectionHeader } from '../../../components/ui';
import { ResultDetailsCard, KillChart, RaceResultsGrid, FollowButton } from '../../../components/race';
import { EventsList } from '../../../components/events';
import { api } from '../../../services/api';
import { Race, Event, RaceResultDetailed, ClosestResults, RaceResultColumn } from '../../../models';
import type { RelatedRaceResults } from '../../../models';
import { formatDate } from '../../../utils';
import { styles, getThemedStyles } from '../../../styles/routes/raceResults.styles';
import { ChatPromptBar } from '../../../components/chat';

/**
 * Result Dashboard Component
 * Dynamic route: /results/[id]
 */
export default function ResultDashboardScreen(): React.ReactElement {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { isDark } = useTheme();
    const colors = getThemedColors(isDark);
    const themedStyles = useMemo(() => getThemedStyles(colors, isDark), [colors, isDark]);
    const router = useRouter();

    const [raceResult, setRaceResult] = useState<RaceResultDetailed | null>(null);
    const [race, setRace] = useState<Race | null>(null);
    const [event, setEvent] = useState<Event | null>(null);
    const [loadingRace, setLoadingRace] = useState(true);
    const [loadingResults, setLoadingResults] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fieldSize, setFieldSize] = useState(10);
    const [closestResults, setClosestResults] = useState<ClosestResults | null>(null);
    const [loadingClosest, setLoadingClosest] = useState(false);
    const [relatedResults, setRelatedResults] = useState<RelatedRaceResults | null>(null);

    // All-events related results panel state
    const [allRelatedResults, setAllRelatedResults] = useState<RelatedRaceResults | null>(null);
    const [loadingAllRelated, setLoadingAllRelated] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);

    // Year filter for the all-events panel — default to the race year once loaded
    const raceYear = race ? new Date(race.raceDate).getFullYear() : undefined;
    const [currentYear, setCurrentYear] = useState<number | undefined>(undefined);

    // Sync default year to the race year once loaded
    useEffect(() => {
        if (raceYear !== undefined && currentYear === undefined) {
            setCurrentYear(raceYear);
        }
    }, [raceYear]);

    // Derive year options from allRelatedResults — only years with actual results
    const yearOptions = useMemo(() => {
        if (!allRelatedResults) return [];
        const years = new Set<number>();
        for (const evt of allRelatedResults.events) {
            for (const race of evt.races) {
                if (race.resultId != null) {
                    years.add(new Date(race.raceDate).getFullYear());
                }
            }
        }
        const sorted = [...years].sort((a, b) => b - a);
        return [
            { label: 'All Years', value: 0 },
            ...sorted.map(y => ({ label: String(y), value: y })),
        ];
    }, [allRelatedResults]);

    const handleYearChange = (year: number): void => {
        setCurrentYear(year === 0 ? undefined : year);
    };

    const renderRaceTitleContent = (hovered: boolean): ReactNode => (
        <Text style={[
            styles.raceTitle,
            themedStyles.raceTitle,
            hovered && themedStyles.raceTitleUnderline
        ]}>
            {race?.name || 'Loading race name...'}
        </Text>
    );

    // Fetch race result data on load by id.
    useEffect(() => {
        const fetchRaceResult = async () => {
            if (!id) {
                setError('No race result ID provided');
                setLoadingResults(false);
                return;
            }

            setLoadingResults(true);
            try {
                const raceResultData = await api.raceResults.getById(parseInt(id as string));
                setRaceResult(raceResultData);
                setError(null);
            } catch (err) {
                const status = (err as { response?: { status?: number } })?.response?.status;
                if (status === 404) {
                    setError(`No race result found with ID ${id}`);
                } else {
                    setError(err instanceof Error ? err.message : 'Failed to load race result data');
                }
            } finally {
                setLoadingResults(false);
            }
        };

        fetchRaceResult();
    }, [id]);

    // Fetch race data only if we have a race result (to get the raceId)
    useEffect(() => {
        const fetchRace = async () => {
            if (!raceResult) {
                return;
            }

            setLoadingRace(true);
            try {
                const race = await api.races.getById(raceResult.raceId);
                setRace(race);
                const event = race.event;
                if (event != null) {
                    setEvent(event);
                }
            } catch (err) {
				console.error('Failed to load race:', err);
            } finally {
                setLoadingRace(false);
            }
        };

        fetchRace();
    }, [raceResult]);

    // Fetch closest results when race result or field size changes
    useEffect(() => {
        const fetchClosestResults = async () => {
            if (!raceResult) return;

            setLoadingClosest(true);
            try {
                const closest = await api.raceResults.getClosestResults(raceResult.id, fieldSize);
                setClosestResults(closest);
            } catch (error) {
                console.error('Failed to load closest results:', error);
            } finally {
                setLoadingClosest(false);
            }
        };

        fetchClosestResults();
    }, [raceResult, fieldSize]);

    // Fetch related results for same runner in sibling races within the event
    useEffect(() => {
        const fetchRelatedResults = async () => {
            if (!raceResult || !event) return;

            try {
                const related = await api.raceResults.getRelatedResults(raceResult.id, event.id);
                setRelatedResults(related);
            } catch (error) {
                console.error('Failed to load related results:', error);
            }
        };

        fetchRelatedResults();
    }, [raceResult, event]);

    // Fetch all-events related results when the panel is opened
    useEffect(() => {
        const fetchAllRelated = async () => {
            if (!panelOpen || !raceResult) return;
            // Only fetch once
            if (allRelatedResults) return;

            setLoadingAllRelated(true);
            try {
                const related = await api.raceResults.getRelatedResults(raceResult.id);
                setAllRelatedResults(related);
            } catch (error) {
                console.error('Failed to load all related results:', error);
            } finally {
                setLoadingAllRelated(false);
            }
        };

        fetchAllRelated();
    }, [panelOpen, raceResult]);

    if (loadingRace || loadingResults) {
        return (
            <View style={styles.loadingContainer}>
                <LoadingSpinner size="large" />
            </View>
        );
    }

    if (error) {
        return (
            <ScrollView style={styles.errorContainer}>
                <MessageBox
                    type="error"
                    title="Error Loading Race Result"
                    message={error}
                    showIcon
                />
            </ScrollView>
        );
    }

    if ((!race || !raceResult) && !loadingRace && !loadingResults) {
        return (
            <ScrollView style={styles.errorContainer}>
                <MessageBox
                    type="error"
                    title="Race Result Not Found"
                    message={`No race result found with ID ${id}`}
                    showIcon
                />
            </ScrollView>
        );
    }
	if (!race || !raceResult) { return <></>; }

	const leftHeader = (
		<View style={styles.headerContent}>
			{/* Event Name */}
			{Boolean(event) && (
				<Text style={[styles.eventName, themedStyles.eventName]}>
					{event?.name}
				</Text>
			)}

			{/* Race Name with Selector */}
			{(Platform.OS === 'web' ? (
				<View style={styles.raceTitleRow}>
					<Pressable
						onPress={() => router.push(`/race/${race.id}`)}
					>
						{({ hovered }: { hovered: boolean }): ReactNode => renderRaceTitleContent(hovered)}
					</Pressable>
					{relatedResults?.events[0]?.races.filter(r => r.resultId != null).map(r => (
						<DistanceBadge
							key={r.raceId}
							distance={r.distance}
							onPress={r.resultId ? () => router.push(`/results/${r.resultId}`) : undefined}
							compact
						/>
					))}
					{relatedResults && (
						<Pressable
							onPress={() => setPanelOpen(true)}
							style={({ hovered }: { hovered: boolean }) => [
								styles.allEventsButton,
								themedStyles.allEventsButton,
								hovered && themedStyles.allEventsButtonHover,
							]}
						>
							<Ionicons name="albums-outline" size={12} color={colors.textInverse} />
							<Text style={[styles.allEventsButtonText, themedStyles.allEventsButtonText]}>All Events</Text>
						</Pressable>
					)}
				</View>
			) : (
				<View style={styles.raceTitleRow}>
					<Pressable onPress={() => router.push(`/race/${race.id}`)}>
						{renderRaceTitleContent(false)}
					</Pressable>
					{relatedResults?.events[0]?.races.map(r => (
						<DistanceBadge
							key={r.raceId}
							distance={r.distance}
							onPress={r.resultId ? () => router.push(`/results/${r.resultId}`) : undefined}
							compact
						/>
					))}
					{relatedResults && (
						<Pressable
							onPress={() => setPanelOpen(true)}
							style={[styles.allEventsButton, themedStyles.allEventsButton]}
						>
							<Ionicons name="albums-outline" size={14} color={colors.textInverse} />
							<Text style={[styles.allEventsButtonText, themedStyles.allEventsButtonText]}>All Events</Text>
						</Pressable>
					)}
				</View>
			)) as any}
			<Text style={[
				styles.raceDate,
				themedStyles.raceDate
			]}>
				{formatDate(race.raceDate)}
			</Text>
		</View>
	);
	
    return (
		<>
			<ScrollView style={[styles.container, themedStyles.container]} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="always">
				<View style={[styles.content, themedStyles.content]}>
					{/* Race Result Header with Event and Race Name */}
					<SectionHeader
						isPageHeader
						leftContent={leftHeader}
						rightContent={<View style={styles.headerActions}>
							{/* Follow/Unfollow Button */}
							<FollowButton raceResultId={raceResult.id} />
						</View>}
					/>

					{/* AI Chat Prompt Bar */}
					<View style={styles.promptContainer}>
						<ChatPromptBar
							mode="modal"
							context={{ resultId: raceResult.id, raceId: race.id, runnerName: raceResult.name, pageName: 'results' }}
							placeholder={`Ask about ${raceResult.name}'s results...`}
						/>
					</View>

					{/* Result Details Card */}
					<View style={styles.detailsContainer}>
						<ResultDetailsCard
							race={race}
							result={raceResult}
						/>
					</View>

					{/* Kill Chart - Lazy loaded */}
					<View style={styles.chartContainer}>
						<Suspense fallback={<LoadingSpinner />}>
							<KillChart
								race={race}
								evaluatedRunner={raceResult}
							/>
						</Suspense>
					</View>

					{/* Closest Results Section */}
					<View style={styles.closestResultsContainer}>
						<Card>
							<View style={styles.closestResultsHeader}>
								<Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>
									Closest Starters & Finishers
								</Text>
								<View style={styles.fieldSizeControl}>
									<Text style={[styles.fieldSizeLabel, themedStyles.fieldSizeLabel]}>Show:</Text>
									<View style={styles.fieldSizeDropdown}>
										<Dropdown
											value={fieldSize}
											options={[
												{ label: '5', value: 5 },
												{ label: '10', value: 10 },
												{ label: '20', value: 20 },
												{ label: '50', value: 50 },
												{ label: '100', value: 100 },
											]}
											onChange={(value: number) => setFieldSize(value)}
										/>
									</View>
								</View>
							</View>

							{loadingClosest ? (
								<View style={styles.loadingContainer}>
									<LoadingSpinner size="large" />
									<Text style={[styles.loadingText, themedStyles.loadingText]}>Loading closest results...</Text>
								</View>
							) : closestResults ? (
								<View style={styles.gridsContainer}>
									{/* Closest Starters Grid */}
									<View style={styles.gridWrapper}>
										<Text style={[styles.gridTitle, themedStyles.gridTitle]}>Closest Starters</Text>
										<RaceResultsGrid
											race={race}
											compareResult={raceResult}
											compareType="start"
											results={closestResults.closestStarters}
											initialPageSize={5}
											pageSizeOptions={[5, 10, 20, 50]}
											hideStatusBar={false}
											defaultSortField={RaceResultColumn.TimeDifference}
											onResultPress={(result) => router.push(`/results/${result.id}`)}
										/>
									</View>

									{/* Closest Finishers Grid */}
									<View style={styles.gridWrapper}>
										<Text style={[styles.gridTitle, themedStyles.gridTitle]}>Closest Finishers</Text>
										<RaceResultsGrid
											race={race}
											compareResult={raceResult}
											compareType="finish"
											results={closestResults.closestFinishers}
											initialPageSize={5}
											pageSizeOptions={[5, 10, 20, 50]}
											hideStatusBar={false}
											defaultSortField={RaceResultColumn.TimeDifference}
											onResultPress={(result) => router.push(`/results/${result.id}`)}
										/>
									</View>
								</View>
							) : null}
						</Card>
					</View>
				</View>
			</ScrollView>

			{/* All Events Panel */}
			<Panel
				isOpen={panelOpen}
				onClose={() => setPanelOpen(false)}
				headerTitle={`${raceResult.name} — Race History`}
				width="large"
			>
				<View style={styles.panelContent}>
					{!loadingAllRelated && <View style={styles.panelYearFilter}>
						<Text style={[styles.panelYearLabel, themedStyles.fieldSizeLabel]}>Year:</Text>
						<View style={styles.panelYearDropdown}>
							<Dropdown
								value={currentYear ?? 0}
								options={yearOptions}
								onChange={handleYearChange}
							/>
						</View>
					</View>}
					{(loadingAllRelated || !allRelatedResults) ? (
						<View style={styles.loadingContainer}>
							<LoadingSpinner size="large" />
							<Text style={[styles.loadingText, themedStyles.loadingText]}>Loading race history...</Text>
						</View>
					) : (
						<EventsList
							selectedYear={currentYear}
							relatedResults={allRelatedResults}
							sourceRaceId={race.id}
						/>
					)}
				</View>
			</Panel>
		</>
    );
}
