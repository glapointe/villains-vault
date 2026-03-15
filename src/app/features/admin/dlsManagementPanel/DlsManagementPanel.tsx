/**
 * DLS Management Panel Component
 * 
 * Admin panel for managing DLS (Dead Last Start) races and declarations.
 * Allows creating DLS races, adding bib numbers, viewing declarations,
 * and processing declarations after scraping.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Platform, Modal } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useDialog } from '../../../contexts/DialogContext';
import { getThemedColors } from '../../../theme';
import { Panel, Button, MessageBox, DatePicker } from '../../../components/ui';
import { api, setAuthToken } from '../../../services/api';
import type { DlsRace, DlsDeclaration } from '../../../models';
import { formatDate } from '../../../utils';
import { parseDlsCsv } from './parseDlsCsv';
import { styles, getThemedStyles } from './DlsManagementPanel.styles';

/**
 * Props for DlsManagementPanel
 */
export interface DlsManagementPanelProps {
	/** Whether the panel is open */
	isOpen: boolean;
	/** Callback when panel is closed */
	onClose: () => void;
	/** Access token for API calls */
	accessToken: string;
}

type PanelView = 'list' | 'create' | 'detail';

/**
 * DLS Management Panel Component
 * 
 * Provides admin interface for managing DLS races and declarations.
 */
