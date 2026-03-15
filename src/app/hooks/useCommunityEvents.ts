/**
 * Community Events Hook
 * 
 * Custom hook for managing community events, races, and participations.
 * Provides state management, API calls, and auth token handling.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { communityApi } from '../services/api/community.api';
import { setAuthToken } from '../services/api';
import type {
	CommunityEvent,
	CommunityParticipation,
	CreateCommunityEventRequest,
	CreateCommunityRaceRequest,
	UpdateCommunityEventRequest,
	UpdateCommunityRaceRequest,
	SaveCommunityParticipationRequest,
	PagedResults,
} from '../models';

/** Options for the useCommunityEvents hook */
interface UseCommunityEventsOptions {
	/** Auth token for authenticated requests (optional — only needed for mutations) */
	accessToken?: string | null;
	/** Number of upcoming events to fetch for the sidebar */
	upcomingCount?: number;
}

/** Return type for the useCommunityEvents hook */
interface UseCommunityEventsReturn {
	/** Upcoming events (for sidebar preview) */
	upcomingEvents: CommunityEvent[];
	/** Paged events (for full list) */
	pagedEvents: PagedResults<CommunityEvent> | null;
	/** Available years for filter dropdown */
	availableYears: number[];
	/** Whether data is loading */
	loading: boolean;
	/** Whether a mutation action is in progress */
	actionLoading: boolean;
	/** Error message if any */
	error: string;

	/** Fetch upcoming events for the sidebar */
	fetchUpcoming: (count?: number) => Promise<void>;
	/** Fetch paged events with filters */
	fetchEvents: (params?: {
		page?: number;
		pageSize?: number;
		year?: number;
		name?: string;
		location?: string;
		includePast?: boolean;
	}) => Promise<void>;
	/** Fetch available years for the filter dropdown */
	fetchAvailableYears: () => Promise<void>;
	/** Get a single event by ID */
	getEvent: (id: number) => Promise<CommunityEvent | null>;
	/** Create a new community event with races */
	createEvent: (request: CreateCommunityEventRequest) => Promise<CommunityEvent | null>;
	/** Update a community event */
	updateEvent: (id: number, request: UpdateCommunityEventRequest) => Promise<CommunityEvent | null>;
	/** Delete a community event */
	deleteEvent: (id: number) => Promise<boolean>;
	/** Add a race to an existing event */
	addRace: (eventId: number, request: CreateCommunityRaceRequest) => Promise<CommunityEvent | null>;
	/** Update a community race */
	updateRace: (raceId: number, request: UpdateCommunityRaceRequest) => Promise<CommunityEvent | null>;
	/** Delete a community race */
	deleteRace: (raceId: number) => Promise<boolean>;
	/** Get participants for an event */
	getParticipants: (eventId: number) => Promise<CommunityParticipation[]>;
	/** Get current user's participations for an event */
	getMyParticipation: (eventId: number) => Promise<CommunityParticipation[]>;
	/** Save participation for the current user (batch upsert) */
	saveParticipation: (eventId: number, request: SaveCommunityParticipationRequest) => Promise<CommunityParticipation[] | null>;
	/** Withdraw all participation for the current user */
	withdrawParticipation: (eventId: number) => Promise<boolean>;
	/** Refresh all data (upcoming + paged if loaded) */
	refresh: () => Promise<void>;
}

/**
 * Hook for managing community events
 */
