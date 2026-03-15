/**
 * AdminEventsList Component
 * 
 * Generic component for displaying events with expandable races.
 * Supports year filtering, admin mode with edit/delete/reparse actions.
 * Enhanced with animated chevrons, distance badges, race count badges,
 * staggered entry animations, and smooth expand/collapse transitions.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
	Easing,
	FadeIn, FadeInDown, useAnimatedStyle,
	useSharedValue,
	withTiming
} from 'react-native-reanimated';
import { useDialog } from '../../contexts/DialogContext';
import { useTheme } from '../../contexts/ThemeContext';
import { CourseMapPanel, EventSubmissionPanel, JobStatusPanel } from '../../features/admin';
import { useEvents } from '../../hooks/useEvents';
import type { SubmitEventResponse } from '../../models';
import { api, setAuthToken } from '../../services/api';
import { getThemedColors } from '../../theme';
import { formatDate } from '../../utils';
import { Button, Card, Dropdown, LoadingSpinner, MessageBox } from '../ui';
import { getThemedStyles, styles } from './AdminEventsList.styles';

/** Typed wrapper to fix Animated.View children type issue with reanimated v4 */
const AnimatedContainer = Animated.View as React.ComponentType<any>;

/**
 * Props for AdminEventsList component
 */
export interface AdminEventsListProps {
    /** Whether to show the year filter dropdown */
    showYearFilter?: boolean;
    /** Pre-selected year (if undefined and filter hidden, shows all) */
    selectedYear?: number;
    /** Whether to enable admin features (requires user to be admin) */
    adminMode?: boolean;
    /** User's admin status */
    isAdmin?: boolean;
    /** Access token for admin operations */
    accessToken?: string;
    /** Optional callback when a race is clicked */
    onRaceClick?: (raceId: number) => void;
}

/**
 * Animated chevron that rotates between collapsed (right) and expanded (down)
 */
