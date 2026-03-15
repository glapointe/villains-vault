import { useState, useCallback, useRef } from 'react';
import { raceResultsApi } from '../services/api';
import type { RaceResult, RaceResultColumn, SortDirection, RunnerType, Gender } from '../models';

interface UseStreamedRaceResultsOptions {
	raceId: number;
	divisionId?: number;
	gender?: Gender;
	runnerType?: RunnerType;
	sortBy?: RaceResultColumn;
	sortDirection?: SortDirection;
	chunkSize?: number;
}

/**
 * Hook to stream large race result sets progressively.
 * Accumulates results as chunks arrive, allowing progressive rendering.
 * 
 * @example
 * ```tsx
 * const { results, isLoading, progress, error, streamResults, cancel } = useStreamedRaceResults();
 * 
 * useEffect(() => {
 *   streamResults({ 
 *     raceId: 123, 
 *     gender: Gender.Male, // Filter to male runners (includes Unknown)
 *     runnerType: RunnerType.Runner, // Filter to standard runners only
 *     sortBy: 'OverallPlace' 
 *   });
 * }, [raceId]);
 * 
 * // Results accumulate as they stream in, allowing progressive rendering
 * <FlatList data={results} ... />
 * ```
 */
export const useStreamedRaceResults = () => {
	const [results, setResults] = useState<RaceResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [progress, setProgress] = useState({ current: 0, total: 0 });
	const [error, setError] = useState<Error | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);

	const streamResults = useCallback(async (options: UseStreamedRaceResultsOptions) => {
		// Cancel any in-flight request
		abortControllerRef.current?.abort();
		abortControllerRef.current = new AbortController();

		setResults([]);
		setIsLoading(true);
		setError(null);
		setProgress({ current: 0, total: 0 });

		try {
			await raceResultsApi.streamAllResults(options.raceId, {
				divisionId: options.divisionId,
				gender: options.gender,
				runnerType: options.runnerType,
				sortBy: options.sortBy,
				sortDirection: options.sortDirection,
				chunkSize: options.chunkSize,
				signal: abortControllerRef.current.signal,

				onMetadata: (metadata) => {
					setProgress({ current: 0, total: metadata.totalCount });
				},

				onChunk: (data, page, totalPages) => {
					setResults((prev) => [...prev, ...data]);
					setProgress((prev) => ({ ...prev, current: prev.current + data.length }));
				},

				onComplete: () => {
					setIsLoading(false);
				},

				onError: (err) => {
					setError(err);
					setIsLoading(false);
				},
			});
		} catch (err) {
			if (err instanceof Error && err.name !== 'AbortError') {
				setError(err);
				setIsLoading(false);
			}
		}
	}, []);

	const cancel = useCallback(() => {
		abortControllerRef.current?.abort();
		setIsLoading(false);
	}, []);

	return {
		results,
		isLoading,
		progress,
		error,
		streamResults,
		cancel,
	};
};