export function useCommunityEvents({
	accessToken = null,
	upcomingCount = 10,
}: UseCommunityEventsOptions): UseCommunityEventsReturn {
	const [upcomingEvents, setUpcomingEvents] = useState<CommunityEvent[]>([]);
	const [pagedEvents, setPagedEvents] = useState<PagedResults<CommunityEvent> | null>(null);
	const [availableYears, setAvailableYears] = useState<number[]>([]);
	const [loading, setLoading] = useState(false);
	const [actionLoading, setActionLoading] = useState(false);
	const [error, setError] = useState('');
	const [lastFetchParams, setLastFetchParams] = useState<Record<string, any> | null>(null);

	// Store accessToken in a ref so callbacks always read the latest value
	// without needing it as a dependency (avoids double-fetches on token arrival)
	const accessTokenRef = useRef(accessToken);
	useEffect(() => {
		accessTokenRef.current = accessToken;
	}, [accessToken]);

	// ── Fetch upcoming events ──
	const fetchUpcoming = useCallback(async (count?: number) => {
		try {
			setLoading(true);
			setError('');
			if (accessTokenRef.current) setAuthToken(accessTokenRef.current);
			const events = await communityApi.getUpcomingEvents(count ?? upcomingCount);
			setUpcomingEvents(events);
		} catch (err) {
			setError(err?.response?.data?.error || 'Failed to load upcoming events.');
		} finally {
			setLoading(false);
		}
	}, [upcomingCount]);

	// ── Fetch paged events ──
	const fetchEvents = useCallback(async (params: {
		page?: number;
		pageSize?: number;
		year?: number;
		name?: string;
		location?: string;
		includePast?: boolean;
	} = {}) => {
		try {
			setLoading(true);
			setError('');
			setLastFetchParams(params);
			if (accessTokenRef.current) setAuthToken(accessTokenRef.current);
			const result = await communityApi.getEvents(params);
			setPagedEvents(result);
		} catch (err) {
			setError(err?.response?.data?.error || 'Failed to load community events.');
		} finally {
			setLoading(false);
		}
	}, []);

	// ── Fetch available years ──
	const fetchAvailableYears = useCallback(async () => {
		try {
			const years = await communityApi.getAvailableYears();
			setAvailableYears(years);
		} catch (err) {
			// Non-critical, don't set error state
			console.warn('Failed to load available years:', err);
		}
	}, []);

	// ── Get single event ──
	const getEvent = useCallback(async (id: number): Promise<CommunityEvent | null> => {
		try {
			return await communityApi.getEvent(id);
		} catch (err) {
			setError(err?.response?.data?.error || 'Failed to load event.');
			return null;
		}
	}, []);

	// ── Create event ──
	const createEvent = useCallback(async (request: CreateCommunityEventRequest): Promise<CommunityEvent | null> => {
		if (!accessTokenRef.current) return null;
		try {
			setActionLoading(true);
			setError('');
			setAuthToken(accessTokenRef.current);
			const result = await communityApi.createEvent(request);
			// Optimistically update upcoming events
			setUpcomingEvents(prev => [result, ...prev].slice(0, upcomingCount));
			return result;
		} catch (err) {
			setError(err?.response?.data?.error || 'Failed to create event.');
			return null;
		} finally {
			setActionLoading(false);
		}
	}, [upcomingCount]);

	// ── Update event ──
	const updateEvent = useCallback(async (id: number, request: UpdateCommunityEventRequest): Promise<CommunityEvent | null> => {
		if (!accessTokenRef.current) return null;
		try {
			setActionLoading(true);
			setError('');
			setAuthToken(accessTokenRef.current);
			const result = await communityApi.updateEvent(id, request);
			// Update in local state
			setUpcomingEvents(prev => prev.map(e => e.id === id ? result : e));
			setPagedEvents(prev =>
				prev ? { ...prev, items: prev.items.map(e => e.id === id ? result : e) } : null
			);
			return result;
		} catch (err) {
			setError(err?.response?.data?.error || 'Failed to update event.');
			return null;
		} finally {
			setActionLoading(false);
		}
	}, []);

	// ── Delete event ──
	const deleteEvent = useCallback(async (id: number): Promise<boolean> => {
		if (!accessTokenRef.current) return false;
		try {
			setActionLoading(true);
			setError('');
			setAuthToken(accessTokenRef.current);
			await communityApi.deleteEvent(id);
			// Remove from local state
			setUpcomingEvents(prev => prev.filter(e => e.id !== id));
			setPagedEvents(prev =>
				prev ? { ...prev, items: prev.items.filter(e => e.id !== id), totalCount: prev.totalCount - 1 } : null
			);
			return true;
		} catch (err) {
			setError(err?.response?.data?.error || 'Failed to delete event.');
			return false;
		} finally {
			setActionLoading(false);
		}
	}, []);

	// ── Add race ──
	const addRace = useCallback(async (eventId: number, request: CreateCommunityRaceRequest): Promise<CommunityEvent | null> => {
		if (!accessTokenRef.current) return null;
		try {
			setActionLoading(true);
			setError('');
			setAuthToken(accessTokenRef.current);
			const result = await communityApi.addRace(eventId, request);
			setUpcomingEvents(prev => prev.map(e => e.id === eventId ? result : e));
			setPagedEvents(prev =>
				prev ? { ...prev, items: prev.items.map(e => e.id === eventId ? result : e) } : null
			);
			return result;
		} catch (err) {
			setError(err?.response?.data?.error || 'Failed to add race.');
			return null;
		} finally {
			setActionLoading(false);
		}
	}, []);

	// ── Update race ──
	const updateRace = useCallback(async (raceId: number, request: UpdateCommunityRaceRequest): Promise<CommunityEvent | null> => {
		if (!accessTokenRef.current) return null;
		try {
			setActionLoading(true);
			setError('');
			setAuthToken(accessTokenRef.current);
			const result = await communityApi.updateRace(raceId, request);
			setUpcomingEvents(prev => prev.map(e => e.id === result.id ? result : e));
			setPagedEvents(prev =>
				prev ? { ...prev, items: prev.items.map(e => e.id === result.id ? result : e) } : null
			);
			return result;
		} catch (err) {
			setError(err?.response?.data?.error || 'Failed to update race.');
			return null;
		} finally {
			setActionLoading(false);
		}
	}, []);

	// ── Delete race ──
	const deleteRace = useCallback(async (raceId: number): Promise<boolean> => {
		if (!accessTokenRef.current) return false;
		try {
			setActionLoading(true);
			setError('');
			setAuthToken(accessTokenRef.current);
			await communityApi.deleteRace(raceId);
			return true;
		} catch (err) {
			setError(err?.response?.data?.error || 'Failed to delete race.');
			return false;
		} finally {
			setActionLoading(false);
		}
	}, []);

	// ── Get participants ──
	const getParticipants = useCallback(async (eventId: number): Promise<CommunityParticipation[]> => {
		try {
			return await communityApi.getParticipants(eventId);
		} catch (err) {
			setError(err?.response?.data?.error || 'Failed to load participants.');
			return [];
		}
	}, []);

	// ── Get my participation ──
	const getMyParticipation = useCallback(async (eventId: number): Promise<CommunityParticipation[]> => {
		if (!accessTokenRef.current) return [];
		try {
			setAuthToken(accessTokenRef.current);
			return await communityApi.getMyParticipation(eventId);
		} catch (err) {
			setError(err?.response?.data?.error || 'Failed to load your participation.');
			return [];
		}
	}, []);

	// ── Save participation ──
	const saveParticipation = useCallback(async (
		eventId: number,
		request: SaveCommunityParticipationRequest
	): Promise<CommunityParticipation[] | null> => {
		if (!accessTokenRef.current) return null;
		try {
			setActionLoading(true);
			setError('');
			setAuthToken(accessTokenRef.current);
			const result = await communityApi.saveParticipation(eventId, request);
			// Optimistically update participant counts
			const updateCounts = (event: CommunityEvent): CommunityEvent => {
				if (event.id !== eventId) return event;
				return { ...event, participantCount: event.participantCount + (result.length > 0 ? 1 : 0) };
			};
			setUpcomingEvents(prev => prev.map(updateCounts));
			setPagedEvents(prev =>
				prev ? { ...prev, items: prev.items.map(updateCounts) } : null
			);
			return result;
		} catch (err) {
			setError(err?.response?.data?.error || 'Failed to save participation.');
			return null;
		} finally {
			setActionLoading(false);
		}
	}, []);

	// ── Withdraw participation ──
	const withdrawParticipation = useCallback(async (eventId: number): Promise<boolean> => {
		if (!accessTokenRef.current) return false;
		try {
			setActionLoading(true);
			setError('');
			setAuthToken(accessTokenRef.current);
			await communityApi.withdrawParticipation(eventId);
			// Optimistically update participant counts
			const updateCounts = (event: CommunityEvent): CommunityEvent => {
				if (event.id !== eventId) return event;
				return { ...event, participantCount: Math.max(0, event.participantCount - 1) };
			};
			setUpcomingEvents(prev => prev.map(updateCounts));
			setPagedEvents(prev =>
				prev ? { ...prev, items: prev.items.map(updateCounts) } : null
			);
			return true;
		} catch (err) {
			setError(err?.response?.data?.error || 'Failed to withdraw participation.');
			return false;
		} finally {
			setActionLoading(false);
		}
	}, []);

	// ── Refresh ──
	const refresh = useCallback(async () => {
		await fetchUpcoming();
		if (lastFetchParams) {
			await fetchEvents(lastFetchParams);
		}
	}, [fetchUpcoming, fetchEvents, lastFetchParams]);

	return {
		upcomingEvents,
		pagedEvents,
		availableYears,
		loading,
		actionLoading,
		error,
		fetchUpcoming,
		fetchEvents,
		fetchAvailableYears,
		getEvent,
		createEvent,
		updateEvent,
		deleteEvent,
		addRace,
		updateRace,
		deleteRace,
		getParticipants,
		getMyParticipation,
		saveParticipation,
		withdrawParticipation,
		refresh,
	};
}
