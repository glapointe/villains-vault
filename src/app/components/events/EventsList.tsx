/**
 * EventsList Component
 * 
 * Home page variant of the events list with always-visible race distance badges.
 * Each event shows its races as tappable colored pills, allowing users to
 * see at a glance what distances are available and navigate directly.
 * 
 * Supports two modes:
 * - Default (home page): badges navigate to race pages
 * - Runner mode: badges navigate to the runner's result for that race (via relatedResults)
 * 
 * For admin operations, use the standard EventsList component instead.
 */

import React from 'react';
import { View, Text, Pressable, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

/** Typed wrapper to fix Animated.View children type issue with reanimated v4 */
const AnimatedContainer = Animated.View as React.ComponentType<any>;
import { useTheme } from '../../contexts/ThemeContext';
import { getThemedColors } from '../../theme';
import { Card, LoadingSpinner, MessageBox, DistanceBadge } from '../ui';
import { useEvents } from '../../hooks/useEvents';
import { formatDate } from '../../utils';
import type { RelatedRaceResults } from '../../models';
import { styles, getThemedStyles } from './EventsList.styles';

/**
 * Props for EventsList component
 */
export interface EventsListProps {
	/** Year to filter events by */
	selectedYear?: number;
	/** Related results for a runner — when provided, badges link to result pages instead of races */
	relatedResults?: RelatedRaceResults | null;
	/** The source race ID to exclude from badges (the race the runner is currently viewing) */
	sourceRaceId?: number;
}

/**
 * Format a date range from an array of race dates.
 * If all races are on the same date, shows a single date.
 * Otherwise shows "Jan 8 – 12, 2026" style range.
 */
function formatDateRange(raceDates: string[]): string {
	if (raceDates.length === 0) return '';
	
	const sorted = [...raceDates].sort();
	const first = sorted[0];
	const last = sorted[sorted.length - 1];

	if (first === last) {
		return formatDate(first, 'short');
	}

	const firstDate = new Date(first);
	const lastDate = new Date(last);

	// Same month/year — compact format
	if (
		firstDate.getMonth() === lastDate.getMonth() &&
		firstDate.getFullYear() === lastDate.getFullYear()
	) {
		const monthYear = lastDate.toLocaleDateString('en-US', {
			month: 'short',
			year: 'numeric',
		});
		return `${firstDate.getDate()} – ${lastDate.getDate()} ${monthYear}`;
	}

	// Different months
	return `${formatDate(first, 'short')} – ${formatDate(last, 'short')}`;
}

/**
 * EventsList Component
 * 
 * Displays events with always-visible race distance badges for the home page.
 */
export function EventsList({ selectedYear, relatedResults, sourceRaceId }: EventsListProps): React.ReactElement {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors, isDark);
	const router = useRouter();

	/** Build a lookup map from raceId → resultId using the relatedResults */
	const resultsByRaceId = React.useMemo(() => {
		const map = new Map<number, number | null>();
		if (!relatedResults) return map;
		for (const evt of relatedResults.events) {
			for (const race of evt.races) {
				map.set(race.raceId, race.resultId);
			}
		}
		return map;
	}, [relatedResults]);

	const isRunnerMode = !!relatedResults;

	/**
	 * Navigate to a result in a new tab (web) or in-app (native).
	 */
	const navigateToResult = (resultId: number): void => {
		const path = `/results/${resultId}`;
		if (Platform.OS === 'web' && typeof window !== 'undefined') {
			window.open(path, '_blank');
		} else {
			router.push(path);
		}
	};

	/**
	 * Navigate to a race page (default home-page behaviour).
	 */
	const navigateToRace = (raceId: number): void => {
		router.push(`/(tabs)/race/${raceId}`);
	};

	// In runner mode, derive the event list from relatedResults instead of fetching /events
	const { events: apiEvents, loading: apiLoading, error: apiError } = useEvents({
		selectedYear,
		fetchYearOptions: false,
		skipFetch: isRunnerMode,
	});

	// Build events from relatedResults when in runner mode
	// Only include races where the runner has a result (resultId != null),
	// and drop events that end up with no matching races.
	const runnerEvents = React.useMemo(() => {
		if (!relatedResults) return [];
		return relatedResults.events
			.map(evt => {
				const matchedRaces = evt.races
					.filter(r => r.resultId != null)
					.filter(r => !selectedYear || new Date(r.raceDate).getFullYear() === selectedYear);
				return {
					id: evt.eventId,
					name: evt.eventName,
					races: matchedRaces.map(r => ({
						id: r.raceId,
						name: r.raceName,
						distance: r.distance,
						raceDate: r.raceDate,
					})),
				};
			})
			.filter(evt => evt.races.length > 0);
	}, [relatedResults, selectedYear]);

	const events = isRunnerMode ? runnerEvents : apiEvents;
	const loading = isRunnerMode ? false : apiLoading;
	const error = isRunnerMode ? '' : apiError;

	// Loading state
	if (loading) {
		return <LoadingSpinner />;
	}

	// Error state
	if (error) {
		return (
			<View style={styles.container}>
				<MessageBox type="error" title="Error Loading Events" message={error} showIcon />
			</View>
		);
	}

	// Empty state
	if (events.length === 0) {
		return (
			<View style={styles.container}>
				<MessageBox
					type="info"
					title="No Events Found"
					message={selectedYear ? `No events found for ${selectedYear}` : 'No events available'}
					showIcon
				/>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.eventsList}>
				{events.map((event, index) => (
					<AnimatedContainer
						key={event.id}
						entering={FadeInDown.duration(400).delay(index * 100)}
					>
						<Card style={[styles.eventCard, themedStyles.eventCard]}>
							<Pressable
								onPress={() => {
									// Navigate to the first race if only one, otherwise just visual
									if (event.races.length === 1) {
										if (isRunnerMode) {
											const resultId = resultsByRaceId.get(event.races[0].id);
											if (resultId) navigateToResult(resultId);
										} else {
											navigateToRace(event.races[0].id);
										}
									}
								}}
								style={({ hovered }) => [
									styles.eventContent,
									event.races.length === 1 && styles.eventContentClickable,
									event.races.length === 1 && hovered && styles.eventContentHover,
								]}
								disabled={event.races.length !== 1}
							>
								{/* Event name */}
								<View style={styles.eventNameRow}>
									<Text style={[styles.eventName, themedStyles.eventName]}>
										{event.name}
									</Text>
									{event.races.length === 1 && (
										<Ionicons
											name="chevron-forward"
											size={18}
											color={colors.textTertiary}
											style={styles.chevron}
										/>
									)}
								</View>

								{/* Race distance badges */}
								<View style={styles.badgesRow}>
									{event.races
										.filter(race => race.id !== sourceRaceId)
										.map((race) => {
										if (isRunnerMode) {
											const resultId = resultsByRaceId.get(race.id);
											return (
												<DistanceBadge
													key={race.id}
													distance={race.distance}
													onPress={resultId ? () => navigateToResult(resultId) : undefined}
												/>
											);
										}
										return (
											<DistanceBadge
												key={race.id}
												distance={race.distance}
												onPress={() => navigateToRace(race.id)}
											/>
										);
									})}
								</View>

								{/* Date range */}
								<View style={styles.dateRow}>
									<Ionicons
										name="calendar-outline"
										size={14}
										color={colors.textSecondary}
									/>
									<Text style={[styles.dateText, themedStyles.dateText]}>
										{formatDateRange(event.races.map(r => r.raceDate))}
									</Text>
								</View>
							</Pressable>
						</Card>
					</AnimatedContainer>
				))}
			</View>
		</View>
	);
}
