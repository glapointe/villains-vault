/**
 * Event Submission Panel Component
 * 
 * Handles the complete workflow for admins to submit new race weekend events.
 * Step 1: Enter event URL for scraping
 * Step 2: Fill in event and race details from scraped data
 * Step 3: Submit to create parsing jobs
 * Step 4: Display job status (handled by JobStatusPanel)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { Panel, Button, MessageBox, DatePicker, RichTextDialog, Dropdown, Checkbox } from '../../../components/ui';
import { api, setAuthToken } from '../../../services/api';
import type { SubmitEventRequest, SubmitEventResponse, EventPreview, SubmitRace } from '../../../models';
import { RaceDistance, ALL_RACE_DISTANCES, getRaceDistanceLabel } from '../../../models';
import { formatDate, ensureDateWithTime, getCurrentDateString } from '../../../utils';
import { isValidUrl as validateUrl } from '../../../utils';
import { styles } from './EventSubmissionPanel.styles';

/**
 * Props for EventSubmissionPanel
 */
export interface EventSubmissionPanelProps {
    /** Whether the panel is open */
    isOpen: boolean;
    /** Callback when panel is closed */
    onClose: () => void;
    /** Callback when event is successfully submitted with job IDs */
    onJobsCreated?: (response: SubmitEventResponse) => void;
    /** Access token for API calls */
    accessToken: string;
    /** Optional event URL for edit mode - when provided, skips step 1 */
    eventUrl?: string;
}

/**
 * Event Submission Panel Component
 * 
 * Guides admins through submitting a new event for parsing with enhanced UI.
 */
