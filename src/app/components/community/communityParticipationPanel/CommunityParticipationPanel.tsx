/**
 * CommunityParticipationPanel Component
 *
 * Panel for managing a user's participation in a community event.
 * Shows each race with toggles for DLS, Challenge, Virtual, Spectator,
 * plus a notes field. Includes "Copy from previous" for convenience
 * and a withdraw button to remove all participation.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { Panel, Button, Checkbox, LoadingSpinner } from '../../ui';
import { useCommunityEvents } from '../../../hooks';
import { useAuth } from '../../../hooks';
import { styles, getThemedStyles } from './CommunityParticipationPanel.styles';
import type { CommunityParticipationPanelProps, RaceParticipationRow } from './CommunityParticipationPanel.types';

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

/**
 * Panel for managing user participation across all races in an event
 */
export function CommunityParticipationPanel({
	isOpen,
	event,
	onClose,
	onSaved,
}: CommunityParticipationPanelProps): React.ReactElement {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const { accessToken } = useAuth();
	const { getMyParticipation, saveParticipation, withdrawParticipation, actionLoading } =
		useCommunityEvents({ accessToken });

	const [rows, setRows] = useState<RaceParticipationRow[]>([]);
	const [loadingExisting, setLoadingExisting] = useState(false);
	const [hasExistingParticipation, setHasExistingParticipation] = useState(false);
	const [formError, setFormError] = useState('');

	// Load existing participation data when panel opens
	useEffect(() => {
		if (!isOpen || !event) {
			setRows([]);
			return;
		}

		const sortedRaces = [...event.races].sort(
			(a, b) => new Date(a.raceDate).getTime() - new Date(b.raceDate).getTime()
		);

		// Initialize rows from event races
		const initialRows: RaceParticipationRow[] = sortedRaces.map((r) => ({
			communityRaceId: r.id,
			raceDate: r.raceDate,
			distance: r.distance,
			isKilometers: r.isKilometers,
			hasVirtualOption: r.hasVirtualOption,
			isPartOfChallenge: r.isPartOfChallenge,
			isParticipating: false,
			isDls: false,
			isChallenge: false,
			isVirtual: false,
			isSpectator: false,
			notes: '',
		}));

		setRows(initialRows);
		setFormError('');
		setHasExistingParticipation(false);

		// Try to load existing participation
		const loadExisting = async () => {
			setLoadingExisting(true);
			try {
				const participations = await getMyParticipation(event.id);
					if (participations && participations.length > 0) {
						setHasExistingParticipation(true);
						setRows((prev) =>
							prev.map((row) => {
								const existing = participations.find(
									(p) => p.communityRaceId === row.communityRaceId
								);
								if (existing) {
									return {
										...row,
										isParticipating: !existing.isSpectator,
										isDls: existing.isDls,
										isChallenge: existing.isChallenge,
										isVirtual: existing.isVirtual,
										isSpectator: existing.isSpectator,
										notes: existing.notes ?? '',
									};
								}
								return row;
							})
						);
				}
			} catch {
				// Ignore — user may not have existing participation
			} finally {
				setLoadingExisting(false);
			}
		};

		loadExisting();
	}, [isOpen, event]);

	/** Update a row toggle */
	const updateRow = useCallback(
		(raceId: number, field: keyof RaceParticipationRow, value: any) => {
			setRows((prev) =>
				prev.map((r) => (r.communityRaceId === raceId ? { ...r, [field]: value } : r))
			);
		},
		[]
	);

	/** Copy settings from previous race to next */
	const copyFromPrevious = useCallback((index: number) => {
		if (index === 0) return;
		setRows((prev) => {
			const source = prev[index - 1];
			return prev.map((r, i) =>
				i === index
					? {
						...r,
						isParticipating: source.isParticipating,
						isDls: source.isDls,
						isChallenge: source.isChallenge,
						isVirtual: source.isVirtual,
						isSpectator: source.isSpectator,
						notes: source.notes,
					}
					: r
			);
		});
	}, []);

	/** Save all participation entries */
	const handleSave = useCallback(async () => {
		if (!event) return;
		setFormError('');

		// Only send rows where the user has actually opted in (not all-defaults)
		const activeEntries = rows
			.filter((r) => r.isParticipating || r.isSpectator || r.notes.trim())
			.map((r) => ({
				communityRaceId: r.communityRaceId,
				isDls: r.isParticipating ? r.isDls : false,
				isChallenge: r.isParticipating ? r.isChallenge : false,
				isVirtual: r.isParticipating ? r.isVirtual : false,
				isSpectator: r.isSpectator,
				notes: r.notes.trim() || undefined,
			}));

		const result = await saveParticipation(event.id, { entries: activeEntries });
		if (result !== null) {
			onSaved();
		} else {
			setFormError('Failed to save participation. Please try again.');
		}
	}, [event, rows, saveParticipation, onSaved]);

	/** Withdraw all participation */
	const handleWithdraw = useCallback(async () => {
		if (!event) return;
		setFormError('');

		const success = await withdrawParticipation(event.id);
		if (success) {
			onSaved();
		} else {
			setFormError('Failed to withdraw. Please try again.');
		}
	}, [event, withdrawParticipation, onSaved]);

	const footer = (
		<View style={styles.footerRow}>
			<Button title="Cancel" variant="secondary" onPress={onClose} />
			<Button
				title="Save Participation"
				variant="primary"
				onPress={handleSave}
				loading={actionLoading}
			/>
		</View>
	);

	return (
		<Panel
			isOpen={isOpen}
			onClose={onClose}
			headerTitle={event?.title ?? 'Participation'}
			width="large"
			footer={footer}
		>
			<View style={styles.container}>
				<Text style={[styles.description, themedStyles.description]}>
					Select your participation for each race in this event. Toggle the options that
					apply to you and add optional notes.
				</Text>

				{loadingExisting ? (
					<LoadingSpinner size="small" />
				) : (
					rows.map((row, index) => (
						<View key={row.communityRaceId} style={[styles.raceSection, themedStyles.raceSection]}>
							<View style={styles.raceHeader}>
								<Text style={[styles.raceTitle, themedStyles.raceTitle]}>
									{formatDate(row.raceDate)} — {formatDistance(row.distance, row.isKilometers)}
								</Text>
							</View>

							<View style={styles.checkboxGroup}>
								<Checkbox
									label="Participating"
									description="I'll be running/walking this race"
									checked={row.isParticipating}
									onToggle={(v) => {
										updateRow(row.communityRaceId, 'isParticipating', v);
										if (v) updateRow(row.communityRaceId, 'isSpectator', false);
									}}
								/>
								{row.isParticipating && (
									<>
										<Checkbox
											label="DLS (Dead Last Start)"
											checked={row.isDls}
											onToggle={(v) => updateRow(row.communityRaceId, 'isDls', v)}
										/>
										{row.hasVirtualOption && (
											<Checkbox
												label="Running Virtually"
												checked={row.isVirtual}
												onToggle={(v) => updateRow(row.communityRaceId, 'isVirtual', v)}
											/>
										)}
										{row.isPartOfChallenge && (
											<Checkbox
												label="Doing the Challenge"
												checked={row.isChallenge}
												onToggle={(v) => updateRow(row.communityRaceId, 'isChallenge', v)}
											/>
										)}
									</>
								)}
								<Checkbox
									label="Spectating Only"
									description="I'm coming to cheer!"
									checked={row.isSpectator}
									onToggle={(v) => {
										updateRow(row.communityRaceId, 'isSpectator', v);
										if (v) updateRow(row.communityRaceId, 'isParticipating', false);
									}}
								/>
							</View>

							<TextInput
								style={[styles.notesInput, themedStyles.notesInput]}
								value={row.notes}
								onChangeText={(v) => updateRow(row.communityRaceId, 'notes', v)}
								placeholder="Notes (companions, travel plans...)"
								placeholderTextColor={colors.textDisabled}
								multiline
								numberOfLines={2}
								maxLength={500}
							/>

							{index > 0 && (
								<Pressable onPress={() => copyFromPrevious(index)}>
									<Text style={[styles.copyLink, themedStyles.copyLink]}>
										↑ Copy from previous race
									</Text>
								</Pressable>
							)}
						</View>
					))
				)}

				{formError ? (
					<Text style={[styles.errorText, themedStyles.errorText]}>{formError}</Text>
				) : null}

				{/* Withdraw section — only shown if user has existing participation */}
				{hasExistingParticipation && (
					<View style={[styles.withdrawContainer, themedStyles.withdrawContainer]}>
						<Text style={[styles.withdrawLabel, themedStyles.withdrawLabel]}>
							Changed your mind?
						</Text>
						<Button
							title="Withdraw from Event"
							variant="ghost"
							onPress={handleWithdraw}
							loading={actionLoading}
							fullWidth
							icon={<Ionicons name="close-circle-outline" size={24} color={colors.error} />}
						/>
					</View>
				)}
			</View>
		</Panel>
	);
}
