/**
 * FindMyResultsPanel Component
 *
 * Slide-out panel that automatically searches for the current user's
 * un-followed race results using their display name stored on the backend.
 * No manual name entry is required — the search fires immediately when the
 * panel opens. Supports pagination via a "Load More" button.
 *
 * Features:
 * - Mobile-friendly stacked card layout
 * - Client-side hometown filter (shown when multiple hometowns present)
 * - Client-side event series filter (shown when multiple series present)
 * - Visual warning outline when multiple results exist for the same race
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FollowType, EventSeries } from '../../../models';
import type { FollowSearchResult } from '../../../models';
import { getEventSeriesLabel } from '../../../models/enums/EventSeries';
import { Button, Panel, LoadingSpinner, DistanceBadge, Checkbox, Dropdown, MessageBox } from '../../ui';
import type { DropdownOption } from '../../ui';
import { EmptyState } from './EmptyState';
import { formatTime, formatDate } from './helpers';
import type { FindMyResultsPanelProps } from './FollowedResultsList.types';
import { styles } from './FollowedResultsList.styles';

const PAGE_SIZE = 25;

export function FindMyResultsPanel({
	isOpen,
	onClose,
	onSearch,
	onClaimBatch,
	colors,
	themedStyles,
}: FindMyResultsPanelProps): React.ReactElement {
	const [results, setResults] = useState<FollowSearchResult[]>([]);
	const [searching, setSearching] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);
	const [hasMore, setHasMore] = useState(false);
	const [claimSelections, setClaimSelections] = useState<Map<number, { claim: boolean; dls: boolean }>>(new Map());
	const [hometownFilter, setHometownFilter] = useState<string | null>(null);
	const [seriesFilter, setSeriesFilter] = useState<EventSeries | null>(null);
	const didAutoSearch = useRef(false);

	// Derive unique hometowns from results
	const hometownOptions = useMemo<DropdownOption<string | null>[]>(() => {
		const hometowns = new Set<string>();
		for (const r of results) {
			if (r.hometown) hometowns.add(r.hometown);
		}
		if (hometowns.size <= 1) return [];
		const sorted = Array.from(hometowns).sort();
		return [
			{ label: 'All Hometowns', value: null },
			...sorted.map((h) => ({ label: h, value: h })),
		];
	}, [results]);

	// Derive unique event series from results
	const seriesOptions = useMemo<DropdownOption<EventSeries | null>[]>(() => {
		const seriesSet = new Set<EventSeries>();
		for (const r of results) {
			if (r.eventSeries) seriesSet.add(r.eventSeries);
		}
		if (seriesSet.size <= 1) return [];
		const sorted = Array.from(seriesSet).sort();
		return [
			{ label: 'All Event Series', value: null },
			...sorted.map((s) => ({ label: getEventSeriesLabel(s), value: s })),
		];
	}, [results]);

	// Detect races with multiple results (same raceName + raceDate)
	const duplicateRaceKeys = useMemo(() => {
		const counts = new Map<string, number>();
		for (const r of results) {
			const key = `${r.raceName}|${r.raceDate}`;
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
		const dupes = new Set<string>();
		for (const [key, count] of counts) {
			if (count > 1) dupes.add(key);
		}
		return dupes;
	}, [results]);

	// Apply client-side filters
	const filteredResults = useMemo(() => {
		let filtered = results;
		if (hometownFilter) {
			filtered = filtered.filter((r) => r.hometown === hometownFilter);
		}
		if (seriesFilter) {
			filtered = filtered.filter((r) => r.eventSeries === seriesFilter);
		}
		return filtered;
	}, [results, hometownFilter, seriesFilter]);

	// Auto-search when the panel opens
	useEffect(() => {
		if (isOpen && !didAutoSearch.current) {
			didAutoSearch.current = true;
			(async () => {
				setSearching(true);
				setResults([]);
				setClaimSelections(new Map());
				setHometownFilter(null);
				setSeriesFilter(null);
				const data = await onSearch(0, PAGE_SIZE);
				setResults(data);
				setHasSearched(true);
				setHasMore(data.length >= PAGE_SIZE);
				setSearching(false);
			})();
		}
		if (!isOpen) {
			didAutoSearch.current = false;
		}
	}, [isOpen, onSearch]);

	const handleLoadMore = useCallback(async () => {
		setLoadingMore(true);
		const data = await onSearch(results.length, PAGE_SIZE);
		setResults((prev) => [...prev, ...data]);
		setHasMore(data.length >= PAGE_SIZE);
		setLoadingMore(false);
	}, [onSearch, results.length]);

	const toggleClaim = useCallback((resultId: number) => {
		setClaimSelections((prev) => {
			const next = new Map(prev);
			const existing = next.get(resultId);
			if (existing) {
				next.delete(resultId);
			} else {
				next.set(resultId, { claim: true, dls: false });
			}
			return next;
		});
	}, []);

	const toggleDls = useCallback((resultId: number) => {
		setClaimSelections((prev) => {
			const next = new Map(prev);
			const existing = next.get(resultId);
			if (existing) {
				next.set(resultId, { ...existing, dls: !existing.dls });
			}
			return next;
		});
	}, []);

	const handleClaimSelected = useCallback(async () => {
		const entries = Array.from(claimSelections.entries());
		const requests = entries
			.filter(([, sel]) => sel.claim)
			.map(([resultId, sel]) => ({
				raceResultId: resultId,
				followType: FollowType.Claimed,
				deadLastStarted: sel.dls,
			}));
		// Close the panel first so it doesn't re-open when the parent
		// refreshes follows (which triggers a loading state re-render).
		onClose();
		await onClaimBatch(requests);
		setClaimSelections(new Map());
	}, [claimSelections, onClaimBatch, onClose]);

	const handleSelectAll = useCallback(() => {
		const allFilteredIds = new Set(filteredResults.map((r) => r.resultId));
		const allSelected = filteredResults.every((r) => claimSelections.has(r.resultId));

		setClaimSelections((prev) => {
			const next = new Map(prev);
			if (allSelected) {
				// Deselect all currently filtered
				for (const id of allFilteredIds) {
					next.delete(id);
				}
			} else {
				// Select all currently filtered
				for (const r of filteredResults) {
					if (!next.has(r.resultId)) {
						next.set(r.resultId, { claim: true, dls: false });
					}
				}
			}
			return next;
		});
	}, [filteredResults, claimSelections]);

	const selectedCount = claimSelections.size;
	const allFilteredSelected = filteredResults.length > 0 && filteredResults.every((r) => claimSelections.has(r.resultId));
	const hasFilters = hometownOptions.length > 0 || seriesOptions.length > 0;

	return (
		<Panel
			isOpen={isOpen}
			onClose={onClose}
			headerTitle="Find My Results"
			width="large"
			footer={
				selectedCount > 0 ? (
					<Button
						title={`Claim ${selectedCount} Result${selectedCount > 1 ? 's' : ''}`}
						variant="primary"
						onPress={handleClaimSelected}
					/>
				) : undefined
			}
		>
			<View style={styles.searchContainer}>
				{searching && (
					<View style={styles.emptyState}>
						<LoadingSpinner />
						<Text style={[styles.emptySubtitle, themedStyles.emptySubtitle]}>
							Searching through all race results to find your entries — this may take a moment...
						</Text>
					</View>
				)}

				{!searching && results.length > 0 && (
					<>
						<MessageBox type="info" 
							title="Search Tips" 
							message="Your display name is used to find potential matches. If you don't see expected results, make sure your display name is correct in your profile settings."
						/>
						{/* Client-side filters */}
						{hasFilters && (
							<View style={styles.searchFilterRow}>
								{seriesOptions.length > 0 && (
									<View style={styles.searchFilterGroup}>
										<Text style={[styles.filterLabel, themedStyles.filterLabel]}>Event Series</Text>
										<Dropdown
											value={seriesFilter}
											options={seriesOptions}
											onChange={setSeriesFilter}
										/>
									</View>
								)}
								{hometownOptions.length > 0 && (
									<View style={styles.searchFilterGroup}>
										<Text style={[styles.filterLabel, themedStyles.filterLabel]}>Hometown</Text>
										<Dropdown
											value={hometownFilter}
											options={hometownOptions}
											onChange={setHometownFilter}
										/>
									</View>
								)}
							</View>
						)}

						<View style={styles.searchResultsHeader}>
							<Text style={[styles.searchResultCount, themedStyles.searchRunnerDetails]}>
								{filteredResults.length === results.length
									? `${results.length} result${results.length !== 1 ? 's' : ''} found`
									: `Showing ${filteredResults.length} of ${results.length} results`}
							</Text>
							{filteredResults.length > 0 && (
								<Button
									title={allFilteredSelected ? 'Deselect All' : 'Select All'}
									variant="ghost"
									onPress={handleSelectAll}
								/>
							)}
						</View>

						<View style={styles.searchResultsList}>
							{filteredResults.map((r) => {
								const raceKey = `${r.raceName}|${r.raceDate}`;
								const isDuplicate = duplicateRaceKeys.has(raceKey);

								return (
									<View
										key={r.resultId}
										style={[
											styles.searchResultCard,
											themedStyles.searchResultCard,
											isDuplicate && { borderColor: colors.warning, borderWidth: 2 },
										]}
									>
										{/* Header: name + race info */}
										<View style={styles.searchResultContent}>
											<View style={styles.searchCardHeader}>
												<Text
													style={[styles.searchRunnerName, themedStyles.searchRunnerName]}
													numberOfLines={1}
												>
													{r.runnerName}
												</Text>
												{isDuplicate && (
													<Ionicons name="warning-outline" size={14} color={colors.warning} />
												)}
											</View>
											<Text
												style={[styles.resultRaceName, themedStyles.resultRaceName]}
												numberOfLines={1}
											>
												{r.raceName}
											</Text>
											<View style={styles.resultMeta}>
												<Text
													style={[styles.searchRunnerDetails, themedStyles.searchRunnerDetails]}
													numberOfLines={1}
												>
													{r.eventName}
												</Text>
												<Text style={[styles.searchRunnerDetails, themedStyles.searchRunnerDetails]}>
													{formatDate(r.raceDate)}
												</Text>
												<DistanceBadge distance={r.distance} compact />
											</View>
											{r.hometown && (
												<Text style={[styles.searchRunnerDetails, themedStyles.searchRunnerDetails]}>
													{r.hometown}
												</Text>
											)}
										</View>

										{/* Stats + actions row (wraps nicely on mobile) */}
										<View style={styles.searchCardFooter}>
											<View style={styles.searchStatsRow}>
												{r.netTime && (
													<View style={styles.statItem}>
														<Text style={[styles.statValue, themedStyles.statValue]}>
															{formatTime(r.netTime)}
														</Text>
														<Text style={[styles.statLabel, themedStyles.statLabel]}>Chip</Text>
													</View>
												)}
												{r.overallPace && (
													<View style={styles.statItem}>
														<Text style={[styles.statValue, themedStyles.statValue]}>
															{formatTime(r.overallPace)}
														</Text>
														<Text style={[styles.statLabel, themedStyles.statLabel]}>Pace</Text>
													</View>
												)}
												{r.overallPlace != null && (
													<View style={styles.statItem}>
														<Text style={[styles.statValue, themedStyles.statValue]}>
															#{r.overallPlace}
														</Text>
														<Text style={[styles.statLabel, themedStyles.statLabel]}>Place</Text>
													</View>
												)}
											</View>

											<View style={styles.searchCheckboxes}>
												<Checkbox
													label="Claim"
													checked={claimSelections.has(r.resultId)}
													onToggle={() => toggleClaim(r.resultId)}
												/>
												{claimSelections.has(r.resultId) && (
													<Checkbox
														label="DLS"
														checked={claimSelections.get(r.resultId)?.dls ?? false}
														onToggle={() => toggleDls(r.resultId)}
													/>
												)}
											</View>
										</View>
									</View>
								);
							})}
						</View>

						{hasMore && (
							<Button
								title="Load More Results"
								variant="ghost"
								icon={<Ionicons name="chevron-down-outline" size={16} color={colors.primary} />}
								onPress={handleLoadMore}
								loading={loadingMore}
							/>
						)}
					</>
				)}

				{!searching && results.length === 0 && hasSearched && (
					<EmptyState
						title="No unclaimed results found"
						subtitle="All matching results have already been claimed, or no results were found for your name."
						themedStyles={themedStyles}
					/>
				)}
			</View>
		</Panel>
	);
}
