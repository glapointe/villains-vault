/**
 * Community Events API Service
 * 
 * API client methods for community events, races, and participations.
 */

import { apiClient } from './client';
import type {
	CommunityEvent,
	CommunityParticipation,
	CreateCommunityEventRequest,
	CreateCommunityRaceRequest,
	UpdateCommunityEventRequest,
	UpdateCommunityRaceRequest,
	SaveCommunityParticipationRequest,
	PagedResults,
} from '../../models';

/** Community events API methods */
export const communityApi = {

	// ── Events ──

	/** Get paged community events with optional filters */
	getEvents: async (params: {
		page?: number;
		pageSize?: number;
		year?: number;
		name?: string;
		location?: string;
		includePast?: boolean;
	} = {}): Promise<PagedResults<CommunityEvent>> => {
		const searchParams = new URLSearchParams();
		if (params.page) searchParams.set('page', String(params.page));
		if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
		if (params.year) searchParams.set('year', String(params.year));
		if (params.name) searchParams.set('name', params.name);
		if (params.location) searchParams.set('location', params.location);
		if (params.includePast) searchParams.set('includePast', 'true');
		const query = searchParams.toString();
		const url = `/api/v1.0/community/events${query ? `?${query}` : ''}`;
		const response = await apiClient.get<PagedResults<CommunityEvent>>(url);
		return response.data;
	},

	/** Get upcoming community events for the home sidebar */
	getUpcomingEvents: async (count: number = 10): Promise<CommunityEvent[]> => {
		const response = await apiClient.get<CommunityEvent[]>(
			`/api/v1.0/community/events/upcoming?count=${count}`
		);
		return response.data;
	},

	/** Get a single community event by ID */
	getEvent: async (id: number): Promise<CommunityEvent> => {
		const response = await apiClient.get<CommunityEvent>(`/api/v1.0/community/events/${id}`);
		return response.data;
	},

	/** Get distinct years that have community events */
	getAvailableYears: async (): Promise<number[]> => {
		const response = await apiClient.get<number[]>('/api/v1.0/community/events/years');
		return response.data;
	},

	/** Create a new community event with races */
	createEvent: async (request: CreateCommunityEventRequest): Promise<CommunityEvent> => {
		const response = await apiClient.post<CommunityEvent>('/api/v1.0/community/events', request);
		return response.data;
	},

	/** Update a community event */
	updateEvent: async (id: number, request: UpdateCommunityEventRequest): Promise<CommunityEvent> => {
		const response = await apiClient.put<CommunityEvent>(`/api/v1.0/community/events/${id}`, request);
		return response.data;
	},

	/** Delete a community event */
	deleteEvent: async (id: number): Promise<void> => {
		await apiClient.delete(`/api/v1.0/community/events/${id}`);
	},

	// ── Races ──

	/** Add a race to an existing event */
	addRace: async (eventId: number, request: CreateCommunityRaceRequest): Promise<CommunityEvent> => {
		const response = await apiClient.post<CommunityEvent>(
			`/api/v1.0/community/events/${eventId}/races`, request
		);
		return response.data;
	},

	/** Update a community race */
	updateRace: async (raceId: number, request: UpdateCommunityRaceRequest): Promise<CommunityEvent> => {
		const response = await apiClient.put<CommunityEvent>(`/api/v1.0/community/races/${raceId}`, request);
		return response.data;
	},

	/** Delete a community race */
	deleteRace: async (raceId: number): Promise<void> => {
		await apiClient.delete(`/api/v1.0/community/races/${raceId}`);
	},

	// ── Participation ──

	/** Get all participants for an event */
	getParticipants: async (eventId: number): Promise<CommunityParticipation[]> => {
		const response = await apiClient.get<CommunityParticipation[]>(
			`/api/v1.0/community/events/${eventId}/participants`
		);
		return response.data;
	},

	/** Get current user's participations for an event */
	getMyParticipation: async (eventId: number): Promise<CommunityParticipation[]> => {
		const response = await apiClient.get<CommunityParticipation[]>(
			`/api/v1.0/community/events/${eventId}/my-participation`
		);
		return response.data;
	},

	/** Save participation for the current user (batch upsert) */
	saveParticipation: async (
		eventId: number,
		request: SaveCommunityParticipationRequest
	): Promise<CommunityParticipation[]> => {
		const response = await apiClient.post<CommunityParticipation[]>(
			`/api/v1.0/community/events/${eventId}/participate`, request
		);
		return response.data;
	},

	/** Withdraw all participation for the current user */
	withdrawParticipation: async (eventId: number): Promise<void> => {
		await apiClient.delete(`/api/v1.0/community/events/${eventId}/participate`);
	},
};
