/**
 * Races API - Admin endpoints
 */

import { Platform } from 'react-native';
import { apiConfig } from '../../features/auth/providers/config';
import { apiClient } from './client';
import type { CourseMapImage, Division, Race, RaceStats, WeatherData, EventSeries, RaceDistance, RaceWithStats } from '../../models';

/**
 * Resolves relative course map image URLs to fully qualified URLs.
 */
const resolveCourseMapUrl = (relativeUrl: string): string => {
	if (!relativeUrl) return relativeUrl;
	if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
		return relativeUrl;
	}
	const base = apiConfig.baseUrl.replace(/\/+$/, '');
	return `${base}${relativeUrl}`;
};

const resolveCourseMapUrls = (image: CourseMapImage): CourseMapImage => ({
	...image,
	fullUrl: resolveCourseMapUrl(image.fullUrl),
	thumbnailUrl: resolveCourseMapUrl(image.thumbnailUrl),
});

export const racesApi = {
	/**
	 * Get race details by ID (public endpoint)
	 * @param raceId - ID of the race to retrieve
	 */
	getById: async (raceId: number): Promise<Race> => {
		const response = await apiClient.get<Race>(`/api/v1.0/races/${raceId}`);
		return response.data;
	},

    /**
     * Reparse a race by ID (admin only)
     * @param raceId - ID of the race to reparse
     */
    reparseRace: async (raceId: number): Promise<number> => {
        const response = await apiClient.post<{ jobId: number }>(
            `/api/v1.0/admin/races/${raceId}/reparse`
        );
        return response.data.jobId;
    },


	/**
	 * Preview divisions for a race (admin only)
	 * @param url - Track Shack race URL
	 */
	previewDivisions: async (url: string): Promise<Division[]> => {
		const response = await apiClient.post<Division[]>(
			'/api/v1.0/admin/races/preview/divisions',
			null,
			{ params: { url } }
		);
		return response.data;
	},

    /**
     * Delete a race by ID (admin only)
     * @param raceId - ID of the race to delete
     */
    delete: async (raceId: number): Promise<{ message: string }> => {
        // The delete endpoint returns a 204 No Content on success
        const response = await apiClient.delete<void>(`/api/v1.0/admin/races/${raceId}`);
        return { message: 'Race deleted successfully' };
    },

	/**
	 * Get weather data for a race
	 * Fetches weather data from the API. If not cached, the backend will query Open-Meteo API.
	 * @param raceId - ID of the race to get weather for
	 */
	getWeather: async (raceId: number): Promise<WeatherData> => {
		const response = await apiClient.get<WeatherData>(`/api/v1.0/races/${raceId}/weather`);
		return response.data;
	},

	/**
	 * Get DNF (Did Not Finish) count for a race
	 * DNF runners have no overall place and are excluded from normal queries.
	 * This count is used in kill chart calculations.
	 * @param raceId - ID of the race to get DNF count for
	 */
	getDnfCount: async (raceId: number): Promise<number> => {
		const response = await apiClient.get<{ raceId: number; dnfCount: number }>(
			`/api/v1.0/races/${raceId}/dnf-count`
		);
		return response.data.dnfCount;
	},

	/**
	 * Get comprehensive race statistics
	 * Returns cached statistics if available, otherwise calculates and caches them.
	 * Includes runner counts, split times, age groups, congestion factors, and more.
	 * @param raceId - ID of the race to get statistics for
	 */
	getStats: async (raceId: number): Promise<RaceStats> => {
		const response = await apiClient.get<RaceStats>(
			`/api/v1.0/races/${raceId}/stats`
		);
		return response.data;
	},

	/**
	 * Get series statistics for all races matching an event series and distance.
	 * Returns one entry per historical edition of the event, sorted by race date.
	 * @param eventSeries - The event series to get statistics for
	 * @param raceDistance - The race distance to get statistics for
	 */
	getSeriesStats: async (eventSeries: EventSeries, raceDistance: RaceDistance): Promise<RaceWithStats[]> => {
		const response = await apiClient.get<RaceWithStats[]>(
			`/api/v1.0/races/series-stats`,
			{ params: { eventSeries, raceDistance } }
		);
		return response.data;
	},

	/**
	 * Generate race statistics (admin only)
	 * Optionally recalculates pass counts (kills/assassins) via a background job.
	 * @param raceId - ID of the race to generate stats for
	 * @param recalculateIndividualResults - When true, creates a background job to recalculate individual results
	 * @returns Job ID when recalculating individual results, or race stats when not
	 */
	generateStats: async (raceId: number, recalculateIndividualResults: boolean = false): Promise<{ jobId?: number; message?: string }> => {
		const response = await apiClient.post<{ jobId?: number; message?: string }>(
			`/api/v1.0/admin/races/${raceId}/generate-stats`,
			null,
			{ params: { recalculateIndividualResults } }
		);
		return response.data;
	},

	/**
	 * Get the course map image for a race (public endpoint).
	 * Returns null if no course map has been uploaded.
	 * @param raceId - ID of the race
	 */
	getCourseMap: async (raceId: number): Promise<CourseMapImage | null> => {
		const response = await apiClient.get<CourseMapImage | null>(`/api/v1.0/races/${raceId}/course-map`);
		// 204 No Content means no course map exists
		if (response.status === 204 || !response.data) {
			return null;
		}
		return resolveCourseMapUrls(response.data);
	},

	/**
	 * Upload a course map image for a race (admin only).
	 * Accepts JPEG, PNG, or WebP files up to 20 MB.
	 * Supports both web File objects and native image URIs.
	 * @param raceId - ID of the race
	 * @param fileOrUri - A File object (web) or an object with uri/name/type (native)
	 */
	uploadCourseMap: async (
		raceId: number,
		fileOrUri: File | { uri: string; name: string; type: string }
	): Promise<CourseMapImage> => {
		const formData = new FormData();
		if (Platform.OS === 'web') {
			formData.append('image', fileOrUri as File);
		} else {
			formData.append('image', fileOrUri as unknown as Blob);
		}
		const response = await apiClient.post<CourseMapImage>(
			`/api/v1.0/admin/races/${raceId}/course-map`,
			formData,
			{ headers: { 'Content-Type': 'multipart/form-data' } }
		);
		return resolveCourseMapUrls(response.data);
	},

	/**
	 * Delete the course map image for a race (admin only).
	 * @param raceId - ID of the race
	 */
	deleteCourseMap: async (raceId: number): Promise<void> => {
		await apiClient.delete(`/api/v1.0/admin/races/${raceId}/course-map`);
	},
};
