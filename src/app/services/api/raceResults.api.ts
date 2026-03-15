/**
 * Race Results API - Public endpoints (no auth required)
 */

import { apiClient } from './client';
import { streamFetch } from './streamFetch';
import type { RaceResult, RaceResultDetailed, PagedResults, RaceResultColumn, SortDirection, Division, RunnerType, Gender, ClosestResults, RelatedRaceResults } from '../../models';

export const raceResultsApi = {
	/**
	 * Get race result details by ID (public endpoint)
	 * @param raceResultId - ID of the race result to retrieve
	 */
	getById: async (raceResultId: number): Promise<RaceResultDetailed> => {
		const response = await apiClient.get<RaceResultDetailed>(`/api/v1.0/races/results/${raceResultId}`);
		return response.data;
	},

    /**
	 * Get all results for a race (no paging)
	 * @param raceId - ID of the race
	 * @param options - Filter and sort options
	 */
	getAllResults: async (
		raceId: number,
		options?: {
			divisionId?: number;
			gender?: Gender;
			runnerType?: RunnerType;
			sortBy?: RaceResultColumn;
			sortDirection?: SortDirection;
		}
	): Promise<RaceResult[]> => {
		const params = new URLSearchParams();
		
		if (options?.divisionId) {
			params.append('divisionId', options.divisionId.toString());
		}
		if (options?.gender !== undefined) {
			params.append('gender', options.gender.toString());
		}
		if (options?.runnerType !== undefined) {
			params.append('runnerType', options.runnerType.toString());
		}
		if (options?.sortDirection) {
			params.append('sortDirection', options.sortDirection);
		}

		const queryString = params.toString();
		const url = `/api/v1.0/races/${raceId}/results${queryString ? `?${queryString}` : ''}`;
		
		const response = await apiClient.get<RaceResult[]>(url);
		return response.data;
	},

	/**
	 * Get filtered and paged results for a race
	 * @param raceId - ID of the race
	 * @param options - Filter, sort, and pagination options
	 */
	getPagedResults: async (
		raceId: number,
		options?: {
			divisionId?: number;
			gender?: Gender;
			search?: string;
			sortBy?: RaceResultColumn;
			sortDirection?: SortDirection;
			page?: number;
			pageSize?: number;
		}
	): Promise<PagedResults<RaceResult>> => {
		const params = new URLSearchParams();
		
		if (options?.divisionId) {
			params.append('divisionId', options.divisionId.toString());
		}
		if (options?.gender !== undefined) {
			params.append('gender', options.gender.toString());
		}
		if (options?.search) {
			params.append('search', options.search);
		}
		if (options?.sortBy) {
			params.append('sortBy', options.sortBy);
		}
		if (options?.sortDirection) {
			params.append('sortDirection', options.sortDirection);
		}
		if (options?.page) {
			params.append('page', options.page.toString());
		}
		if (options?.pageSize) {
			params.append('pageSize', options.pageSize.toString());
		}

		const response = await apiClient.get<PagedResults<RaceResult>>(
			`/api/v1.0/races/${raceId}/results/paged?${params.toString()}`
		);
		return response.data;
	},

	/**
	 * Export filtered race results as CSV
	 * @param raceId - ID of the race
	 * @param options - Filter and sort options
	 */
	exportResults: async (
		raceId: number,
		options?: {
			divisionId?: number;
			gender?: Gender;
			search?: string;
			sortBy?: RaceResultColumn;
			sortDirection?: SortDirection;
		}
	): Promise<Blob> => {
		const params = new URLSearchParams();
		
		if (options?.divisionId) {
			params.append('divisionId', options.divisionId.toString());
		}
		if (options?.gender !== undefined) {
			params.append('gender', options.gender.toString());
		}
		if (options?.search) {
			params.append('search', options.search);
		}
		if (options?.sortBy) {
			params.append('sortBy', options.sortBy);
		}
		if (options?.sortDirection) {
			params.append('sortDirection', options.sortDirection);
		}

		const response = await apiClient.get(
			`/api/v1.0/races/${raceId}/results/export?${params.toString()}`,
			{ responseType: 'blob' }
		);
		return response.data;
	},

	/**
	 * Get all divisions for a race
	 * @param raceId - ID of the race
	 */
	getDivisions: async (raceId: number): Promise<Division[]> => {
		const response = await apiClient.get<Division[]>(
			`/api/v1.0/races/${raceId}/divisions`
		);
		return response.data;
	},

	/**
	 * Get the last starter (balloon lady) for a race
	 * @param raceId - ID of the race
	 */
	getLastStarter: async (raceId: number): Promise<RaceResult> => {
		const response = await apiClient.get<RaceResult>(
			`/api/v1.0/races/${raceId}/results/last-starter`
		);
		return response.data;
	},

	/**
	 * Stream all results for a race in chunks.
	 * Calls callbacks for each chunk of data received.
	 * On platforms without ReadableStream support (React Native mobile), falls back to getAllResults (returns all data at once).
	 * @param raceId - ID of the race
	 * @param options - Stream options, filters, and callbacks
	 */
	streamAllResults: async (
		raceId: number,
		options: {
			divisionId?: number;
			gender?: Gender;
			runnerType?: RunnerType;
			sortBy?: RaceResultColumn;
			sortDirection?: SortDirection;
			chunkSize?: number;
			onMetadata?: (metadata: { totalCount: number; chunkSize: number; filters: { divisionId?: number; gender?: Gender; runnerType?: RunnerType } }) => void;
			onChunk?: (data: RaceResult[], page: number, totalPages: number) => void;
			onComplete?: () => void;
			onError?: (error: Error) => void;
			signal?: AbortSignal;
		}
	): Promise<void> => {
		// Fallback function for platforms without streaming support
		const fallbackToGetAllResults = async () => {
			try {
				const response = await apiClient.get<RaceResult[]>(
					`/api/v1.0/races/${raceId}/results`,
					{
						params: {
							...(options.divisionId && { divisionId: options.divisionId }),
							...(options.gender !== undefined && { gender: options.gender }),
							...(options.runnerType !== undefined && { runnerType: options.runnerType }),
							...(options.sortBy && { sortBy: options.sortBy }),
							...(options.sortDirection && { sortDirection: options.sortDirection }),
						},
						signal: options.signal,
					}
				);
				
				const results = response.data;
				const totalCount = results.length;
				
				// Send metadata
				options.onMetadata?.({
					totalCount,
					chunkSize: totalCount,
					filters: {
						divisionId: options.divisionId,
						gender: options.gender,
						runnerType: options.runnerType,
					},
				});
				
				// Send all results as a single chunk
				options.onChunk?.(results, 1, 1);
				options.onComplete?.();
			} catch (error) {
				if (error instanceof Error && error.name !== 'AbortError') {
					options.onError?.(error);
				}
			}
		};

		// Try streaming implementation, fall back to simulated streaming if not supported
		const params = new URLSearchParams();
		
		if (options?.divisionId) {
			params.append('divisionId', options.divisionId.toString());
		}
		if (options?.gender !== undefined) {
			params.append('gender', options.gender.toString());
		}
		if (options?.runnerType !== undefined) {
			params.append('runnerType', options.runnerType.toString());
		}
		if (options?.sortBy) {
			params.append('sortBy', options.sortBy);
		}
		if (options?.sortDirection) {
			params.append('sortDirection', options.sortDirection);
		}
		if (options?.chunkSize) {
			params.append('chunkSize', options.chunkSize.toString());
		}

		const queryString = params.toString();
		const url = `/api/v1.0/races/${raceId}/results/stream${queryString ? `?${queryString}` : ''}`;

		try {
			const response = await streamFetch(apiClient.defaults.baseURL + url, {
				signal: options.signal,
				headers: {
					'Accept': 'application/x-ndjson',
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			// Defensive check — streamFetch guarantees ReadableStream on all platforms,
			// but guard against unexpected edge cases
			if (!response.body || typeof response.body.getReader !== 'function') {
				await fallbackToGetAllResults();
				return;
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				
				if (done) break;

				// Append chunk to buffer
				buffer += decoder.decode(value, { stream: true });

				// Process complete lines (newline-delimited JSON)
				const lines = buffer.split('\n');
				buffer = lines.pop() || ''; // Keep incomplete line in buffer

				for (const line of lines) {
					if (!line.trim()) continue;

					try {
						const message = JSON.parse(line);

						switch (message.type) {
							case 'metadata':
								options.onMetadata?.({
									totalCount: message.totalCount,
									chunkSize: message.chunkSize,
									filters: message.filters,
								});
								break;

							case 'chunk':
								options.onChunk?.(
									message.data,
									message.page,
									message.totalPages
								);
								break;

							case 'complete':
								options.onComplete?.();
								break;

							case 'error':
								options.onError?.(new Error(message.error));
								break;
						}
					} catch (parseError) {
						console.error('Failed to parse stream message:', parseError);
					}
				}
			}
		} catch (error) {
			options.onError?.(error instanceof Error ? error : new Error('Stream failed'));
		}
	},

	/**
	 * Get the closest starters and finishers to a target race result.
	 * Returns runners who started/finished both before and after the target runner, sorted by proximity.
	 * @param raceResultId - The race result ID to find closest results for
	 * @param fieldSize - Number of closest results to return (default: 10)
	 */
	getClosestResults: async (raceResultId: number, fieldSize: number = 10): Promise<ClosestResults> => {
		const response = await apiClient.get<ClosestResults>(
			`/api/v1.0/races/results/${raceResultId}/closest?fieldSize=${fieldSize}`
		);
		return response.data;
	},

	/**
	 * Get related race results for the same runner across races.
	 * Matches by runner name and age (with year-based offset).
	 * @param raceResultId - The source race result ID to find related results for
	 * @param eventId - Optional event ID to limit the search to a specific event
	 */
	getRelatedResults: async (raceResultId: number, eventId?: number): Promise<RelatedRaceResults> => {
		const params = new URLSearchParams();
		if (eventId !== undefined) {
			params.append('eventId', eventId.toString());
		}
		const queryString = params.toString();
		const url = `/api/v1.0/races/results/${raceResultId}/related${queryString ? `?${queryString}` : ''}`;
		const response = await apiClient.get<RelatedRaceResults>(url);
		return response.data;
	},

	/**
	 * Get a single race result by bib number within a race.
	 * @param raceId - ID of the race
	 * @param bibNumber - The bib number to look up
	 */
	getByBibNumber: async (raceId: number, bibNumber: number): Promise<RaceResult | null> => {
		try {
			const response = await apiClient.get<RaceResult>(
				`/api/v1.0/races/${raceId}/results/bib/${bibNumber}`
			);
			return response.data;
		} catch {
			return null;
		}
	},

	/**
	 * Get race results for multiple bib numbers within a race.
	 * Bibs not found are omitted from the response.
	 * @param raceId - ID of the race
	 * @param bibNumbers - Array of bib numbers to look up
	 */
	getByBibNumbers: async (raceId: number, bibNumbers: number[]): Promise<RaceResult[]> => {
		const response = await apiClient.post<RaceResult[]>(
			`/api/v1.0/races/${raceId}/results/bibs`,
			bibNumbers
		);
		return response.data;
	},
};
