/**
 * CommunityEventList Component
 *
 * Full-page community events list with year/name/location filters,
 * "Show Past Events" toggle, pagination, and action buttons.
 * Events are grouped by month and displayed as compact cards in a wrapping row.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Switch, Linking } from 'react-native';
import type { ReactNode } from 'react';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { Button, LoadingSpinner, MessageBox, Dropdown, SectionHeader } from '../../ui';
import type { DropdownOption } from '../../ui';
import { useCommunityEvents } from '../../../hooks';
import { useAuth } from '../../../hooks';
import { CommunityEventFormPanel } from '../communityEventFormPanel';
import { CommunityParticipationPanel } from '../communityParticipationPanel';
import { CommunityParticipantsPanel } from '../communityParticipantsPanel';
import { styles, getThemedStyles } from './CommunityEventList.styles';
import type { CommunityEventFilters } from './CommunityEventList.types';
import type { CommunityEvent } from '../../../models';

const DEFAULT_PAGE_SIZE = 40;

/** Format a date string for display */
function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Format a short date (no year) */
function formatShortDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Get a month-year key for grouping */
function getMonthKey(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Format distance with unit */
function formatDistance(distance: number, isKilometers: boolean): string {
	const unit = isKilometers ? 'km' : 'mi';
	if (distance === Math.floor(distance)) return `${distance}${unit}`;
	return `${distance}${unit}`;
}

/** Get the earliest race date from an event's races */
function getFirstRaceDate(event: CommunityEvent): string {
	if (!event.races.length) return '';
	const sorted = [...event.races].sort(
		(a, b) => new Date(a.raceDate).getTime() - new Date(b.raceDate).getTime()
	);
	return sorted[0].raceDate;
}

/** Group events by the month of their earliest race */
function groupByMonth(events: CommunityEvent[]): { month: string; events: CommunityEvent[] }[] {
	const groups = new Map<string, CommunityEvent[]>();
	for (const event of events) {
		const firstDate = getFirstRaceDate(event);
		const key = firstDate ? getMonthKey(firstDate) : 'No Date';
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key)!.push(event);
	}
	return Array.from(groups.entries()).map(([month, evts]) => ({ month, events: evts }));
}

/**
 * Full-page community events list with filtering and paging
 */
