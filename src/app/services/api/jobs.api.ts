/**
 * Jobs API - Admin endpoints
 */

import { apiClient } from './client';
import type { Job } from '../../models';

export const jobsApi = {
	/**
	 * Get jobs by IDs (admin only)
	 * @param ids - Array of job IDs to retrieve
	 */
	getByIds: async (ids: number[]): Promise<Job[]> => {
		const idsParam = ids.join(',');
		const response = await apiClient.get<Job[]>(`/api/v1.0/admin/jobs?ids=${idsParam}`);
		return response.data;
	},

	/**
	 * Get recent jobs with pagination (admin only)
	 * @param page - Page number (1-based, default: 1)
	 * @param pageSize - Number of jobs per page (default: 5, max: 50)
	 */
	getRecent: async (page: number = 1, pageSize: number = 5): Promise<Job[]> => {
		const response = await apiClient.get<Job[]>('/api/v1.0/admin/jobs/recent', {
			params: { page, pageSize }
		});
		return response.data;
	},

	/**
	 * Cancel a job by ID (admin only)
	 * @param id - Job ID to cancel
	 */
	cancelById: async (id: number): Promise<{ message: string }> => {
		const response = await apiClient.put<{ message: string }>(`/api/v1.0/admin/jobs/${id}/cancel`);
		return response.data;
	},
};
