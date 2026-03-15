/**
 * CommunityEventFormPanel Component
 *
 * All-in-one Panel for creating and editing community events with dynamic race sub-forms.
 * - Create mode: blank form, "Create Event" button
 * - Edit mode (owner/admin): pre-filled, save/delete, add/remove races
 * - View mode (non-owner): read-only details
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { Panel, Button, Checkbox, DatePicker } from '../../ui';
import { useCommunityEvents, useAuth } from '../../../hooks';
import { formatDate } from '../../../utils';
import { styles, getThemedStyles } from './CommunityEventFormPanel.styles';
import type { CommunityEventFormPanelProps, RaceFormRow } from './CommunityEventFormPanel.types';
import { useDialog } from 'contexts/DialogContext';

let rowKeyCounter = 0;
function nextRowKey(): string {
	return `race-row-${++rowKeyCounter}`;
}

/** Create a blank race row */
function blankRaceRow(): RaceFormRow {
	return {
		key: nextRowKey(),
		raceDate: new Date().toISOString(),
		distance: '',
		isKilometers: false,
		comments: '',
		hasVirtualOption: false,
		isPartOfChallenge: false,
	};
}

/**
 * Panel for creating or editing a community event
 */
export function CommunityEventFormPanel({
	isOpen,
	event,
	onClose,
	onSaved,
}: CommunityEventFormPanelProps): React.ReactElement {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const { user, accessToken } = useAuth();
	const { createEvent, updateEvent, deleteEvent, addRace, updateRace, deleteRace, actionLoading } =
		useCommunityEvents({ accessToken });
	const { showConfirm } = useDialog();

	// Form state
	const [title, setTitle] = useState('');
	const [link, setLink] = useState('');
	const [location, setLocation] = useState('');
	const [comments, setComments] = useState('');
	const [raceRows, setRaceRows] = useState<RaceFormRow[]>([blankRaceRow()]);
	const [formError, setFormError] = useState('');
	const [showDatePickerKey, setShowDatePickerKey] = useState<string | null>(null);

	const isEditing = !!event;
	const isOwner = event ? (user?.id === event.createdByUserId || user?.isAdmin === true) : true;

	// Reset form when panel opens or event changes
	useEffect(() => {
		if (isOpen) {
			setFormError('');
			if (event) {
				setTitle(event.title);
				setLink(event.link ?? '');
				setLocation(event.location ?? '');
				setComments(event.comments ?? '');
				setRaceRows(
					event.races.map((r) => ({
						key: nextRowKey(),
						id: r.id,
						raceDate: r.raceDate,
						distance: String(r.distance),
						isKilometers: r.isKilometers,
						comments: r.comments ?? '',
						hasVirtualOption: r.hasVirtualOption,
						isPartOfChallenge: r.isPartOfChallenge,
					}))
				);
			} else {
				setTitle('');
				setLink('');
				setLocation('');
				setComments('');
				setRaceRows([blankRaceRow()]);
			}
		}
	}, [isOpen, event]);

	/** Update a race row field */
	const updateRow = useCallback((key: string, field: keyof RaceFormRow, value: any) => {
		setRaceRows((prev) =>
			prev.map((r) => (r.key === key ? { ...r, [field]: value } : r))
		);
	}, []);

	/** Add a new race row */
	const addRow = useCallback(() => {
		setRaceRows((prev) => [...prev, blankRaceRow()]);
	}, []);

	/** Remove a race row (or mark as deleted for existing rows) */
	const removeRow = useCallback((key: string) => {
		setRaceRows((prev) => {
			const row = prev.find((r) => r.key === key);
			if (row?.id) {
				// Mark existing race as deleted
				return prev.map((r) => (r.key === key ? { ...r, deleted: true } : r));
			}
			// Remove new (unsaved) row
			return prev.filter((r) => r.key !== key);
		});
	}, []);

	/** Validate and submit the form */
	const handleSubmit = useCallback(async () => {
		setFormError('');

		if (!title.trim()) {
			setFormError('Title is required.');
			return;
		}

		const activeRows = raceRows.filter((r) => !r.deleted);
		if (activeRows.length === 0) {
			setFormError('At least one race is required.');
			return;
		}

		for (const row of activeRows) {
			const dist = parseFloat(row.distance);
			if (!row.distance || isNaN(dist) || dist <= 0) {
				setFormError('Each race must have a valid distance greater than 0.');
				return;
			}
		}

		try {
			if (isEditing && event) {
				// Update event metadata
				await updateEvent(event.id, {
					title: title.trim(),
					link: link.trim() || undefined,
					location: location.trim() || undefined,
					comments: comments.trim() || undefined,
				});

				// Handle race modifications
				for (const row of raceRows) {
					if (row.deleted && row.id) {
						await deleteRace(row.id);
					} else if (!row.deleted && row.id) {
						await updateRace(row.id, {
							raceDate: row.raceDate,
							distance: parseFloat(row.distance),
							isKilometers: row.isKilometers,
							comments: row.comments.trim() || undefined,
							hasVirtualOption: row.hasVirtualOption,
							isPartOfChallenge: row.isPartOfChallenge,
						});
					} else if (!row.deleted && !row.id) {
						await addRace(event.id, {
							raceDate: row.raceDate,
							distance: parseFloat(row.distance),
							isKilometers: row.isKilometers,
							comments: row.comments.trim() || undefined,
							hasVirtualOption: row.hasVirtualOption,
							isPartOfChallenge: row.isPartOfChallenge,
						});
					}
				}
			} else {
				// Create new event with races
				await createEvent({
					title: title.trim(),
					link: link.trim() || undefined,
					location: location.trim() || undefined,
					comments: comments.trim() || undefined,
					races: activeRows.map((r) => ({
						raceDate: r.raceDate,
						distance: parseFloat(r.distance),
						isKilometers: r.isKilometers,
						comments: r.comments.trim() || undefined,
						hasVirtualOption: r.hasVirtualOption,
						isPartOfChallenge: r.isPartOfChallenge,
					})),
				});
			}
			onSaved();
		} catch {
			setFormError('Failed to save. Please try again.');
		}
	}, [title, link, location, comments, raceRows, isEditing, event, createEvent, updateEvent, addRace, updateRace, deleteRace, onSaved]);

	/** Delete entire event */
	const handleDelete = useCallback(async () => {
		if (!event) return;
		try {
			const confirmed = await showConfirm({
				title: 'Delete Event',
				message: 'Are you sure you want to permanently delete this event and all its races? This action cannot be undone.',
				submitText: 'Delete',
				cancelText: 'Cancel',
			});
			if (!confirmed) return;
			await deleteEvent(event.id);
			onSaved();
		} catch {
			setFormError('Failed to delete event.');
		}
	}, [event, deleteEvent, onSaved]);

	const panelTitle = isEditing ? `Edit: ${event?.title ?? 'Event'}` : 'Add Community Event';

	const footer = isOwner ? (
		<View style={styles.footerRow}>
			<Button title="Cancel" variant="secondary" onPress={onClose} />
			<Button
				title={isEditing ? 'Save Changes' : 'Create Event'}
				variant="primary"
				onPress={handleSubmit}
				loading={actionLoading}
			/>
		</View>
	) : undefined;

	return (
		<Panel
			isOpen={isOpen}
			onClose={onClose}
			headerTitle={panelTitle}
			width="large"
			footer={footer}
		>
			<View style={styles.container}>
				{/* Event Title */}
				<View>
					<Text style={[styles.fieldLabel, themedStyles.fieldLabel]}>Title *</Text>
					<TextInput
						style={[styles.textInput, themedStyles.textInput]}
						value={title}
						onChangeText={setTitle}
						placeholder="Event name"
						placeholderTextColor={colors.textDisabled}
						editable={isOwner}
						maxLength={200}
					/>
				</View>

				{/* Link */}
				<View>
					<Text style={[styles.fieldLabel, themedStyles.fieldLabel]}>Event Link</Text>
					<TextInput
						style={[styles.textInput, themedStyles.textInput]}
						value={link}
						onChangeText={setLink}
						placeholder="https://..."
						placeholderTextColor={colors.textDisabled}
						editable={isOwner}
						maxLength={500}
						autoCapitalize="none"
						keyboardType="url"
					/>
				</View>

				{/* Location */}
				<View>
					<Text style={[styles.fieldLabel, themedStyles.fieldLabel]}>Location</Text>
					<TextInput
						style={[styles.textInput, themedStyles.textInput]}
						value={location}
						onChangeText={setLocation}
						placeholder="Event location"
						placeholderTextColor={colors.textDisabled}
						editable={isOwner}
						maxLength={300}
					/>
				</View>

				{/* Comments */}
				<View>
					<Text style={[styles.fieldLabel, themedStyles.fieldLabel]}>Comments</Text>
					<TextInput
						style={[styles.textArea, themedStyles.textArea]}
						value={comments}
						onChangeText={setComments}
						placeholder="Additional details..."
						placeholderTextColor={colors.textDisabled}
						editable={isOwner}
						maxLength={1000}
						multiline
						numberOfLines={3}
					/>
				</View>

				{/* Races */}
				<Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Races</Text>

				{raceRows.filter((r) => !r.deleted).map((row, index) => (
					<View key={row.key} style={[styles.raceSection, themedStyles.raceSection]}>
						<View style={styles.raceHeader}>
							<Text style={[styles.raceNumber, themedStyles.raceNumber]}>
								Race {index + 1}
							</Text>
							{isOwner && raceRows.filter((r) => !r.deleted).length > 1 && (
								<Pressable onPress={() => removeRow(row.key)}>
									<Ionicons name="trash-outline" size={18} color={colors.error} />
								</Pressable>
							)}
						</View>

						{/* Date */}
						<View>
							<Text style={[styles.fieldLabel, themedStyles.fieldLabel]}>Race Date *</Text>
							<TouchableOpacity
								style={[styles.dateButton, { borderColor: colors.border }]}
								onPress={() => isOwner && setShowDatePickerKey(row.key)}
								disabled={!isOwner}
							>
								<Text style={{ color: colors.textPrimary }}>{formatDate(row.raceDate)}</Text>
							</TouchableOpacity>
							<DatePicker
								value={row.raceDate}
								onChange={(dateString: string) => {
									setShowDatePickerKey(null);
									updateRow(row.key, 'raceDate', dateString);
								}}
								isVisible={showDatePickerKey === row.key}
								onDismiss={() => setShowDatePickerKey(null)}
							/>
						</View>

						{/* Distance + unit */}
						<View>
							<Text style={[styles.fieldLabel, themedStyles.fieldLabel]}>Distance *</Text>
							<View style={styles.distanceRow}>
								<TextInput
									style={[styles.distanceInput, themedStyles.distanceInput]}
									value={row.distance}
									onChangeText={(v) => updateRow(row.key, 'distance', v)}
									placeholder="e.g. 13.1"
									placeholderTextColor={colors.textDisabled}
									keyboardType="decimal-pad"
									editable={isOwner}
								/>
								<View style={[styles.unitToggle, themedStyles.unitToggle]}>
									<Pressable
										style={[
											styles.unitButton,
											!row.isKilometers ? themedStyles.unitButtonActive : themedStyles.unitButton,
										]}
										onPress={() => isOwner && updateRow(row.key, 'isKilometers', false)}
									>
										<Text
											style={[
												styles.unitButtonText,
												!row.isKilometers ? themedStyles.unitButtonTextActive : themedStyles.unitButtonText,
											]}
										>
											mi
										</Text>
									</Pressable>
									<Pressable
										style={[
											styles.unitButton,
											row.isKilometers ? themedStyles.unitButtonActive : themedStyles.unitButton,
										]}
										onPress={() => isOwner && updateRow(row.key, 'isKilometers', true)}
									>
										<Text
											style={[
												styles.unitButtonText,
												row.isKilometers ? themedStyles.unitButtonTextActive : themedStyles.unitButtonText,
											]}
										>
											km
										</Text>
									</Pressable>
								</View>
							</View>
						</View>

						{/* Checkboxes */}
						<View style={styles.checkboxRow}>
							<Checkbox
								label="Virtual option available"
								checked={row.hasVirtualOption}
								onToggle={(v) => updateRow(row.key, 'hasVirtualOption', v)}
								disabled={!isOwner}
							/>
							<Checkbox
								label="Part of a challenge"
								checked={row.isPartOfChallenge}
								onToggle={(v) => updateRow(row.key, 'isPartOfChallenge', v)}
								disabled={!isOwner}
							/>
						</View>

						{/* Race comments */}
						<View>
							<Text style={[styles.fieldLabel, themedStyles.fieldLabel]}>Race Comments</Text>
							<TextInput
								style={[styles.textInput, themedStyles.textInput]}
								value={row.comments}
								onChangeText={(v) => updateRow(row.key, 'comments', v)}
								placeholder="Race-specific notes..."
								placeholderTextColor={colors.textDisabled}
								editable={isOwner}
								maxLength={500}
							/>
						</View>
					</View>
				))}

				{isOwner && (
					<View style={styles.addRaceButton}>
						<Button
							title="Add Race"
							variant="ghost"
							onPress={addRow}
							icon={<Ionicons name="add-circle-outline" size={18} color={colors.primary} />}
						/>
					</View>
				)}

				{/* Error message */}
				{formError ? (
					<Text style={[styles.errorText, themedStyles.errorText]}>{formError}</Text>
				) : null}

				{/* Delete event (owner only, edit mode) */}
				{isEditing && isOwner && (
					<View style={[styles.deleteSection, themedStyles.deleteSection]}>
						<Text style={[styles.deleteLabel, themedStyles.deleteLabel]}>
							Permanently remove this event and all races?
						</Text>
						<Button
							title="Delete Event"
							variant="ghost"
							onPress={handleDelete}
							loading={actionLoading}
							icon={<Ionicons name="trash-outline" size={18} color={colors.error} />}
						/>
					</View>
				)}
			</View>
		</Panel>
	);
}
