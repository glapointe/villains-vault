/**
 * FollowedResultsList Component
 *
 * Displays the user's followed race results in two columns:
 * - Claimed results (2/3 width) with DLS badge and "Find My Results" button
 * - Interested results (1/3 width)
 *
 * Both lists group results by event and show race name (linked), date,
 * distance badge, chip time, pace, and kills. Includes year and event
 * series filters.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { Dropdown, Button, LoadingSpinner } from '../../ui';
import type { DropdownOption } from '../../ui';
import { EventSeries, getEventSeriesLabel } from '../../../models';
import type { FollowedResultsListProps } from './FollowedResultsList.types';
import { styles, getThemedStyles } from './FollowedResultsList.styles';
import { groupByEvent } from './helpers';
import { EmptyState } from './EmptyState';
import { EventGroupSection } from './EventGroupSection';
import { FindMyResultsPanel } from './FindMyResultsPanel';

/**
 * FollowedResultsList Component
 *
 * Two-column layout (66/33) showing claimed and interested followed results
 * grouped by event, with filters and a "Find My Results" search panel.
 */
export function FollowedResultsList({
	claimed,
	interested,
	loading,
	error,
	actionLoading,
	yearOptions,
	seriesOptions,
	filterYear,
	filterSeries,
	onFilterYearChange,
	onFilterSeriesChange,
	onUnfollow,
	onClaim,
	onClaimBatch,
	onSearchMyResults,
	onUpdateFollow,
}: FollowedResultsListProps): React.ReactElement {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const router = useRouter();
	const [findPanelOpen, setFindPanelOpen] = useState(false);

	// Build dropdown options
	const yearDropdownOptions: DropdownOption<number | null>[] = useMemo(() => {
		const opts: DropdownOption<number | null>[] = [{ label: 'All Years', value: null }];
		for (const y of yearOptions) {
			opts.push({ label: String(y), value: y });
		}
		return opts;
	}, [yearOptions]);

	const seriesDropdownOptions: DropdownOption<EventSeries | null>[] = useMemo(() => {
		const opts: DropdownOption<EventSeries | null>[] = [{ label: 'All Events', value: null }];
		for (const s of seriesOptions) {
			opts.push({ label: getEventSeriesLabel(s), value: s });
		}
		return opts;
	}, [seriesOptions]);

	// Group results by event
	const claimedGroups = useMemo(() => groupByEvent(claimed), [claimed]);
	const interestedGroups = useMemo(() => groupByEvent(interested), [interested]);

	const handleViewResult = useCallback((resultId: number) => {
		router.push(`/results/${resultId}` as any);
	}, [router]);

	const handleUnfollow = useCallback(async (raceResultId: number) => {
		await onUnfollow(raceResultId);
	}, [onUnfollow]);

	if (loading) {
		return <LoadingSpinner />;
	}

	return (
		<View style={styles.container}>
			{/* Filters */}
			<View style={styles.filterRow}>
				<View style={styles.filterGroup}>
					<Text style={[styles.filterLabel, themedStyles.filterLabel]}>Year</Text>
					<Dropdown
						value={filterYear}
						options={yearDropdownOptions}
						onChange={onFilterYearChange}
						placeholder="Select year"
					/>
				</View>
				<View style={styles.filterGroup}>
					<Text style={[styles.filterLabel, themedStyles.filterLabel]}>Event Series</Text>
					<Dropdown
						value={filterSeries}
						options={seriesDropdownOptions}
						onChange={onFilterSeriesChange}
						placeholder="Select series"
					/>
				</View>
			</View>

			{error ? (
				<View style={styles.emptyState}>
					<Ionicons name="alert-circle-outline" size={32} color={colors.error} />
					<Text style={[styles.emptyTitle, { color: colors.error }]}>{error}</Text>
				</View>
			) : (
				<View style={styles.columnsRow}>
					{/* Claimed column — 2/3 */}
					<View style={styles.columnPrimary}>
						<View style={styles.sectionHeader}>
							<Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>
								My Results
							</Text>
							<Text style={[styles.sectionCount, themedStyles.sectionCount]}>
								{claimed.length} result{claimed.length !== 1 ? 's' : ''}
							</Text>
						</View>

						<Button
							title="Find My Results"
							variant="secondary"
							icon={<Ionicons name="search-outline" size={16} color={colors.primary} />}
							onPress={() => setFindPanelOpen(true)}
						/>

						{claimedGroups.length === 0 ? (
							<EmptyState
								title="No claimed results"
								subtitle="Use 'Find My Results' to search for and claim your race results."
								themedStyles={themedStyles}
							/>
						) : (
							claimedGroups.map((group) => (
								<EventGroupSection
									key={group.eventId}
									group={group}
									mode="claimed"
									onViewResult={handleViewResult}
									onUnfollow={handleUnfollow}
									onUpdateFollow={onUpdateFollow}
									colors={colors}
									themedStyles={themedStyles}
									actionLoading={actionLoading}
								/>
							))
						)}
					</View>

					{/* Interested column — 1/3 */}
					<View style={styles.columnSecondary}>
						<View style={styles.sectionHeader}>
							<Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>
								Following
							</Text>
							<Text style={[styles.sectionCount, themedStyles.sectionCount]}>
								{interested.length} result{interested.length !== 1 ? 's' : ''}
							</Text>
						</View>

						{interestedGroups.length === 0 ? (
							<EmptyState
								title="No followed results"
								subtitle="Follow results from any race detail page to track them here."
								themedStyles={themedStyles}
							/>
						) : (
							interestedGroups.map((group) => (
								<EventGroupSection
									key={group.eventId}
									group={group}
									mode="interested"
									onViewResult={handleViewResult}
									onUnfollow={handleUnfollow}
									onUpdateFollow={onUpdateFollow}
									colors={colors}
									themedStyles={themedStyles}
									actionLoading={actionLoading}
								/>
							))
						)}
					</View>
				</View>
			)}

			{/* Find My Results slide panel */}
			<FindMyResultsPanel
				isOpen={findPanelOpen}
				onClose={() => setFindPanelOpen(false)}
				onSearch={onSearchMyResults}
				onClaimBatch={onClaimBatch}
				colors={colors}
				themedStyles={themedStyles}
			/>
		</View>
	);
}
