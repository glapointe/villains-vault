/**
 * useEvents Hook
 * 
 * Shared hook for fetching and managing events data.
 * Encapsulates API calls, loading/error state, and year filter options.
 * Used by both AdminEventsList and EventsList components.
 */

import { useState, useEffect, useCallback } from 'react';
import { api, setAuthToken } from '../services/api';
import type { Event } from '../models';
import type { DropdownOption } from '../components/ui';

interface UseEventsOptions {
	/** Initial year to filter by */
	selectedYear?: number;
	/** Whether to fetch year options for the filter dropdown */
	fetchYearOptions?: boolean;
	/** Optional access token for authenticated API calls */
	accessToken?: string;
	/** Skip fetching events from the API (e.g. when data is provided externally) */
	skipFetch?: boolean;
}

interface UseEventsReturn {
	/** Array of events matching the current year filter */
	events: Event[];
	/** Whether events are currently loading */
	loading: boolean;
	/** Error message if fetch failed */
	error: string;
	/** Current year filter value (undefined = all years) */
	currentYear: number | undefined;
	/** Set the year filter */
	setCurrentYear: (year: number | undefined) => void;
	/** Available year options for dropdown */
	yearOptions: DropdownOption[];
	/** Whether year options are loading */
	loadingYears: boolean;
	/** Refetch events (e.g., after admin operations) */
	refetchEvents: () => Promise<void>;
}

/**
 * Hook for fetching and managing events data
 * 
 * @param options - Configuration options for the hook
 * @returns Events data, loading states, and filter controls
 */
export function useEvents({
	selectedYear,
	fetchYearOptions = false,
	accessToken,
	skipFetch = false,
}: UseEventsOptions = {}): UseEventsReturn {
	const [events, setEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState<boolean>(!skipFetch);
	const [error, setError] = useState<string>('');
	const [currentYear, setCurrentYear] = useState<number | undefined>(selectedYear);
	const [yearOptions, setYearOptions] = useState<DropdownOption[]>([]);
	const [loadingYears, setLoadingYears] = useState<boolean>(false);

	// Sync internal state when the selectedYear prop changes from parent
	useEffect(() => {
		setCurrentYear(selectedYear);
	}, [selectedYear]);

	/**
	 * Fetch available years for the filter
	 */
	const fetchYears = useCallback(async (): Promise<void> => {
		if (!fetchYearOptions) return;

		setLoadingYears(true);
		try {
			const years = await api.events.getYears();
			const options: DropdownOption[] = [
				{ label: 'All Years', value: 0 },
				...years.sort((a, b) => b - a).map(year => ({ label: year.toString(), value: year })),
			];
			setYearOptions(options);
		} catch (err) {
			console.error('Failed to load years:', err);
		} finally {
			setLoadingYears(false);
		}
	}, [fetchYearOptions]);

	/**
	 * Fetch events from API
	 */
	const fetchEvents = useCallback(async (): Promise<void> => {
		if (skipFetch) {
			setLoading(false);
			return;
		}

		setLoading(true);
		setError('');

		try {
			if (accessToken) {
				setAuthToken(accessToken);
			}

			const data = await api.events.getAll(currentYear);
			setEvents(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load events');
		} finally {
			setLoading(false);
		}
	}, [currentYear, accessToken, skipFetch]);

	// Fetch years on mount if filter is enabled
	useEffect(() => {
		fetchYears();
	}, [fetchYears]);

	// Fetch events when year changes
	useEffect(() => {
		fetchEvents();
	}, [fetchEvents]);

	return {
		events,
		loading,
		error,
		currentYear,
		setCurrentYear,
		yearOptions,
		loadingYears,
		refetchEvents: fetchEvents,
	};
}
