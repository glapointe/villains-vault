/**
 * Follows API Service
 *
 * Handles communication with the backend follows endpoints.
 * Requires authentication for all operations.
 */

import { apiClient } from './client';
import type { RaceResultFollow, FollowRaceResultRequest, EnrichedFollow, FollowSearchResult } from '../../models';

export const followsApi = {
	/**
	 * Get all enriched follows for the current user (for dashboard display)
	 * @returns Array of enriched follows with race/event context
	 */
	getMyFollows: async (): Promise<EnrichedFollow[]> => {
		const response = await apiClient.get<EnrichedFollow[]>('/api/v1.0/follows');
		return response.data;
	},

	/**
	 * Search for race results matching the current user's display name.
	 * Already-followed results are excluded server-side.
	 * @param skip - Number of results to skip for pagination (default 0)
	 * @param limit - Max results per page (default 25)
	 * @returns Array of search results (un-followed only)
	 */
	searchMyResults: async (skip: number = 0, limit: number = 25): Promise<FollowSearchResult[]> => {
		const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
		const response = await apiClient.get<FollowSearchResult[]>(`/api/v1.0/follows/search?${params}`);
		return response.data;
	},

	/**
	 * Get the current user's follow status for a specific race result
	 * @param raceResultId - ID of the race result to check
	 * @returns Follow object if following, or null if not
	 */
	getFollowStatus: async (raceResultId: number): Promise<RaceResultFollow | null> => {
		const response = await apiClient.get(`/api/v1.0/follows/status/${raceResultId}`, {
			validateStatus: (status) => status === 200 || status === 204,
		});
		if (response.status === 204) {
			return null;
		}
		return response.data;
	},

	/**
	 * Follow a race result
	 * @param request - Follow request with result ID, follow type, and optional DLS flag
	 * @returns The created follow
	 */
	follow: async (request: FollowRaceResultRequest): Promise<RaceResultFollow> => {
		const response = await apiClient.post<RaceResultFollow>('/api/v1.0/follows', request);
		return response.data;
	},

	/**
	 * Unfollow a race result
	 * @param raceResultId - ID of the race result to unfollow
	 */
	unfollow: async (raceResultId: number): Promise<void> => {
		await apiClient.delete(`/api/v1.0/follows/${raceResultId}`);
	},

	/**
	 * Update an existing follow (e.g. toggle DLS status)
	 * @param raceResultId - ID of the race result's follow to update
	 * @param deadLastStarted - New DLS value
	 */
	updateFollow: async (raceResultId: number, deadLastStarted: boolean | null): Promise<void> => {
		await apiClient.patch(`/api/v1.0/follows/${raceResultId}`, { deadLastStarted });
	},
};
