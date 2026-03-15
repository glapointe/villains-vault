/**
 * Events API - Public and Admin endpoints
 */

import { apiClient } from './client';
import type {
	Event,
	EventPreview,
	SubmitEventRequest,
	SubmitEventResponse,
	EventSeries,
} from '../../models';

export const eventsApi = {
	// Public endpoints (no auth required)

	/**
	 * Get all events with their races (public endpoint)
	 * @param year - Optional year to filter events
	 * @param eventSeries - Optional event series to filter events
	 */
	getAll: async (year?: number, eventSeries?: EventSeries): Promise<Event[]> => {
		const params: { year?: number; eventSeries?: EventSeries } = year ? { year } : {};
		if (eventSeries) {
			params.eventSeries = eventSeries;
		}
		const response = await apiClient.get<Event[]>('/api/v1.0/events', { params });
		return response.data;
	},

	/**
	 * Get available years for events (public endpoint)
	 * Returns a list of years that have events
	 */
	getYears: async (eventSeries?: EventSeries): Promise<number[]> => {
		const params = eventSeries ? { eventSeries } : {};
		const response = await apiClient.get<number[]>('/api/v1.0/events/years', { params });
		return response.data;
	},

	// Admin endpoints (require auth + admin role)

	/**
	 * Preview an event by scraping Track Shack URL (admin only)
	 * @param url - Track Shack event URL
	 */
	preview: async (url: string): Promise<EventPreview> => {
		const response = await apiClient.post<EventPreview>(
			'/api/v1.0/admin/events/preview',
			null,
			{ params: { url } }
		);
		return response.data;
	},

	/**
	 * Submit an event with races for processing (admin only)
	 * @param request - Event and races to submit
	 */
	submit: async (request: SubmitEventRequest): Promise<SubmitEventResponse> => {
		const response = await apiClient.post<SubmitEventResponse>(
			'/api/v1.0/admin/events/submit',
			request
		);
		return response.data;
	},

    /**
     * Delete an event by ID (admin only)
     * @param eventId - ID of the event to delete
     */
    delete: async (eventId: number): Promise<{ message: string }> => {
        // The delete endpoint returns a 204 No Content on success
        const response = await apiClient.delete<void>(`/api/v1.0/admin/events/${eventId}`);
        return { message: 'Event deleted successfully' };
    }
};