export const EventSubmissionPanel: React.FC<EventSubmissionPanelProps> = ({
    isOpen,
    onClose,
    onJobsCreated,
    accessToken,
    eventUrl: initialEventUrl,
}): React.ReactElement => {
    const { isDark } = useTheme();
    const colors = getThemedColors(isDark);
    const isEditMode = Boolean(initialEventUrl);

	/**
	 * Get background color for input fields based on theme
	 */
    const getInputBackground = (): string => isDark ? '#1a1a2e' : '#f3f4f6';

	/**
	 * Get background color for card elements based on theme
	 */
    const getCardBackground = (): string => isDark ? '#1a1a2e' : '#f9fafb';

    // Step 1: URL input state
    const [step, setStep] = useState<'url' | 'details' | 'loading'>(isEditMode ? 'loading' : 'url');
    const [eventUrl, setEventUrl] = useState<string>(initialEventUrl || '');
    const [editableUrl, setEditableUrl] = useState<string>(initialEventUrl || '');
    const [urlError, setUrlError] = useState<string>('');
    const [previewData, setPreviewData] = useState<EventPreview | null>(null);

    // Step 2: Event details state
    const [eventName, setEventName] = useState<string>('');
    const [races, setRaces] = useState<(SubmitRace & { isExisting?: boolean; resultCount?: number })[]>([]);
    const [detailsError, setDetailsError] = useState<string>('');

    // Date/Notes modal state
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    const [selectedDateIndex, setSelectedDateIndex] = useState<number>(-1);
    const [showNotesModal, setShowNotesModal] = useState<boolean>(false);
    const [selectedNotesIndex, setSelectedNotesIndex] = useState<number>(-1);

	/**
	 * Validate URL format and check for required fields
	 */
    const isValidUrl = (): boolean => {
        if (!eventUrl.trim()) {
            setUrlError('Event URL is required');
            return false;
        }

        if (!validateUrl(eventUrl)) {
            setUrlError('Invalid URL format');
            return false;
        }

        setUrlError('');
        return true;
    };

	/**
	 * Handle event URL submission - fetch preview data
	 */
    const handleUrlSubmit = async (): Promise<void> => {
        if (!isValidUrl()) {
            return;
        }

        setStep('loading');
        try {
            setAuthToken(accessToken);
            const preview = await api.events.preview(eventUrl);
            setPreviewData(preview);
            setEventName(preview.name || '');
            setEditableUrl(eventUrl);
            
            setRaces(
                preview.races?.map((race) => ({
                    url: race.url || eventUrl,
                    name: race.name || '',
                    raceDate: ensureDateWithTime(race.raceDate),
                    distance: race.distance || 0,
                    shouldProcess: isEditMode ? false : true,
                    notes: race.notes || '',
                    isExisting: race.isExisting,
                    resultCount: race.resultCount || 0,
                })) || []
            );
            setStep('details');
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to fetch event preview';
            setUrlError(errorMsg);
            setStep('url');
        }
    };

	/**
	 * Handle re-parsing with edited URL
	 */
    const handleReparseEvent = async (): Promise<void> => {
        if (!editableUrl.trim()) {
            setDetailsError('URL cannot be empty');
            return;
        }

        try {
            new URL(editableUrl);
        } catch {
            setDetailsError('Invalid URL format');
            return;
        }

        setStep('loading');
        try {
            setAuthToken(accessToken);
            setEventUrl(editableUrl);
            const preview = await api.events.preview(editableUrl);
            setPreviewData(preview);
            setEventName(preview.name || '');
            
            setRaces(
                preview.races?.map((race) => ({
                    url: race.url || editableUrl,
                    name: race.name || '',
                    raceDate: ensureDateWithTime(race.raceDate),
                    distance: race.distance || 0,
                    shouldProcess: isEditMode ? false : true,
                    notes: '',
                })) || []
            );
            setDetailsError('');
            setStep('details');
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to fetch event preview';
            setDetailsError(errorMsg);
            setStep('details');
        }
    };

	/**
	 * Validate event details - returns validation result without side effects
	 * This is used in render path (disabled prop) so cannot call setState
	 */
    const isDetailsValid = (): boolean => {
        if (!eventName.trim()) {
            return false;
        }

        if (races.length === 0) {
            return false;
        }

        const invalidRaces = races.filter((r) => !r.name.trim() || !r.raceDate.trim() || r.distance === 0 || !r.url.trim());
        if (invalidRaces.length > 0) {
            return false;
        }

        return true;
    };

	/**
	 * Validate and set error messages for event details
	 * Called before submission to display errors
	 */
    const validateAndSetErrors = (): boolean => {
        if (!eventName.trim()) {
            setDetailsError('Event name is required');
            return false;
        }

        if (races.length === 0) {
            setDetailsError('At least one race is required');
            return false;
        }

        const invalidRaces = races.filter((r) => !r.name.trim() || !r.raceDate.trim() || r.distance === 0);
        if (invalidRaces.length > 0) {
            setDetailsError('All races must have a name, date, and distance');
            return false;
        }

        // Check for duplicate dates
        const dateCounts = new Map<string, number>();
        races.forEach(race => {
            const count = dateCounts.get(race.raceDate) || 0;
            dateCounts.set(race.raceDate, count + 1);
        });

        const duplicateDates = Array.from(dateCounts.entries())
            .filter(([_, count]) => count > 1)
            .map(([date]) => date);

        if (duplicateDates.length > 0) {
            const formattedDates = duplicateDates.map(date => formatDate(date)).join(', ');
            setDetailsError(`Multiple races cannot have the same date. Duplicate dates found: ${formattedDates}`);
            return false;
        }

        setDetailsError('');
        return true;
    };

	/**
	 * Handle event submission - create parsing jobs
	 */
    const handleEventSubmit = async (): Promise<void> => {
        if (!validateAndSetErrors()) {
            return;
        }

        setStep('loading');
        try {
            setAuthToken(accessToken);
            const request: SubmitEventRequest = {
                url: editableUrl,
                name: eventName,
                races: races,
            };

            const response = await api.events.submit(request);

            if (response.errors.length > 0) {
                Alert.alert('Submission Warnings', response.errors.join('\n'));
            }

            onJobsCreated?.(response);
            resetPanel();
            onClose();
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to submit event';
            setDetailsError(errorMsg);
            setStep('details');
        }
    };

	/**
	 * Reset panel state for next submission
	 */
    const resetPanel = (): void => {
        setStep('url');
        setEventUrl('');
        setEditableUrl('');
        setUrlError('');
        setEventName('');
        setRaces([]);
        setDetailsError('');
        setPreviewData(null);
        setShowDatePicker(false);
        setShowNotesModal(false);
        setSelectedDateIndex(-1);
        setSelectedNotesIndex(-1);
    };

	/**
	 * Handle panel close
	 */
    const handleClose = (): void => {
        resetPanel();
        onClose();
    };



	/**
	 * Update a specific race field
	 */
    const updateRace = (index: number, field: keyof (SubmitRace & { isExisting?: boolean; resultCount?: number }), value: any): void => {
        const updatedRaces = [...races];
        updatedRaces[index] = { ...updatedRaces[index], [field]: value };
        setRaces(updatedRaces);
    };

	/**
	 * Handle date selection from picker
	 */
    const handleDateChange = (dateString: string): void => {
        if (selectedDateIndex >= 0) {
            updateRace(selectedDateIndex, 'raceDate', dateString);
        }
        setShowDatePicker(false);
        setSelectedDateIndex(-1);
    };

	/**
	 * Add a new empty race entry
	 */
    const handleAddRace = (): void => {
        setRaces([
            ...races,
            {
                url: editableUrl,
                name: '',
                raceDate: getCurrentDateString(),
                distance: 0,
                shouldProcess: true,
                notes: '',
            },
        ]);
    };

	/**
	 * Remove a race entry
	 */
    const handleRemoveRace = (index: number): void => {
        setRaces(races.filter((_, i) => i !== index));
    };

	/**
	 * Open date picker for a specific race
	 */
    const handleOpenDatePicker = (index: number): void => {
        setSelectedDateIndex(index);
        setShowDatePicker(true);
    };

	/**
	 * Open notes modal for a specific race
	 */
    const handleOpenNotesModal = (index: number): void => {
        setSelectedNotesIndex(index);
        setShowNotesModal(true);
    };

	/**
	 * Save notes for a race
	 */
    const handleSaveNotes = (notes: string): void => {
        if (selectedNotesIndex >= 0) {
            updateRace(selectedNotesIndex, 'notes', notes);
        }
        setShowNotesModal(false);
        setSelectedNotesIndex(-1);
    };

    /**
     * Auto-load event data when in edit mode
     */
    useEffect(() => {
        if (isEditMode && isOpen && initialEventUrl) {
            // Reset to loading and trigger fetch
            setEventUrl(initialEventUrl);
            setEditableUrl(initialEventUrl);
            setStep('loading');
            
            // Fetch preview data
            const loadEventData = async () => {
                try {
                    setAuthToken(accessToken);
                    const preview = await api.events.preview(initialEventUrl);
                    setPreviewData(preview);
                    setEventName(preview.name || '');
                    
                    setRaces(
                        preview.races?.map((race) => ({
                            url: race.url || initialEventUrl,
                            name: race.name || '',
                            raceDate: ensureDateWithTime(race.raceDate),
                            distance: race.distance || 0,
                            shouldProcess: false, // Default to false in edit mode
                            notes: race.notes || '',
                            isExisting: race.isExisting,
                            resultCount: race.resultCount || 0,
                        })) || []
                    );
                    setStep('details');
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Failed to fetch event preview';
                    setDetailsError(errorMsg);
                    setStep('url');
                }
            };
            
            loadEventData();
        }
    }, [isOpen, isEditMode, initialEventUrl]);

    return (
        <>
            <Panel
                isOpen={isOpen}
                onClose={handleClose}
                headerTitle={isEditMode ? "Edit Race Weekend Event" : "Submit Race Weekend Event"}
                showCloseButton
                width="large"
                footer={
                    step === 'url' && !isEditMode && (
                        <View style={styles.footerActions}>
                            <Button
                                title="Next: Download Event"
                                onPress={handleUrlSubmit}
                                disabled={!eventUrl.trim()}
                                style={styles.submitButton}
                            />
                        </View>
                    )
                }
            >
                <ScrollView 
                    style={{ flex: 1 }} 
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
                    showsVerticalScrollIndicator={true}
                >
                    {step === 'url' && !isEditMode && (
                        <View style={styles.stepContainer}>
                            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Step 1: Event URL</Text>
                            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                                Enter the Track Shack URL for the race weekend event
							</Text>

                            <TextInput
                                style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
                                placeholder="https://www.trackshackresults.com/disneysports/results/..."
                                placeholderTextColor={colors.textSecondary}
                                value={eventUrl}
                                onChangeText={(text: string) => {
                                    setEventUrl(text);
                                    setUrlError('');
                                }}
                                editable={step === 'url'}
                            />

                            {Boolean(urlError) && <MessageBox type="error" message={urlError} showIcon={false} />}
                        </View>
                    )}

                    {step === 'details' && (
                        <View>
                            {/* URL Section */}
                            <View style={styles.stepContainer}>
                                <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Event URL</Text>
                                <View style={[styles.urlSection, { borderColor: colors.border, backgroundColor: getInputBackground() }]}>
                                    <TextInput
                                        style={[styles.urlInput, { color: colors.textPrimary }]}
                                        value={editableUrl}
                                        onChangeText={setEditableUrl}
                                        multiline
                                        numberOfLines={2}
                                    />
                                    <TouchableOpacity
                                        onPress={handleReparseEvent}
                                        style={[styles.reparseButton, { backgroundColor: colors.textPrimary }]}
                                    >
                                        <Text style={{ color: colors.background, fontWeight: '600' }}>Re-parse</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Event Details Section */}
                            <View style={styles.stepContainer}>
                                <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Step 2: Event Details</Text>
                                <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                                    Review and edit the event and race details
								</Text>

                                <Text style={[styles.label, { color: colors.textPrimary }]}>Event Name</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
                                    value={eventName}
                                    onChangeText={setEventName}
                                    placeholder="Event name"
                                    placeholderTextColor={colors.textSecondary}
                                />

                                {/* Races Section */}
                                <View style={styles.racesSection}>
                                    <Text style={[styles.label, { color: colors.textPrimary, marginBottom: 12 }]}>Races</Text>

                                    {races.map((race, index) => (
                                        <View 
                                            key={index} 
                                            style={[
                                                styles.raceCard, 
                                                { 
                                                    borderColor: race.isExisting ? '#10b981' : colors.border, 
                                                    backgroundColor: getCardBackground(),
                                                    borderWidth: race.isExisting ? 2 : 1,
                                                }
                                            ]}
                                        >
                                            {/* Existing Race Badge */}
                                            {race.isExisting && (
                                                <View style={[styles.existingBadge, { backgroundColor: '#10b981' }]}>
                                                    <Text style={styles.existingBadgeText}>
                                                        ✓ Already Parsed - {race.resultCount?.toLocaleString() || 0} Results
                                                    </Text>
                                                </View>
                                            )}

                                            {/* Race Name */}
                                            <Text style={[styles.label, { color: colors.textPrimary, marginBottom: 8 }]}>Race Name</Text>
                                            <TextInput
                                                style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
                                                value={race.name}
                                                onChangeText={(text: string) => updateRace(index, 'name', text)}
                                                placeholder="Race name (e.g., Half Marathon)"
                                                placeholderTextColor={colors.textSecondary}
                                            />

                                            {/* Race URL */}
                                            <Text style={[styles.label, { color: colors.textPrimary, marginBottom: 8 }]}>Track Shack URL</Text>
                                            <TextInput
                                                style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
                                                value={race.url}
                                                onChangeText={(text: string) => updateRace(index, 'url', text)}
                                                placeholder="https://www.trackshackresults.com/..."
                                                placeholderTextColor={colors.textSecondary}
                                            />

                                            {/* Distance Selector */}
                                            <Text style={[styles.label, { color: colors.textPrimary, marginBottom: 8 }]}>Distance</Text>
                                            <Dropdown
                                                value={race.distance}
                                                options={ALL_RACE_DISTANCES}
                                                onChange={(value: number) => updateRace(index, 'distance', value)}
                                                placeholder="Select distance..."
                                            />

                                            {/* Race Date */}
                                            <Text style={[styles.label, { color: colors.textPrimary, marginBottom: 8 }]}>Race Date</Text>
                                            <TouchableOpacity
                                                style={[styles.dateButton, { borderColor: colors.border }]}
                                                onPress={() => handleOpenDatePicker(index)}
                                            >
                                                <Text style={{ color: colors.textPrimary }}>{formatDate(race.raceDate)}</Text>
                                            </TouchableOpacity>

                                            <View style={styles.raceActions}>
                                                <Checkbox
                                                    label="Process"
                                                    checked={race.shouldProcess}
                                                    onToggle={() => updateRace(index, 'shouldProcess', !race.shouldProcess)}
                                                />
                                                <View style={styles.raceActions}>
                                                    <Button
                                                        title={race.notes ? '📝 Edit Notes' : 'Add Notes'}
                                                        variant="secondary"
                                                        onPress={() => handleOpenNotesModal(index)}
                                                        style={styles.notesButton}
                                                    />

                                                    {races.length > 1 && (
                                                        <Button
                                                            title="Remove"
                                                            variant="danger"
                                                            onPress={() => handleRemoveRace(index)}
                                                            disabled={race.isExisting}
                                                            style={styles.removeButton}
                                                        />
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                    ))}

                                    {/* Add Race Button */}
                                    <Button
                                        title="+ Add Another Race"
                                        variant="secondary"
                                        onPress={handleAddRace}
                                        style={styles.addRaceButton}
                                    />
                                </View>

                                {Boolean(detailsError) && <MessageBox type="error" message={detailsError} showIcon={false} />}
                            </View>
                        </View>
                    )}

                    {step === 'loading' && (
                        <View style={[{ flex: 1 }, styles.centerContent]}>
                            <ActivityIndicator size="large" color={colors.textPrimary} />
                            <Text style={[styles.stepDescription, { color: colors.textSecondary, marginTop: 16 }]}>
                                Processing your event...
							</Text>
                        </View>
                    )}
                </ScrollView>

                {/* Footer with actions - handled separately for each step */}
                {step === 'details' && (
                    <View style={styles.footerActions}>
                        {!isEditMode && (
                            <Button
                                title="Back"
                                variant="secondary"
                                onPress={() => {
                                    setStep('url');
                                    setDetailsError('');
                                }}
                                style={styles.backButton}
                            />
                        )}
                        <Button
                            title={isEditMode ? "Update Event" : "Submit Event"}
                            onPress={handleEventSubmit}
                            disabled={!isDetailsValid()}
                            style={styles.submitButton}
                        />
                    </View>
                )}
            </Panel>

            {/* Date Picker */}
            <DatePicker
                value={selectedDateIndex >= 0 ? races[selectedDateIndex].raceDate : new Date().toISOString()}
                onChange={handleDateChange}
                isVisible={showDatePicker}
                onDismiss={() => {
                    setShowDatePicker(false);
                    setSelectedDateIndex(-1);
                }}
            />

            {/* Notes Dialog */}
            <RichTextDialog
                isOpen={showNotesModal}
                title={`Notes for ${selectedNotesIndex >= 0 && races[selectedNotesIndex]?.name ? races[selectedNotesIndex].name : `Race ${selectedNotesIndex + 1}`}`}
                message="Add notes or special instructions for this race"
                value={selectedNotesIndex >= 0 ? races[selectedNotesIndex]?.notes || '' : ''}
                onSave={handleSaveNotes}
                onCancel={() => {
                    setShowNotesModal(false);
                    setSelectedNotesIndex(-1);
                }}
                submitText="Save Notes"
                cancelText="Cancel"
                maxLength={500}
                placeholder="Enter race notes..."
            />
        </>
    );
};

export default EventSubmissionPanel;
