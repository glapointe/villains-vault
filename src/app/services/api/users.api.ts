/**
 * User Profile API
 */

import { apiClient } from './client';
import type { UserProfile, UpdateUserRequest, UpdateOwnProfileRequest, PagedResults } from '../../models';

export const usersApi = {
	/**
	 * Get the current authenticated user's profile
	 * Automatically created on first authentication
	 */
	getCurrentUser: async (): Promise<UserProfile> => {
		const response = await apiClient.get<UserProfile>('/api/v1.0/users/me');
		return response.data;
	},

	/**
	 * Update the current user's own profile (non-admin endpoint)
	 * Only display name can be changed; email is managed by admins only.
	 */
	updateOwnProfile: async (request: UpdateOwnProfileRequest): Promise<UserProfile> => {
		const response = await apiClient.put<UserProfile>('/api/v1.0/users/me', request);
		return response.data;
	},

	/**
	 * Delete the current user's own account.
	 * Fails if the account has admin privileges.
	 */
	deleteOwnAccount: async (): Promise<{ message: string }> => {
		const response = await apiClient.delete<{ message: string }>('/api/v1.0/users/me');
		return response.data;
	},

	/**
	 * Get paged list of all users (admin only)
	 */
	getPagedUsers: async (options: {
		page?: number;
		pageSize?: number;
		search?: string;
		sortBy?: string;
		sortDirection?: string;
	} = {}): Promise<PagedResults<UserProfile>> => {
		const response = await apiClient.get<PagedResults<UserProfile>>('/api/v1.0/admin/users', {
			params: {
				page: options.page ?? 1,
				pageSize: options.pageSize ?? 25,
				search: options.search || undefined,
				sortBy: options.sortBy || undefined,
				sortDirection: options.sortDirection || undefined,
			},
		});
		return response.data;
	},

	/**
	 * Get a specific user by ID (admin only)
	 */
	getUserById: async (id: number): Promise<UserProfile> => {
		const response = await apiClient.get<UserProfile>(`/api/v1.0/admin/users/${id}`);
		return response.data;
	},

	/**
	 * Update a user (admin only)
	 */
	updateUser: async (id: number, request: UpdateUserRequest): Promise<UserProfile> => {
		const response = await apiClient.put<UserProfile>(`/api/v1.0/admin/users/${id}`, request);
		return response.data;
	},

	/**
	 * Delete a user (admin only)
	 */
	deleteUser: async (id: number): Promise<{ message: string }> => {
		const response = await apiClient.delete<{ message: string }>(`/api/v1.0/admin/users/${id}`);
		return response.data;
	},
};