const DlsManagementPanel: React.FC<DlsManagementPanelProps> = ({
	isOpen,
	onClose,
	accessToken,
}): React.ReactElement => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const { showConfirm } = useDialog();

	// State
	const [view, setView] = useState<PanelView>('list');
	const [races, setRaces] = useState<DlsRace[]>([]);
	const [selectedRace, setSelectedRace] = useState<DlsRace | null>(null);
	const [declarations, setDeclarations] = useState<DlsDeclaration[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string>('');
	const [success, setSuccess] = useState<string>('');
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

	// Create form state
	const [newRaceName, setNewRaceName] = useState<string>('');
	const [newRaceDate, setNewRaceDate] = useState<string>(new Date().toISOString());

	// Process declarations state
	const [processRaceId, setProcessRaceId] = useState<string>('');

	// Year filter state — defaults to current year
	const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

	// Import state
	const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
	const [importing, setImporting] = useState<boolean>(false);
	const [importCsvText, setImportCsvText] = useState<string>('');
	const [importFileName, setImportFileName] = useState<string>('');
	const [importedIds, setImportedIds] = useState<Set<number>>(new Set());
	const [updatedIds, setUpdatedIds] = useState<Set<number>>(new Set());

	/** Derive distinct years from race dates, sorted descending */
	const availableYears = useMemo(() => {
		const years = [...new Set(races.map((r) => new Date(r.raceDate).getFullYear()))];
		years.sort((a, b) => b - a);
		return years;
	}, [races]);

	/** Races filtered to the selected year */
	const filteredRaces = useMemo(() => {
		if (!selectedYear) return races;
		let filtered = races.filter((r) => new Date(r.raceDate).getFullYear() === selectedYear);
		if (filtered.length === 0 && races.length > 0 && availableYears.length === 1) {
			return races;
		}
		return filtered;
	}, [races, selectedYear, availableYears]);

	/** Parse the current import text for a live row-count preview */
	const csvPreview = useMemo(() => {
		if (!importCsvText.trim()) return null;
		return parseDlsCsv(importCsvText);
	}, [importCsvText]);

	/**
	 * Load DLS races
	 */
	const loadRaces = useCallback(async (): Promise<void> => {
		setLoading(true);
		setError('');
		try {
			setAuthToken(accessToken);
			const result = await api.dls.adminGetRaces(false);
			setRaces(result);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load DLS races');
		} finally {
			setLoading(false);
		}
	}, [accessToken]);

	/**
	 * Load declarations for a race
	 */
	const loadDeclarations = useCallback(async (dlsRaceId: number): Promise<void> => {
		setLoading(true);
		try {
			setAuthToken(accessToken);
			const result = await api.dls.adminGetDeclarations(dlsRaceId);
			setDeclarations(result);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load declarations');
		} finally {
			setLoading(false);
		}
	}, [accessToken]);

	// Load races when panel opens; reset import highlights when it closes
	useEffect(() => {
		if (isOpen) {
			loadRaces();
			// setView('list');
			setError('');
			setSuccess('');
		} else {
			setImportedIds(new Set());
			setUpdatedIds(new Set());
		}
	}, [isOpen, loadRaces]);

	/**
	 * Create a new DLS race
	 */
	const handleCreateRace = async (): Promise<void> => {
		if (!newRaceName.trim() || !newRaceDate.trim()) {
			setError('Name and date are required');
			return;
		}

		setLoading(true);
		setError('');
		try {
			setAuthToken(accessToken);
			await api.dls.adminCreateRace({
				name: newRaceName.trim(),
				raceDate: newRaceDate,
			});
			setSuccess('DLS race created successfully');
			setNewRaceName('');
			setNewRaceDate('');
			setView('list');
			await loadRaces();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to create DLS race');
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Delete a DLS race
	 */
	const handleDeleteRace = async (dlsRaceId: number): Promise<void> => {
		const confirmed = await showConfirm({
			title: 'Delete DLS Race',
			message: 'This will delete the race and all its declarations. Continue?',
			submitText: 'Delete',
			cancelText: 'Cancel',
		});
		if (!confirmed) return;

		setLoading(true);
		setError('');
		try {
			setAuthToken(accessToken);
			await api.dls.adminDeleteRace(dlsRaceId);
			setSuccess('DLS race deleted');
			await loadRaces();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete race');
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Open race detail view
	 */
	const handleViewRace = async (race: DlsRace): Promise<void> => {
		setSelectedRace(race);
		setView('detail');
		await loadDeclarations(race.id);
	};

	/**
	 * Delete a declaration with confirmation
	 */
	const handleDeleteDeclaration = async (declarationId: number): Promise<void> => {
		if (!selectedRace) return;

		const confirmed = await showConfirm({
			title: 'Remove Declaration',
			message: 'Are you sure you want to remove this declaration?',
			submitText: 'Remove',
			cancelText: 'Cancel',
		});
		if (!confirmed) return;

		setLoading(true);
		setError('');
		try {
			setAuthToken(accessToken);
			await api.dls.adminDeleteDeclaration(declarationId);
			await loadDeclarations(selectedRace.id);
			await loadRaces();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete declaration');
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Process declarations after scrape
	 */
	const handleProcessDeclarations = async (): Promise<void> => {
		if (!selectedRace) return;

		const raceIdStr = processRaceId.trim() || (selectedRace.raceId ? String(selectedRace.raceId) : '');
		if (!raceIdStr) return;

		const raceId = parseInt(raceIdStr, 10);
		if (isNaN(raceId)) {
			setError('Invalid race ID');
			return;
		}

		setLoading(true);
		setError('');
		try {
			setAuthToken(accessToken);
			const result = await api.dls.adminProcessDeclarations(selectedRace.id, raceId);
			setSuccess(`Processed! ${result.claimsCreated} follow claims created.`);
			setProcessRaceId('');
			await loadDeclarations(selectedRace.id);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to process declarations');
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Web: open a browser file dialog and load the chosen CSV into state
	 */
	const handleWebPickFile = (): void => {
		if (Platform.OS !== 'web') return;
		const input = (window as any).document.createElement('input') as HTMLInputElement;
		input.type = 'file';
		input.accept = '.csv,text/csv';
		input.onchange = (e: Event) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;
			setImportFileName(file.name);
			const reader = new FileReader();
			reader.onload = (evt) => {
				setImportCsvText((evt.target?.result as string) ?? '');
			};
			reader.readAsText(file);
		};
		input.click();
	};

	/** Close import modal and reset its local state */
	const closeImportModal = (): void => {
		setImportModalOpen(false);
		setImportCsvText('');
		setImportFileName('');
	};

	/**
	 * Parse CSV text and send to the import API
	 */
	const handleImport = async (): Promise<void> => {
		if (!selectedRace || !csvPreview || csvPreview.rows.length === 0) return;

		const existingIds = new Set(declarations.map((d) => d.id));
		setImporting(true);
		setError('');
		try {
			setAuthToken(accessToken);
			const affected = await api.dls.adminImportDeclarations(selectedRace.id, csvPreview.rows);
			const newIds = new Set<number>();
			const upIds = new Set<number>();
			for (const d of affected) {
				if (existingIds.has(d.id)) upIds.add(d.id);
				else newIds.add(d.id);
			}
			setImportedIds(newIds);
			setUpdatedIds(upIds);

			await loadDeclarations(selectedRace.id);
			await loadRaces();
			setSuccess(`Import complete: ${newIds.size} added, ${upIds.size} updated.`);
			closeImportModal();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to import declarations');
		} finally {
			setImporting(false);
		}
	};

	/**
	 * Export declarations as CSV including all declaration fields
	 */
	const handleExportCsv = (): void => {
		if (!selectedRace || declarations.length === 0) return;

		const header = 'Name,Bib,First DLS,Going for Kills,Comments';
		const rows = declarations.map((d) => {
			const name = (d.userDisplayName || 'Unclaimed').replace(/"/g, '""');
			const bib = d.bibNumber ?? '';
			const firstDls = d.isFirstDls ? 'Yes' : 'No';
			const goingForKills = d.isGoingForKills ? 'Yes' : 'No';
			const comments = (d.comments ?? '').replace(/"/g, '""');
			return `"${name}",${bib},${firstDls},${goingForKills},"${comments}"`;
		});
		const csv = [header, ...rows].join('\n');
		const filename = `dls_${selectedRace.name.replace(/[^a-zA-Z0-9]/g, '_')}_declarations.csv`;

		if (Platform.OS === 'web') {
			const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} else {
			// Native: share via system dialog
			import('expo-sharing').then(async (Sharing) => {
				const { Paths, File } = await import('expo-file-system/next');
				const file = new File(Paths.cache, filename);
				file.create({ overwrite: true });
				file.write(csv);
				await Sharing.shareAsync(file.uri, {
					mimeType: 'text/csv',
					dialogTitle: 'Export DLS Declarations',
					UTI: 'public.comma-separated-values-text',
				});
			}).catch(() => {
				setError('Sharing is not available on this device');
			});
		}
	};

	/**
	 * Render the CSV import dialog
	 */
	const renderImportModal = (): React.ReactElement => {
		const isReady = (csvPreview?.rows.length ?? 0) > 0;
		return (
			<Modal
				visible={importModalOpen}
				transparent
				animationType="fade"
				onRequestClose={closeImportModal}
			>
				<View style={styles.importOverlay}>
					<View style={[styles.importDialog, themedStyles.importDialog]}>
						<Text style={[styles.importTitle, themedStyles.importTitle]}>Import Declarations</Text>

						<Text style={[styles.importHint, themedStyles.importHint]}>
							{'Upload a CSV with any combination of these columns (matched flexibly, only '}
							<Text style={themedStyles.importTag}>bib</Text>
							{' is required):\n'}
							{'\u2022 '}<Text style={themedStyles.importTag}>name</Text>{' / villain — runner name (matched to user accounts)\n'}
							{'\u2022 '}<Text style={themedStyles.importTag}>bib</Text>{' / # / num — bib number\n'}
							{'\u2022 '}<Text style={themedStyles.importTag}>first</Text>{' / 1st — first-DLS flag (y/yes/1/true)\n'}
							{'\u2022 '}<Text style={themedStyles.importTag}>kill</Text>{' — going-for-kills flag (y/yes/1/true)\n'}
							{'\u2022 '}<Text style={themedStyles.importTag}>comment</Text>{' / note / info — comments'}
						</Text>

						{Platform.OS === 'web' && (
							<View style={styles.importFileRow}>
								<Button title="Choose File" onPress={handleWebPickFile} variant="secondary" />
								<Text style={[styles.importFileName, themedStyles.importFileName]} numberOfLines={1}>
									{importFileName || 'No file selected'}
								</Text>
							</View>
						)}

						<TextInput
							style={[styles.textArea, themedStyles.textArea, { minHeight: 120 }]}
							value={importCsvText}
							onChangeText={setImportCsvText}
							placeholder={'Paste CSV here or use Choose File above\nname,bib,first dls,kills,comments\nVillain One,1234,yes,no,Let\'s go!'}
							placeholderTextColor={colors.textTertiary}
							multiline
						/>

						{csvPreview !== null && (
							<ScrollView style={[styles.importPreview, themedStyles.importPreview]}>
								<Text style={[styles.importPreviewText, themedStyles.importPreviewText]}>
									{csvPreview.rows.length > 0
										? `${csvPreview.rows.length} row${csvPreview.rows.length !== 1 ? 's' : ''} ready to import${csvPreview.skipped > 0 ? ` · ${csvPreview.skipped} skipped (no valid bib)` : ''}`
										: `No valid rows found${csvPreview.skipped > 0 ? ` · ${csvPreview.skipped} row${csvPreview.skipped !== 1 ? 's' : ''} skipped (no valid bib)` : ''}`
									}
								</Text>
								{csvPreview.warnings.map((w, i) => (
									<Text key={i} style={[styles.importWarning, themedStyles.importWarning]}>{w}</Text>
								))}
							</ScrollView>
						)}

						<View style={styles.importButtonRow}>
							<Button title="Cancel" onPress={closeImportModal} variant="ghost" disabled={importing} />
							<Button
								title={importing ? 'Importing…' : 'Import'}
								onPress={handleImport}
								variant="primary"
								disabled={importing || !isReady}
								loading={importing}
							/>
						</View>
					</View>
				</View>
			</Modal>
		);
	};

	/**
	 * Render the race list view
	 */
	const renderListView = (): React.ReactElement => (
		<View style={styles.container}>
			<View style={styles.sectionHeader}>
				<Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>DLS Races</Text>
				<Button title="+ New Race" onPress={() => setView('create')} variant="primary" />
			</View>

			{/* Year filter */}
			{availableYears.length > 1 && (
				<View style={styles.yearFilterRow}>
					{availableYears.map((year) => (
						<TouchableOpacity
							key={year}
							style={[
								styles.yearChip,
								selectedYear === year
									? themedStyles.yearChipActive
									: themedStyles.yearChip,
							]}
							onPress={() => setSelectedYear(year)}
							activeOpacity={0.7}
						>
							<Text style={[
								styles.yearChipText,
								selectedYear === year
									? themedStyles.yearChipTextActive
									: themedStyles.yearChipText,
							]}>
								{year}
							</Text>
						</TouchableOpacity>
					))}
				</View>
			)}

			{filteredRaces.length === 0 && !loading ? (
				<Text style={[styles.emptyText, themedStyles.emptyText]}>
					No DLS races yet. Create one to get started.
				</Text>
			) : (
				filteredRaces.map((race) => (
					<TouchableOpacity
						key={race.id}
						style={[styles.raceCard, themedStyles.raceCard]}
						onPress={() => handleViewRace(race)}
						activeOpacity={0.7}
					>
						<View style={styles.raceHeader}>
							<Text style={[styles.raceName, themedStyles.raceName]}>{race.name}</Text>
							<Button
								title="Delete"
								onPress={() => handleDeleteRace(race.id)}
								variant="ghost"
							/>
						</View>
						<Text style={[styles.raceDate, themedStyles.raceDate]}>
							{formatDate(race.raceDate)}
						</Text>
						<Text style={[styles.declarationCount, themedStyles.declarationCount]}>
							{race.declarationCount} declaration{race.declarationCount !== 1 ? 's' : ''}
						</Text>
					</TouchableOpacity>
				))
			)}
		</View>
	);

	/**
	 * Render the create race form
	 */
	const renderCreateView = (): React.ReactElement => (
		<View style={styles.container}>
			<View style={styles.sectionHeader}>
				<Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>New DLS Race</Text>
				<Button title="Back" onPress={() => setView('list')} variant="ghost" />
			</View>

			<View style={styles.formGroup}>
				<Text style={[styles.label, themedStyles.label]}>Race Name *</Text>
				<TextInput
					style={[styles.input, themedStyles.input]}
					value={newRaceName}
					onChangeText={setNewRaceName}
					placeholder="e.g. Princess Half Marathon 2025"
					placeholderTextColor={colors.textTertiary}
				/>
			</View>

			<View style={styles.formGroup}>
				<Text style={[styles.label, themedStyles.label]}>Race Date *</Text>
				<TouchableOpacity
					style={[styles.dateButton, { borderColor: colors.border }]}
					onPress={() => setShowDatePicker(true)}
				>
					<Text style={{ color: colors.textPrimary }}>{formatDate(newRaceDate)}</Text>
				</TouchableOpacity>
				<DatePicker
					value={newRaceDate}
					onChange={(dateString: string) => {
						setShowDatePicker(false);
						setNewRaceDate(dateString);
					}}
					isVisible={showDatePicker}
					onDismiss={() => {
						setShowDatePicker(false);
					}}
				/>
			</View>

			<View style={styles.buttonRow}>
				<Button title="Cancel" onPress={() => setView('list')} variant="ghost" />
				<Button
					title={loading ? 'Creating...' : 'Create Race'}
					onPress={handleCreateRace}
					variant="primary"
					disabled={loading || !newRaceName.trim() || !newRaceDate.trim()}
				/>
			</View>
		</View>
	);

	const getUserDisplayNameComment = (declaration: DlsDeclaration): { comment: string|null; userDisplayName: string|null } => {
		// If the userId is null, this declaration is unclaimed. In that case, if the comments field contains a name in brackets, extract that as the display name and remove it from the comment.
		let userDisplayName = declaration.userDisplayName;
		let comment = declaration.comments;
		if (!declaration.userId && comment?.startsWith('[')) {
			const endIndex = comment.indexOf(']');
			if (endIndex !== -1) {
				userDisplayName = `${comment.substring(1, endIndex).trim()} (unclaimed)`;
				comment = comment.substring(endIndex + 1).trim();
			}
		}
		if (comment === '') comment = null;
		if (userDisplayName === '') userDisplayName = null;
		return { comment, userDisplayName };
	};

	/**
	 * Render the race detail view with declarations
	 */
	const renderDetailView = (): React.ReactElement | null => {
		if (!selectedRace) return null;

		return (
			<View style={styles.container}>
				<View style={styles.sectionHeader}>
					<Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>
						{selectedRace.name}
					</Text>
					<Button title="Back" onPress={() => setView('list')} variant="ghost" />
				</View>

				<Text style={[styles.raceDate, themedStyles.raceDate]}>
					{formatDate(selectedRace.raceDate)}
				</Text>

				{/* Process Declarations */}
				<View style={[styles.processSection, themedStyles.processSection]}>
					<Text style={[styles.label, themedStyles.label]}>
						{selectedRace.raceId ? 'Reprocess Declarations' : 'Process After Scrape'}
					</Text>
					{selectedRace.raceId && (
						<Text style={[styles.declarationCount, themedStyles.declarationCount]}>
							Currently linked to Race ID: {selectedRace.raceId}
						</Text>
					)}
					<Text style={[styles.raceDate, themedStyles.raceDate]}>
						{selectedRace.raceId
							? 'Reprocess to pick up new declarations since last run'
							: 'Link this DLS race to a scraped race and auto-create follow entries'}
					</Text>
					<View style={{ flexDirection: 'row', gap: 8 }}>
						<TextInput
							style={[styles.input, themedStyles.input, { flex: 1 }]}
							value={processRaceId}
							onChangeText={setProcessRaceId}
							placeholder={selectedRace.raceId ? String(selectedRace.raceId) : 'Scraped Race ID'}
							placeholderTextColor={colors.textTertiary}
							keyboardType="numeric"
						/>
						<Button
							title={selectedRace.raceId ? 'Reprocess' : 'Process'}
							onPress={handleProcessDeclarations}
							variant="primary"
							disabled={loading || (!processRaceId.trim() && !selectedRace.raceId)}
						/>
					</View>
				</View>

				{/* Declarations List */}
				<View style={[styles.sectionHeader, { marginTop: 16 }]}>
					<Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>
						Declarations ({declarations.length})
					</Text>
					<View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
						<Button title="Import CSV" onPress={() => setImportModalOpen(true)} variant="ghost" />
						{declarations.length > 0 && (
							<Button title="Export CSV" onPress={handleExportCsv} variant="ghost" />
						)}
					</View>
				</View>

				{declarations.length === 0 ? (
					<Text style={[styles.emptyText, themedStyles.emptyText]}>
						No declarations yet
					</Text>
				) : (
					declarations.map((d) => (
							<View
								key={d.id}
								style={[
									styles.declarationRow,
									themedStyles.declarationRow,
									importedIds.has(d.id) ? [styles.declarationRowNew, themedStyles.declarationRowNew] : null,
									updatedIds.has(d.id) ? [styles.declarationRowUpdated, themedStyles.declarationRowUpdated] : null,
								]}
							>
							<View style={styles.declarationInfo}>
								<Text style={[styles.declarationBib, themedStyles.declarationBib]}>
									{d.bibNumber ? `Bib #${d.bibNumber}` : 'No bib'}
								</Text>
								<Text style={[styles.declarationUser, themedStyles.declarationUser]}>
									{getUserDisplayNameComment(d).userDisplayName || 'Unclaimed'}
								</Text>
								{(d.isFirstDls || d.isGoingForKills) && (
									<View style={styles.declarationBadges}>
										{d.isFirstDls && (
											<Text style={[styles.declarationBadge, themedStyles.declarationBadgeFirst]}>
												First DLS
											</Text>
										)}
										{d.isGoingForKills && (
											<Text style={[styles.declarationBadge, themedStyles.declarationBadgeKills]}>
												Going for kills
											</Text>
										)}
									</View>
								)}
								{getUserDisplayNameComment(d).comment ? (
									<Text style={[styles.declarationComment, themedStyles.declarationComment]} numberOfLines={2}>
										{getUserDisplayNameComment(d).comment}
									</Text>
								) : null}
							</View>
							<Button
								title="✕"
								onPress={() => handleDeleteDeclaration(d.id)}
								variant="ghost"
							/>
						</View>
					))
				)}
			</View>
		);
	};

	return (
		<Panel isOpen={isOpen} onClose={onClose} headerTitle="DLS Race Management" width="large">
			{renderImportModal()}
			<ScrollView>
				{error ? <MessageBox type="error" message={error} onDismiss={() => setError('')} /> : null}
				{success ? <MessageBox type="success" message={success} onDismiss={() => setSuccess('')} /> : null}

				{view === 'list' && renderListView()}
				{view === 'create' && renderCreateView()}
				{view === 'detail' && renderDetailView()}
			</ScrollView>
		</Panel>
	);
};

export default DlsManagementPanel;