export function CommunityEventList(): React.ReactElement {
	const { isAuthenticated, user, accessToken, isLoading: authLoading } = useAuth();
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);

	const {
		pagedEvents,
		availableYears,
		loading,
		error,
		fetchEvents,
		fetchAvailableYears,
		actionLoading,
	} = useCommunityEvents({ accessToken });

	const [filters, setFilters] = useState<CommunityEventFilters>({
		year: null,
		name: '',
		location: '',
		includePast: false,
		page: 1,
		pageSize: DEFAULT_PAGE_SIZE,
	});

	// Panel states
	const [formPanelOpen, setFormPanelOpen] = useState(false);
	const [formPanelEvent, setFormPanelEvent] = useState<CommunityEvent | null>(null);
	const [participationPanelOpen, setParticipationPanelOpen] = useState(false);
	const [participationPanelEvent, setParticipationPanelEvent] = useState<CommunityEvent | null>(null);
	const [participantsPanelOpen, setParticipantsPanelOpen] = useState(false);
	const [participantsPanelEvent, setParticipantsPanelEvent] = useState<CommunityEvent | null>(null);

	// Load available years once auth has settled
	useEffect(() => {
		if (!authLoading) {
			fetchAvailableYears();
		}
	}, [authLoading]);

	// Fetch events when filters change (wait for auth to settle first)
	useEffect(() => {
		if (authLoading) return;
		fetchEvents({
			page: filters.page,
			pageSize: filters.pageSize,
			year: filters.year ?? undefined,
			name: filters.name || undefined,
			location: filters.location || undefined,
			includePast: filters.includePast,
		});
	}, [filters, authLoading]);

	// Build year dropdown options
	const yearOptions: DropdownOption[] = useMemo(() => {
		const opts: DropdownOption[] = [{ label: 'All Years', value: '' }];
		for (const y of availableYears) {
			opts.push({ label: String(y), value: String(y) });
		}
		return opts;
	}, [availableYears]);

	// Group events by month
	const monthGroups = useMemo(() => {
		if (!pagedEvents?.items) return [];
		return groupByMonth(pagedEvents.items);
	}, [pagedEvents]);

	/** Update a single filter field and reset to page 1 */
	const updateFilter = useCallback(<K extends keyof CommunityEventFilters>(
		key: K,
		value: CommunityEventFilters[K]
	) => {
		setFilters(prev => ({ ...prev, [key]: value, page: key === 'page' ? value as number : 1 }));
	}, []);

	/** Open form panel for new event */
	const openNewEvent = useCallback(() => {
		setFormPanelEvent(null);
		setFormPanelOpen(true);
	}, []);

	/** Open form panel for editing an event */
	const openEditEvent = useCallback((event: CommunityEvent) => {
		setFormPanelEvent(event);
		setFormPanelOpen(true);
	}, []);

	/** Close form panel */
	const closeFormPanel = useCallback(() => {
		setFormPanelOpen(false);
		setFormPanelEvent(null);
	}, []);

	/** Open participation panel */
	const openParticipation = useCallback((event: CommunityEvent) => {
		setParticipationPanelEvent(event);
		setParticipationPanelOpen(true);
	}, []);

	/** Close participation panel */
	const closeParticipation = useCallback(() => {
		setParticipationPanelOpen(false);
		setParticipationPanelEvent(null);
	}, []);

	/** Open participants panel */
	const openParticipants = useCallback((event: CommunityEvent) => {
		setParticipantsPanelEvent(event);
		setParticipantsPanelOpen(true);
	}, []);

	/** Close participants panel */
	const closeParticipants = useCallback(() => {
		setParticipantsPanelOpen(false);
		setParticipantsPanelEvent(null);
	}, []);

	/** After form panel saves, refresh the list */
	const handleFormSaved = useCallback(() => {
		closeFormPanel();
		fetchEvents({
			page: filters.page,
			pageSize: filters.pageSize,
			year: filters.year ?? undefined,
			name: filters.name || undefined,
			location: filters.location || undefined,
			includePast: filters.includePast,
		});
		fetchAvailableYears();
	}, [closeFormPanel, fetchEvents, fetchAvailableYears, filters]);

	/** After participation saved, refresh the list */
	const handleParticipationSaved = useCallback(() => {
		closeParticipation();
		fetchEvents({
			page: filters.page,
			pageSize: filters.pageSize,
			year: filters.year ?? undefined,
			name: filters.name || undefined,
			location: filters.location || undefined,
			includePast: filters.includePast,
		});
	}, [closeParticipation, fetchEvents, filters]);

	const currentUserId = user?.id;
	const isAdmin = user?.isAdmin === true;

	return (
		<View style={styles.container}>
			<View style={styles.contentContainer}>
				<View style={[styles.content, themedStyles.content]}>
					<SectionHeader
						title="Community Events"
						subTitle="Discover and share local running events with the community."
						isPageHeader
						rightContent={isAuthenticated && (
							<View>
								<Button
									title="Add Event"
									variant="primary"
									onPress={openNewEvent}
									icon={<Ionicons name="add-circle-outline" size={18} color={colors.textInverse} />}
								/>
							</View>
						)}
					/>
					<View style={styles.contentBody}>
						{/* Filters (matches results grid pattern) */}
						<View style={[styles.filterContainer, themedStyles.filterContainer]}>
							<View style={styles.filterRow}>
								<View style={styles.filterGroup}>
									<Text style={[styles.filterLabel, themedStyles.filterLabel]}>Year</Text>
									<Dropdown
										options={yearOptions}
										value={filters.year != null ? String(filters.year) : ''}
										onChange={(value) => updateFilter('year', value ? Number(value) : null)}
									/>
								</View>
								<View style={styles.filterGroup}>
									<Text style={[styles.filterLabel, themedStyles.filterLabel]}>Name</Text>
									<TextInput
										style={[styles.filterInput, themedStyles.filterInput]}
										value={filters.name}
										onChangeText={(v) => updateFilter('name', v)}
										placeholder="Search by name..."
										placeholderTextColor={colors.textDisabled}
									/>
								</View>
								<View style={styles.filterGroup}>
									<Text style={[styles.filterLabel, themedStyles.filterLabel]}>Location</Text>
									<TextInput
										style={[styles.filterInput, themedStyles.filterInput]}
										value={filters.location}
										onChangeText={(v) => updateFilter('location', v)}
										placeholder="Search by location..."
										placeholderTextColor={colors.textDisabled}
									/>
								</View>
								<View style={styles.toggleGroup}>
									<Switch
										value={filters.includePast}
										onValueChange={(v) => updateFilter('includePast', v)}
										trackColor={{ false: colors.border, true: colors.primary }}
									/>
									<Text style={[styles.toggleLabel, themedStyles.toggleLabel]}>Show Past</Text>
								</View>
							</View>
						</View>

						{/* Error */}
						{Boolean(error) && <MessageBox type="error" title="Error" message={error} showIcon />}

						{/* Loading */}
						{loading && (
							<View style={styles.loadingContainer}>
								<LoadingSpinner size="small" />
							</View>
						)}

						{/* Empty state */}
						{!loading && pagedEvents && pagedEvents.items.length === 0 && (
							<Text style={[styles.emptyText, themedStyles.emptyText]}>
								No community events found. {isAuthenticated ? 'Be the first to add one!' : ''}
							</Text>
						)}

						{/* Events grouped by month */}
						{!loading && monthGroups.map((group) => (
							<View key={group.month}>
								<Text style={[styles.monthHeader, themedStyles.monthHeader]}>{group.month}</Text>
								<View style={styles.cardsGrid}>
									{group.events.map((event) => {
										const isOwner = currentUserId === event.createdByUserId || isAdmin;
										const sortedRaces = [...event.races].sort(
											(a, b) => new Date(a.raceDate).getTime() - new Date(b.raceDate).getTime()
										);

										return (
											<View key={event.id} style={[styles.eventCard, themedStyles.eventCard]}>
												{/* Title row */}
												<View style={styles.cardTitleRow}>
											{event.link ? (
												<Pressable
													style={styles.titleLink}
													onPress={() => Linking.openURL(event.link!)}
												>
													{({ hovered }: { hovered: boolean }): ReactNode => (
														<>
															<Text
																style={[
																	styles.eventTitle,
																	themedStyles.eventTitleLink,
																	hovered && themedStyles.eventTitleLinkHovered,
																]}
																numberOfLines={1}
															>
																{event.title}
															</Text>
														</>
													)}
												</Pressable>
											) : (
												<Text style={[styles.eventTitle, themedStyles.eventTitle]} numberOfLines={1}>
													{event.title}
												</Text>
											)}
											{isOwner && (
												<Pressable onPress={() => openEditEvent(event)} hitSlop={8}>
													<Feather name="edit" size={14} color={colors.textSecondary} />
												</Pressable>
											)}
												</View>

												{/* Location */}
												{event.location && (
													<View style={styles.locationRow}>
														<Ionicons name="location-outline" size={12} color={colors.textTertiary} />
														<Text style={[styles.locationText, themedStyles.locationText]} numberOfLines={1}>
															{event.location}
														</Text>
													</View>
												)}

												{/* Race badges */}
												<View style={styles.racesRow}>
													{sortedRaces.map((race) => (
														<Text key={race.id} style={[styles.raceBadge, themedStyles.raceBadge]}>
															{formatShortDate(race.raceDate)} · {formatDistance(race.distance, race.isKilometers)}
														</Text>
													))}
												</View>

												{/* Bottom row: actions + participant count */}
												<View style={[styles.cardFooter, themedStyles.cardFooter]}>
													{isAuthenticated && (
													event.isCurrentUserGoing ? (
														<Pressable
															style={[styles.goingBadge, themedStyles.goingBadge]}
															onPress={() => openParticipation(event)}
														>
															<Ionicons name="checkmark-circle" size={14} color={colors.success} />
															<Text style={[styles.goingBadgeText, themedStyles.goingBadgeText]}>
																Going
															</Text>
														</Pressable>
													) : (
														<Button
															title="I'm Going!"
															variant="secondary"
															padding="sm"
															icon={<Ionicons name="hand-left-outline" size={14} color={colors.primary} />}
															onPress={() => openParticipation(event)}
														/>
													)
													)}
													<Pressable onPress={() => openParticipants(event)} style={styles.participantCount}>
														<Ionicons name="people-outline" size={14} color={colors.textSecondary} />
														<Text style={[styles.participantCountText, themedStyles.participantCountText]}>
															{event.participantCount}
														</Text>
													</Pressable>
												</View>

												{/* Creator note — admin only */}
												{isAdmin && event.createdByDisplayName && (
													<Text style={[styles.createdBy, themedStyles.createdBy]}>
														Added by {event.createdByDisplayName}
													</Text>
												)}
											</View>
										);
									})}
								</View>
							</View>
						))}

						{/* Paging */}
						{pagedEvents && pagedEvents.totalPages > 1 && (
							<View style={styles.pagingRow}>
								<Button
									title="← Prev"
									variant="ghost"
									onPress={() => updateFilter('page', filters.page - 1)}
									disabled={!pagedEvents.hasPreviousPage}
								/>
								<Text style={[styles.pageInfo, themedStyles.pageInfo]}>
									Page {pagedEvents.page} of {pagedEvents.totalPages}
								</Text>
								<Button
									title="Next →"
									variant="ghost"
									onPress={() => updateFilter('page', filters.page + 1)}
									disabled={!pagedEvents.hasNextPage}
								/>
							</View>
						)}
					</View>
				</View>

				{/* Form Panel (create/edit) */}
				<CommunityEventFormPanel
					isOpen={formPanelOpen}
					event={formPanelEvent}
					onClose={closeFormPanel}
					onSaved={handleFormSaved}
				/>

				{/* Participation Panel */}
				<CommunityParticipationPanel
					isOpen={participationPanelOpen}
					event={participationPanelEvent}
					onClose={closeParticipation}
					onSaved={handleParticipationSaved}
				/>

				{/* Participants Panel */}
				<CommunityParticipantsPanel
					isOpen={participantsPanelOpen}
					event={participantsPanelEvent}
					onClose={closeParticipants}
				/>
			</View>
		</View>
	);
}
