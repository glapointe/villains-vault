/**
 * CommunityParticipantsPanel Component
 *
 * Read-only panel showing all participants for a community event,
 * grouped by race. Displays badges for DLS, Virtual, Challenge,
 * and Spectator, plus optional notes.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { Panel, LoadingSpinner } from '../../ui';
import { useCommunityEvents } from '../../../hooks';
import { styles, getThemedStyles } from './CommunityParticipantsPanel.styles';
import type { CommunityParticipantsPanelProps } from './CommunityParticipantsPanel.types';
import type { CommunityParticipation, CommunityRace } from '../../../models';

/** Format a date string for display */
function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Format distance with unit */
function formatDistance(distance: number, isKilometers: boolean): string {
	const unit = isKilometers ? 'km' : 'mi';
	return `${distance}${unit}`;
}

/** Participant data grouped by race */
interface RaceParticipantGroup {
	race: CommunityRace;
	participants: CommunityParticipation[];
}

/**
 * Read-only panel displaying all participants for a community event
 */
export function CommunityParticipantsPanel({
	isOpen,
	event,
	onClose,
}: CommunityParticipantsPanelProps): React.ReactElement {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const { getParticipants } = useCommunityEvents({});

	const [groups, setGroups] = useState<RaceParticipantGroup[]>([]);
	const [loading, setLoading] = useState(false);
	const [totalCount, setTotalCount] = useState(0);

	const loadParticipants = useCallback(async (eventId: number, races: CommunityRace[]) => {
		setLoading(true);
		try {
			const participations = await getParticipants(eventId);
			// Group by race
			const raceMap = new Map<number, CommunityParticipation[]>();
			for (const p of participations) {
				const list = raceMap.get(p.communityRaceId) ?? [];
				list.push(p);
				raceMap.set(p.communityRaceId, list);
			}

			const sortedRaces = [...races].sort(
				(a, b) => new Date(a.raceDate).getTime() - new Date(b.raceDate).getTime()
			);

			const result: RaceParticipantGroup[] = sortedRaces.map((race) => ({
				race,
				participants: raceMap.get(race.id) ?? [],
			}));

			setGroups(result);

			// Count distinct users
			const userIds = new Set(participations.map((p) => p.userId));
			setTotalCount(userIds.size);
		} catch {
			setGroups([]);
			setTotalCount(0);
		} finally {
			setLoading(false);
		}
	}, [getParticipants]);

	useEffect(() => {
		if (isOpen && event) {
			loadParticipants(event.id, event.races);
		} else {
			setGroups([]);
			setTotalCount(0);
		}
	}, [isOpen, event]);

	return (
		<Panel
			isOpen={isOpen}
			onClose={onClose}
			headerTitle={event?.title ?? 'Participants'}
			width="medium"
		>
			<ScrollView>
				<View style={styles.container}>
					{loading ? (
						<View style={styles.loadingContainer}>
							<LoadingSpinner size="small" />
						</View>
					) : totalCount === 0 ? (
						<Text style={[styles.emptyText, themedStyles.emptyText]}>
							No participants yet — be the first!
						</Text>
					) : (
						<>
							<Text style={[styles.countText, themedStyles.countText]}>
								{totalCount} {totalCount === 1 ? 'person' : 'people'} participating
							</Text>

							{groups.map((group) => (
								<View key={group.race.id} style={styles.raceGroup}>
									<Text style={[styles.raceGroupTitle, themedStyles.raceGroupTitle]}>
										{formatDate(group.race.raceDate)} — {formatDistance(group.race.distance, group.race.isKilometers)}
									</Text>

									{group.participants.length === 0 ? (
										<Text style={[styles.emptyText, themedStyles.emptyText]}>
											No participants for this race.
										</Text>
									) : (
										group.participants.map((p) => (
											<View key={p.id} style={[styles.participantRow, themedStyles.participantRow]}>
												<View style={styles.participantInfo}>
													<Text style={[styles.participantName, themedStyles.participantName]}>
														{p.userDisplayName || 'Anonymous'}
													</Text>

													{(p.isDls || p.isVirtual || p.isChallenge || p.isSpectator) && (
														<View style={styles.badges}>
															{p.isDls && (
																<Text style={[styles.badge, themedStyles.badgeDls]}>DLS</Text>
															)}
															{p.isVirtual && (
																<Text style={[styles.badge, themedStyles.badgeVirtual]}>Virtual</Text>
															)}
															{p.isChallenge && (
																<Text style={[styles.badge, themedStyles.badgeChallenge]}>Challenge</Text>
															)}
															{p.isSpectator && (
																<Text style={[styles.badge, themedStyles.badgeSpectator]}>Spectator</Text>
															)}
														</View>
													)}

													{p.notes ? (
														<Text style={[styles.notes, themedStyles.notes]} numberOfLines={3}>
															{p.notes}
														</Text>
													) : null}
												</View>
											</View>
										))
									)}
								</View>
							))}
						</>
					)}
				</View>
			</ScrollView>
		</Panel>
	);
}
