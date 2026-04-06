/**
 * CommunityEventPreview Component
 * 
 * Compact sidebar list showing upcoming community events on the home page.
 * Displays event title, next race date, location, participant count, and action buttons.
 * Manages its own participation and participants panel state internally.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Linking, Pressable } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { SectionHeader, Button } from '../../ui';
import { useAuth, useCommunityEvents } from '../../../hooks';
import { CommunityParticipationPanel } from '../communityParticipationPanel';
import { CommunityParticipantsPanel } from '../communityParticipantsPanel';
import { styles, getThemedStyles } from './CommunityEventPreview.styles';
import type { CommunityEventPreviewProps } from './CommunityEventPreview.types';
import type { CommunityEvent } from '../../../models';

/** Number of upcoming events to show on the home page */
const UPCOMING_EVENTS_COUNT = 3;

/**
 * Format a date string to a short display format (e.g. "Mar 15, 2026")
 */
function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Get the next upcoming race date from an event's races
 */
function getNextRaceDate(event: { races: { raceDate: string }[] }): string | null {
	const now = new Date();
	const upcoming = event.races
		.map(r => r.raceDate)
		.filter(d => new Date(d) >= now)
		.sort();
	return upcoming[0] ?? event.races[0]?.raceDate ?? null;
}

/**
 * Compact sidebar preview of upcoming community events
 */
export function CommunityEventPreview({
	onViewAll,
}: CommunityEventPreviewProps) {
	const { isAuthenticated, accessToken, isLoading: authLoading } = useAuth();
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);

	// Fetch upcoming community events
	const {
		upcomingEvents: events,
		loading,
		fetchUpcoming,
	} = useCommunityEvents({ accessToken });

	// Wait for auth to settle before fetching so the token is available
	useEffect(() => {
		if (!authLoading) {
			fetchUpcoming();
		}
	}, [authLoading]);

	// Panel state — managed internally
	const [participationPanelOpen, setParticipationPanelOpen] = useState(false);
	const [participationPanelEvent, setParticipationPanelEvent] = useState<CommunityEvent | null>(null);
	const [participantsPanelOpen, setParticipantsPanelOpen] = useState(false);
	const [participantsPanelEvent, setParticipantsPanelEvent] = useState<CommunityEvent | null>(null);

	const handleParticipate = useCallback((event: CommunityEvent) => {
		console.log('Participate in event', event.id);
		setParticipationPanelEvent(event);
		setParticipationPanelOpen(true);
	}, []);

	const handleViewParticipants = useCallback((event: CommunityEvent) => {
		setParticipantsPanelEvent(event);
		setParticipantsPanelOpen(true);
	}, []);

	const handleParticipationSaved = useCallback(() => {
		setParticipationPanelOpen(false);
		setParticipationPanelEvent(null);
		fetchUpcoming();
	}, [fetchUpcoming]);

	return (
		<View style={styles.container}>
			<SectionHeader title="Community Events" />

			{loading && (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="small" color={colors.primary} />
				</View>
			)}

			{!loading && events.length === 0 && (
				<Text style={[styles.emptyText, themedStyles.emptyText]}>
					No upcoming community events.
				</Text>
			)}

			{!loading && events.slice(0, UPCOMING_EVENTS_COUNT).map((event) => {
				const nextDate = getNextRaceDate(event);

				return (
					<View key={event.id} style={[styles.eventCard, themedStyles.eventCard]}>
						{event.link ? (
						<Pressable
							style={styles.titleLink}
							onPress={() => Linking.openURL(event.link!)}
						>
							{({ hovered }: { hovered: boolean }) => (
								<>
									<Text style={[styles.eventTitle, hovered ? themedStyles.eventTitleLinkHovered : themedStyles.eventTitleLink]} numberOfLines={1}>{event.title}</Text>
									<Feather name="external-link" size={14} color={colors.primary} />
								</>
							)}
						</Pressable>
						) : (
							<Text style={[styles.eventTitle, themedStyles.eventTitle]} numberOfLines={1}>
								{event.title}
							</Text>
						)}

						{nextDate && (
							<Text style={[styles.eventMeta, themedStyles.eventMeta]}>
								{formatDate(nextDate)} · {event.races.length} race{event.races.length !== 1 ? 's' : ''}
							</Text>
						)}

						{event.location && (
							<View style={styles.locationRow}>
								<Ionicons name="location-outline" size={12} color={colors.textSecondary} />
								<Text style={[styles.eventMeta, themedStyles.locationText]} numberOfLines={1}>
									{event.location}
								</Text>
							</View>
						)}

						<View style={styles.actionRow}>
							{isAuthenticated && (
								event.isCurrentUserGoing ? (
									<Pressable onPress={() => handleParticipate(event)}>
										<View style={[styles.goingBadge, themedStyles.goingBadge]}>
											<Ionicons name="checkmark-circle" size={14} color={colors.success} />
											<Text style={[styles.goingText, themedStyles.goingText]}>Going</Text>
										</View>
									</Pressable>
								) : (
									<Button
										title="I'm Going!"
										variant="secondary"
										padding="md"
										icon={<Ionicons name="hand-left-outline" size={14} color={colors.primary} />}
										onPress={() => handleParticipate(event)}
									/>
								)
							)}

							{event.participantCount > 0 && (
							<Pressable onPress={() => handleViewParticipants(event)}>
								{({ hovered }: { hovered: boolean }) => (
									<Text style={[styles.participantCount, hovered ? themedStyles.participantCountLinkHovered : themedStyles.participantCountLink]}>
										{event.participantCount} participant{event.participantCount !== 1 ? 's' : ''}
									</Text>
								)}
							</Pressable>
							)}
						</View>
					</View>
				);
			})}

			{!loading && events.length > 0 && (
				<Pressable style={styles.viewAllRow} onPress={onViewAll}>
					{({ hovered }: { hovered: boolean }) => (
						<Text style={[styles.viewAllText, hovered ? themedStyles.viewAllTextHovered : themedStyles.viewAllText]}>View All Community Events →</Text>
					)}
				</Pressable>
			)}

			{/* Participation Panel */}
			<CommunityParticipationPanel
				isOpen={participationPanelOpen}
				event={participationPanelEvent}
				onClose={() => { setParticipationPanelOpen(false); setParticipationPanelEvent(null); }}
				onSaved={handleParticipationSaved}
			/>

			{/* Participants Panel */}
			<CommunityParticipantsPanel
				isOpen={participantsPanelOpen}
				event={participantsPanelEvent}
				onClose={() => { setParticipantsPanelOpen(false); setParticipantsPanelEvent(null); }}
			/>
		</View>
	);
}
