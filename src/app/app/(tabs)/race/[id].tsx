/**
 * Race Dashboard Screen
 * 
 * Public race details view - accessible to all users.
 * Displays race information and results grid.
 */

import { useState, useEffect, useMemo, Suspense } from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { DistanceBadge, LoadingSpinner, MessageBox, SectionHeader } from '../../../components/ui';
import { RaceResultsGrid, RaceStatsDashboard, BulkKillChart, CourseMapViewer } from '../../../components/race';
import { Weather } from '../../../components/weather';
import { useAuth } from '../../../hooks';
import { api, setAuthToken } from '../../../services/api';
import type { Race, Event, RaceStats } from '../../../models';
import { formatDate } from '../../../utils';
import { styles, getThemedStyles } from '../../../styles/routes/race.styles';
import { ChatPromptBar } from '../../../components/chat';

/**
 * Race Dashboard Component
 * Dynamic route: /race/[id]
 */
export default function RaceDashboardScreen(): React.ReactElement {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { isDark } = useTheme();
    const colors = getThemedColors(isDark);
    const themedStyles = useMemo(() => getThemedStyles(colors), [colors]);
    const router = useRouter();

    const { isAuthenticated, accessToken } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);

    const [race, setRace] = useState<Race | null>(null);
    const [event, setEvent] = useState<Event | null>(null);
    const [raceStats, setRaceStats] = useState<RaceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check admin status (non-blocking – page loads for everyone)
    useEffect(() => {
        if (!isAuthenticated || !accessToken) return;
        setAuthToken(accessToken);
        api.users.getCurrentUser()
            .then(profile => setIsAdmin(profile.isAdmin))
            .catch(() => setIsAdmin(false));
    }, [isAuthenticated, accessToken]);

    // Fetch race data
    useEffect(() => {
        const fetchRace = async () => {
            if (!id) {
                setError('No race ID provided');
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const raceData = await api.races.getById(parseInt(id as string));
                setRace(raceData);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load race data');
            } finally {
                setLoading(false);
            }
        };

        fetchRace();
    }, [id]);

    // Fetch event data
    useEffect(() => {
        const fetchEvent = async () => {
            if (!race) return;

            try {
                const events = await api.events.getAll();
                const foundEvent = events.find(e => e.races.some(r => r.id === race.id));
                if (foundEvent) {
                    setEvent(foundEvent);
                }
            } catch (error) {
                console.error('Failed to load event:', error);
            }
        };

        fetchEvent();
    }, [race]);

    // Fetch race statistics
    useEffect(() => {
        const fetchStats = async () => {
            if (!id) return;

            try {
                const stats = await api.races.getStats(parseInt(id as string));
                setRaceStats(stats);
            } catch (error) {
                console.error('Failed to load race statistics:', error);
                // Don't set error state - stats are optional
            }
        };

        fetchStats();
    }, [id]);

    if (loading) {
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
                    title="Error Loading Race"
                    message={error}
                    showIcon
                />
            </ScrollView>
        );
    }

    if (!race) {
        return (
            <ScrollView style={styles.errorContainer}>
                <MessageBox
                    type="error"
                    title="Race Not Found"
                    message={`No race found with ID ${id}`}
                    showIcon
                />
            </ScrollView>
        );
    }

	const leftHeader = (
		<View style={styles.headerContentRow}>
			{/* Text section */}
			<View style={styles.headerContent}>
				{/* Event Name */}
				<Text style={[styles.eventName, themedStyles.eventName]}>
					{event?.name ?? "..."}
				</Text>

				{/* Race Title + sibling race pills (other races in this event) */}
				<View style={styles.raceTitleRow}>
					<Text style={[styles.raceTitle, themedStyles.raceTitle]}>
						{race.name}
					</Text>
					{event?.races
						.filter(r => r.id !== race.id)
						.map(r => (
							<DistanceBadge
								key={r.id}
								distance={r.distance}
								onPress={() => router.push(`/race/${r.id}`)}
								compact
							/>
						))
					}
				</View>

				{/* Race Date */}
				<Text style={[
					styles.raceDate,
					themedStyles.raceDate
				]}>
					{formatDate(race.raceDate)}
				</Text>
			</View>

			<CourseMapViewer raceId={race.id} />
		</View>
	);

    return (
        <ScrollView style={[styles.container, themedStyles.container]} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="always">
            <View style={[styles.content, themedStyles.content]}>
                {/* Race Header */}
				<SectionHeader
					isPageHeader
					leftContent={leftHeader}
					rightContent={isAdmin && Platform.OS === 'web' && (
						<View style={styles.adminToolbar}>
							<Suspense fallback={null}>
								<BulkKillChart race={race} />
							</Suspense>
						</View>
					)}
				/>

				{/* AI Chat Prompt Bar */}
				<View style={styles.promptContainer}>
					<ChatPromptBar
						mode="modal"
						context={{ raceId: race.id, pageName: 'race' }}
						placeholder={`Ask about ${race.name}...`}
					/>
				</View>

                {/* Race Statistics Dashboard - Lazy loaded */}
                {raceStats && (
                    <View style={styles.statsContainer}>
                        <Suspense fallback={<LoadingSpinner />}>
							<RaceStatsDashboard stats={raceStats} race={race} />
						</Suspense>
                    </View>
                )}

                {/* Weather Data */}
                <Weather raceId={race.id} />


                {/* Results Grid with Page Padding */}
                <View style={styles.gridContainer}>
                    <RaceResultsGrid
                        race={race}
                        initialPageSize={50}
                        pageSizeOptions={[25, 50, 100, 200, 500]}
                        onResultPress={(result) => router.push(`/results/${result.id}`)}
                    />
                </View>
            </View>

        </ScrollView>
    );
}
