/**
 * DLS Declarations API Service
 *
 * Handles communication with the backend DLS endpoints.
 * Public endpoints (races list, declarations, result IDs) are anonymous.
 * Self-declaration, update, and delete require authentication.
 * Admin endpoints manage DLS races and declarations.
 */

import { apiClient } from './client';
import type {
	DlsRace,
	DlsDeclaration,
	CreateDlsRaceRequest,
	UpdateDlsRaceRequest,
	CreateDlsDeclarationRequest,
	UpdateDlsDeclarationRequest,
	ImportDlsDeclarationRequest,
} from '../../models';

export const dlsApi = {
	// --- Public Endpoints ---

	/**
	 * Get upcoming DLS races with declaration counts
	 * @returns Array of upcoming DLS races
	 */
	getUpcomingRaces: async (): Promise<DlsRace[]> => {
		const response = await apiClient.get<DlsRace[]>('/api/v1.0/dls/races');
		return response.data;
	},

	/**
	 * Get all declarations for a DLS race
	 * @param dlsRaceId - The DLS race ID
	 * @returns Array of declarations for the race
	 */
	getDeclarations: async (dlsRaceId: number): Promise<DlsDeclaration[]> => {
		const response = await apiClient.get<DlsDeclaration[]>(`/api/v1.0/dls/races/${dlsRaceId}/declarations`);
		return response.data;
	},

	/**
	 * Get DLS result IDs for a race (for kill chart highlighting)
	 * @param raceId - The actual race ID (not DLS race ID)
	 * @returns Array of race result IDs
	 */
	getDlsResultIds: async (raceId: number): Promise<number[]> => {
		const response = await apiClient.get<number[]>(`/api/v1.0/dls/result-ids/${raceId}`);
		return response.data;
	},

	// --- Authenticated Endpoints ---

	/**
	 * Self-declare for a DLS race
	 * @param request - DLS race ID and optional bib number
	 * @returns Created declaration
	 */
	selfDeclare: async (request: CreateDlsDeclarationRequest): Promise<DlsDeclaration> => {
		const response = await apiClient.post<DlsDeclaration>('/api/v1.0/dls/declare', request);
		return response.data;
	},

	/**
	 * Get the current user's declarations for multiple DLS races in one call.
	 * Returns an empty array if the user has no declarations.
	 * @param dlsRaceIds - Array of DLS race IDs
	 * @returns Array of the user's declarations
	 */
	getMyDeclarations: async (dlsRaceIds: number[]): Promise<DlsDeclaration[]> => {
		if (dlsRaceIds.length === 0) return [];
		const ids = dlsRaceIds.join(',');
		const response = await apiClient.get<DlsDeclaration[]>(`/api/v1.0/dls/my-declarations?ids=${ids}`);
		return response.data;
	},

	/**
	 * Update the current user's declaration
	 * @param declarationId - Declaration ID
	 * @param request - Updated bib number
	 * @returns Updated declaration
	 */
	updateMyDeclaration: async (declarationId: number, request: UpdateDlsDeclarationRequest): Promise<DlsDeclaration> => {
		const response = await apiClient.put<DlsDeclaration>(`/api/v1.0/dls/declarations/${declarationId}`, request);
		return response.data;
	},

	/**
	 * Delete the current user's declaration
	 * @param declarationId - Declaration ID
	 */
	deleteMyDeclaration: async (declarationId: number): Promise<void> => {
		await apiClient.delete(`/api/v1.0/dls/declarations/${declarationId}`);
	},

	// --- Admin Endpoints ---

	/**
	 * Get all DLS races (admin, includes past races)
	 * @param upcomingOnly - Filter to upcoming only (default true)
	 * @returns Array of DLS races
	 */
	adminGetRaces: async (upcomingOnly = true): Promise<DlsRace[]> => {
		const response = await apiClient.get<DlsRace[]>('/api/v1.0/admin/dls/races', {
			params: { upcomingOnly },
		});
		return response.data;
	},

	/**
	 * Create a new DLS race (admin)
	 * @param request - Race name, date, and optional bib numbers
	 * @returns Created DLS race
	 */
	adminCreateRace: async (request: CreateDlsRaceRequest): Promise<DlsRace> => {
		const response = await apiClient.post<DlsRace>('/api/v1.0/admin/dls/races', request);
		return response.data;
	},

	/**
	 * Update a DLS race (admin)
	 * @param dlsRaceId - DLS race ID
	 * @param request - Updated name and/or date
	 * @returns Updated DLS race
	 */
	adminUpdateRace: async (dlsRaceId: number, request: UpdateDlsRaceRequest): Promise<DlsRace> => {
		const response = await apiClient.put<DlsRace>(`/api/v1.0/admin/dls/races/${dlsRaceId}`, request);
		return response.data;
	},

	/**
	 * Delete a DLS race (admin)
	 * @param dlsRaceId - DLS race ID
	 */
	adminDeleteRace: async (dlsRaceId: number): Promise<void> => {
		await apiClient.delete(`/api/v1.0/admin/dls/races/${dlsRaceId}`);
	},

	/**
	 * Get declarations for a DLS race (admin)
	 * @param dlsRaceId - DLS race ID
	 * @returns Array of declarations
	 */
	adminGetDeclarations: async (dlsRaceId: number): Promise<DlsDeclaration[]> => {
		const response = await apiClient.get<DlsDeclaration[]>(`/api/v1.0/admin/dls/races/${dlsRaceId}/declarations`);
		return response.data;
	},

	/**
	 * Update any declaration (admin)
	 * @param declarationId - Declaration ID
	 * @param request - Updated bib number, first DLS flag, kills flag, and/or comments
	 * @returns Updated declaration
	 */
	adminUpdateDeclaration: async (declarationId: number, request: UpdateDlsDeclarationRequest): Promise<DlsDeclaration> => {
		const response = await apiClient.put<DlsDeclaration>(`/api/v1.0/admin/dls/declarations/${declarationId}`, request);
		return response.data;
	},

	/**
	 * Import declarations in bulk (admin)
	 * @param dlsRaceId - DLS race ID
	 * @param declarations - Array of declarations to import
	 * @returns Array of created declarations
	 */
	adminImportDeclarations: async (dlsRaceId: number, declarations: ImportDlsDeclarationRequest[]): Promise<DlsDeclaration[]> => {
		const response = await apiClient.post<DlsDeclaration[]>(`/api/v1.0/admin/dls/declarations/import/${dlsRaceId}`, declarations);
		return response.data;
	},

	/**
	 * Delete any declaration (admin)
	 * @param declarationId - Declaration ID
	 */
	adminDeleteDeclaration: async (declarationId: number): Promise<void> => {
		await apiClient.delete(`/api/v1.0/admin/dls/declarations/${declarationId}`);
	},

	/**
	 * Process DLS declarations after a race has been scraped (admin)
	 * @param dlsRaceId - DLS race ID
	 * @param raceId - Actual scraped race ID
	 * @returns Number of follow claims created
	 */
	adminProcessDeclarations: async (dlsRaceId: number, raceId: number): Promise<{ claimsCreated: number }> => {
		const response = await apiClient.post<{ claimsCreated: number }>(`/api/v1.0/admin/dls/races/${dlsRaceId}/process/${raceId}`);
		return response.data;
	},
};