function AnimatedChevron({ expanded, color }: { expanded: boolean; color: string }) {
	const rotation = useSharedValue(expanded ? 90 : 0);

	React.useEffect(() => {
		rotation.value = withTiming(expanded ? 90 : 0, {
			duration: 250,
			easing: Easing.inOut(Easing.ease),
		});
	}, [expanded]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotation.value}deg` }],
	}));

	const AnimView = Animated.View as React.ComponentType<any>;

	return (
		<AnimView style={[styles.expandIconContainer, animatedStyle]}>
			<Ionicons name="chevron-forward" size={18} color={color} />
		</AnimView>
	);
}

/**
 * AdminEventsList Component
 * 
 * Displays a list of events with expandable races and optional admin controls.
 */
export const AdminEventsList: React.FC<AdminEventsListProps> = ({
    showYearFilter = false,
    selectedYear,
    adminMode = false,
    isAdmin = false,
    accessToken,
    onRaceClick,
}): React.ReactElement => {
    const { isDark } = useTheme();
    const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors, isDark);
    const router = useRouter();
    const { showConfirm } = useDialog();

    // Use shared events hook
    const {
        events,
        loading,
        error,
        currentYear,
        setCurrentYear,
        yearOptions,
        refetchEvents,
    } = useEvents({
        selectedYear,
        fetchYearOptions: showYearFilter,
        accessToken,
    });

    // UI state
    const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());

    // Admin state
    const [editingEventUrl, setEditingEventUrl] = useState<string>('');
    const [isEditPanelOpen, setIsEditPanelOpen] = useState<boolean>(false);
    const [isJobsPanelOpen, setIsJobsPanelOpen] = useState<boolean>(false);
    const [jobIds, setJobIds] = useState<number[]>([]);
    const [isCourseMapPanelOpen, setIsCourseMapPanelOpen] = useState<boolean>(false);
    const [courseMapRaceId, setCourseMapRaceId] = useState<number>(0);
    const [courseMapRaceName, setCourseMapRaceName] = useState<string>('');

	/**
	 * Toggle event expansion
	 */
    const toggleEvent = (eventId: number): void => {
        const newExpanded = new Set(expandedEvents);
        if (newExpanded.has(eventId)) {
            newExpanded.delete(eventId);
        } else {
            newExpanded.add(eventId);
        }
        setExpandedEvents(newExpanded);
    };

	/**
	 * Handle race click - either custom callback or navigate to race page
	 */
    const handleRaceClick = (raceId: number): void => {
        if (onRaceClick) {
            onRaceClick(raceId);
        } else {
            router.push(`/(tabs)/race/${raceId}`);
        }
    };

	/**
	 * Handle year filter change
	 */
    const handleYearChange = (year: number): void => {
        setCurrentYear(year === 0 ? undefined : year);
    };

	/**
	 * Handle edit event - open EventSubmissionPanel with event URL
	 */
    const handleEditEvent = (eventUrl: string): void => {
        setEditingEventUrl(eventUrl);
        setIsEditPanelOpen(true);
    };

	/**
	 * Handle reparse race - show confirmation dialog and process if confirmed
	 */
    const handleReparseRace = async (raceId: number, raceName: string): Promise<void> => {
        if (!accessToken) return;

        const confirmed = await showConfirm({
            title: 'Reparse Race',
            message: `Are you sure you want to reparse "${raceName}"?`,
            submitText: 'Reparse',
            cancelText: 'Cancel',
            children: (
                <MessageBox
                    type="info"
                    title="Reparse Job"
                    message="This will create a new parsing job to reprocess all results for this race. The job will run in the background and may take several minutes to complete."
                    showIcon
                />
            ),
        });

        if (!confirmed) return;

        try {
            setAuthToken(accessToken);
            const jobId = await api.races.reparseRace(raceId);
            setJobIds([jobId]);
            setIsJobsPanelOpen(true);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to reparse race');
        }
    };

	/**
	 * Handle recalculate race stats - asks if user wants to recalculate individual result statistics
	 */
    const handleRecalculateRace = async (raceId: number, raceName: string): Promise<void> => {
        if (!accessToken) return;

        const recalculateIndividualResults = await showConfirm({
            title: 'Recalculate Statistics',
            message: `Do you want to recalculate individual result statistics for "${raceName}"?`,
            submitText: 'Yes, Recalculate Individual Stats',
            cancelText: 'No, Race Stats Only',
            children: (
                <MessageBox
                    type="info"
                    title="Individual Result Statistics Recalculation"
                    message="Recalculating individual result statistics will compare all runners and update statistics for each result. This runs as a background job and may take several minutes for large races. Choosing 'No' will only regenerate race statistics without recalculating individual stats."
                    showIcon
                />
            ),
        });

        try {
            setAuthToken(accessToken);
            const result = await api.races.generateStats(raceId, recalculateIndividualResults);
            if (result.jobId) {
                setJobIds([result.jobId]);
                setIsJobsPanelOpen(true);
            } else {
                alert('Statistics regenerated successfully.');
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to recalculate stats');
        }
    };

	/**
	 * Handle delete race - show confirmation dialog and delete if confirmed
	 */
    const handleDeleteRaceClick = async (raceId: number, raceName: string): Promise<void> => {
        if (!accessToken) return;

        const confirmed = await showConfirm({
            title: 'Delete Race',
            message: `Are you sure you want to delete "${raceName}"?`,
            submitText: 'Delete',
            cancelText: 'Cancel',
            children: (
                <MessageBox
                    type="warning"
                    title="Warning"
                    message="All race results will be permanently deleted. This action cannot be undone."
                    showIcon
                />
            ),
        });

        if (!confirmed) return;

        try {
            setAuthToken(accessToken);
            await api.races.delete(raceId);
            refetchEvents(); // Reload events
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete race');
        }
    };

	/**
	 * Handle course map click - open the CourseMapPanel for a race
	 */
    const handleCourseMapClick = (raceId: number, raceName: string): void => {
        setCourseMapRaceId(raceId);
        setCourseMapRaceName(raceName);
        setIsCourseMapPanelOpen(true);
    };

	/**
	 * Handle delete event - show confirmation dialog and delete if confirmed
	 */
    const handleDeleteEventClick = async (eventId: number, eventName: string): Promise<void> => {
        if (!accessToken) return;

        const confirmed = await showConfirm({
            title: 'Delete Event',
            message: `Are you sure you want to delete "${eventName}"?`,
            submitText: 'Delete',
            cancelText: 'Cancel',
            children: (
                <MessageBox
                    type="warning"
                    title="Warning"
                    message="All races and their results will be permanently deleted. This action cannot be undone."
                    showIcon
                />
            ),
        });

        if (!confirmed) return;

        try {
            setAuthToken(accessToken);
            await api.events.delete(eventId);
            refetchEvents(); // Reload events
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete event');
        }
    };

	/**
	 * Handle successful edit submission
	 */
    const handleEditJobsCreated = (response: SubmitEventResponse): void => {
        setJobIds(response.jobIds);
        setIsEditPanelOpen(false);
        setIsJobsPanelOpen(true);
        refetchEvents(); // Reload events after edit
    };



    // Render loading state
    if (loading) {
        return <LoadingSpinner />;
    }

    // Render error state
    if (error) {
        return (
            <View style={styles.container}>
                <MessageBox type="error" title="Error Loading Events" message={error} showIcon />
            </View>
        );
    }

    // Render empty state
    if (events.length === 0) {
        return (
            <View style={styles.container}>
                <MessageBox
                    type="info"
                    title="No Events Found"
                    message={currentYear ? `No events found for ${currentYear}` : 'No events available'}
                    showIcon
                />
            </View>
        );
    }

    return (
        <>
            <View style={styles.container}>
                {/* Year Filter */}
                {showYearFilter && yearOptions.length > 0 && (
                    <View style={styles.filterSection}>
                        <Text style={[styles.filterLabel, themedStyles.filterLabel]}>Filter by Year</Text>
                        <Dropdown
                            value={currentYear || 0}
                            options={yearOptions}
                            onChange={handleYearChange}
                            placeholder="Select year..."
                        />
                    </View>
                )}

                {/* Events List */}
                <View style={styles.eventsList}>
                    {events.map((event, index) => (
                        <AnimatedContainer
                            key={event.id}
                            entering={FadeInDown.duration(400).delay(index * 100)}
                        >
                            <Card style={[styles.eventCard, themedStyles.eventCard]}>
                                {/* Admin Toolbar */}
                                {adminMode && isAdmin && (
                                    <View style={styles.eventToolbar}>
                                        <Button
                                            title="Edit"
                                            variant="secondary"
                                            onPress={() => handleEditEvent(event.trackShackUrl)}
                                            style={styles.adminButton}
                                        />
                                        <Button
                                            title="Delete"
                                            variant="danger"
                                            onPress={() => handleDeleteEventClick(event.id, event.name)}
                                            style={styles.adminButton}
                                        />
                                    </View>
                                )}

                                {/* Event Header */}
                                <Pressable
                                    onPress={() => toggleEvent(event.id)}
                                    style={({ hovered }) => [
                                        styles.eventHeader,
                                        hovered && styles.eventHeaderHover,
                                    ]}
                                >
                                    <View style={styles.eventHeaderContent}>
                                        <View style={styles.eventNameRow}>
                                            <Text style={[styles.eventName, themedStyles.eventName]}>
                                                {event.name}
                                            </Text>
                                            <View style={[styles.raceCountBadge, themedStyles.raceCountBadge]}>
                                                <Text style={[styles.raceCountText, themedStyles.raceCountText]}>
                                                    {event.races.length} race{event.races.length !== 1 ? 's' : ''}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                    <AnimatedChevron
                                        expanded={expandedEvents.has(event.id)}
                                        color={colors.textSecondary}
                                    />
                                </Pressable>

                                {/* Expanded Races */}
                                {expandedEvents.has(event.id) && (
                                    <AnimatedContainer
                                        entering={FadeIn.duration(250)}
                                    >
                                        <View style={styles.racesContainer}>
                                                {event.races.map((race, raceIndex) => (
                                                    <AnimatedContainer
                                                        key={race.id}
                                                        entering={FadeInDown.duration(300).delay(raceIndex * 60)}
                                                    >
                                                        <View
                                                            style={[
                                                                styles.raceCard,
                                                                themedStyles.raceCard,
                                                            ]}
                                                        >
                                                            <View style={styles.raceContentWrapper}>
                                                                <Pressable
                                                                    onPress={() => handleRaceClick(race.id)}
                                                                    style={({ hovered }) => [
                                                                        styles.raceContent,
                                                                        hovered && styles.raceContentHover,
                                                                    ]}
                                                                >
                                                                    <View style={styles.raceNameRow}>
                                                                        <Text style={[styles.raceName, themedStyles.raceName]}>
                                                                            {race.name}
                                                                        </Text>
                                                                    </View>
                                                                    <View style={styles.raceDetailsRow}>
                                                                        <Ionicons
                                                                            name="calendar-outline"
                                                                            size={14}
                                                                            color={colors.textSecondary}
                                                                        />
                                                                        <Text style={[styles.raceDetails, themedStyles.raceDetails]}>
                                                                            {formatDate(race.raceDate, 'short')}
                                                                        </Text>
                                                                    </View>
                                                                </Pressable>

                                                                {/* Admin Actions */}
                                                                {adminMode && isAdmin && (
                                                                    <View style={styles.raceActions}>
                                                                        <Button
                                                                            icon={<Ionicons name="map-outline" size={16} color={colors.textPrimary} />}
                                                                            variant="secondary"
                                                                            onPress={() => handleCourseMapClick(race.id, race.name)}
                                                                            style={styles.adminButton}
                                                                        />
                                                                        <Button
                                                                            icon={<Ionicons name="calculator-outline" size={16} color={colors.textPrimary} />}
                                                                            variant="secondary"
                                                                            onPress={() => handleRecalculateRace(race.id, race.name)}
                                                                            style={styles.adminButton}
                                                                        />
                                                                        <Button
                                                                            icon={<Ionicons name="refresh-outline" size={16} color={colors.textPrimary} />}
                                                                            variant="secondary"
                                                                            onPress={() => handleReparseRace(race.id, race.name)}
                                                                            style={styles.adminButton}
                                                                        />
                                                                        <Button
                                                                            variant="danger"
																			icon={<Ionicons name="trash-outline" size={16} color={colors.textPrimary} />}
                                                                            onPress={() => handleDeleteRaceClick(race.id, race.name)}
                                                                            style={styles.adminButton}
                                                                        />
                                                                    </View>
                                                                )}
                                                            </View>
                                                        </View>
                                                    </AnimatedContainer>
                                                ))}
                                            </View>
                                        </AnimatedContainer>
                                    )}
                            </Card>
                        </AnimatedContainer>
                    ))}
                </View>
            </View>

            {/* Event Submission Panel for Editing */}
            {accessToken && (
                <EventSubmissionPanel
                    isOpen={isEditPanelOpen}
                    onClose={() => {
                        setIsEditPanelOpen(false);
                        setEditingEventUrl('');
                    }}
                    onJobsCreated={handleEditJobsCreated}
                    accessToken={accessToken}
                    eventUrl={editingEventUrl}
                />
            )}

            {/* Job Status Panel */}
            {accessToken && (
                <JobStatusPanel
                    isOpen={isJobsPanelOpen}
                    onClose={() => setIsJobsPanelOpen(false)}
                    jobIds={jobIds}
                    accessToken={accessToken}
                />
            )}

            {/* Course Map Panel */}
            {accessToken && (
                <CourseMapPanel
                    isOpen={isCourseMapPanelOpen}
                    onClose={() => setIsCourseMapPanelOpen(false)}
                    raceId={courseMapRaceId}
                    raceName={courseMapRaceName}
                    accessToken={accessToken}
                />
            )}
        </>
    );
};
