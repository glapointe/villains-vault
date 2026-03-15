/**
 * useMyFollows Hook
 *
 * Fetches all enriched follows for the current user and provides
 * filtering, categorisation (claimed vs. interested), and
 * unfollow/claim actions for the dashboard.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api, setAuthToken } from '../services/api';
import type { EnrichedFollow, FollowSearchResult, FollowRaceResultRequest } from '../models';
import { FollowType, EventSeries } from '../models';

interface UseMyFollowsOptions {
	/** Auth access token (null if not logged in) */
	accessToken: string | null;
}

interface UseMyFollowsReturn {
	/** All enriched follows for the user */
	follows: EnrichedFollow[];
	/** Claimed results only */
	claimed: EnrichedFollow[];
	/** Interested-only results */
	interested: EnrichedFollow[];
	/** Year filter options extracted from the data */
	yearOptions: number[];
	/** Event series filter options extracted from the data */
	seriesOptions: EventSeries[];
	/** Currently selected filter year (null = all) */
	filterYear: number | null;
	/** Currently selected filter event series (null = all) */
	filterSeries: EventSeries | null;
	/** Set the year filter */
	setFilterYear: (year: number | null) => void;
	/** Set the event series filter */
	setFilterSeries: (series: EventSeries | null) => void;
	/** Whether the initial load is in progress */
	loading: boolean;
	/** Error message, if any */
	error: string;
	/** Re-fetch follows from API */
	refresh: () => Promise<void>;
	/** Unfollow a result and remove it from state */
	unfollowResult: (raceResultId: number) => Promise<boolean>;
	/** Follow (claim) a result and refresh the list */
	claimResult: (request: FollowRaceResultRequest) => Promise<boolean>;
	/** Batch-claim multiple results, refreshing only once at the end */
	claimResults: (requests: FollowRaceResultRequest[]) => Promise<boolean>;
	/** Update an existing follow (e.g. toggle DLS) with an optimistic local update */
	updateFollow: (raceResultId: number, deadLastStarted: boolean | null) => Promise<boolean>;
	/** Search for the user's unclaimed results (paginated) */
	searchMyResults: (skip?: number, limit?: number) => Promise<FollowSearchResult[]>;
	/** Whether a mutation (follow/unfollow) is in progress */
	actionLoading: boolean;
}

/**
 * Hook for managing the user's full list of followed race results.
 */
export function useMyFollows({ accessToken }: UseMyFollowsOptions): UseMyFollowsReturn {
	const [follows, setFollows] = useState<EnrichedFollow[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [actionLoading, setActionLoading] = useState<boolean>(false);
	const [error, setError] = useState<string>('');
	const [filterYear, setFilterYear] = useState<number | null>(null);
	const [filterSeries, setFilterSeries] = useState<EventSeries | null>(null);

	const fetchFollows = useCallback(async (): Promise<void> => {
		if (!accessToken) return;

		setLoading(true);
		setError('');
		try {
			setAuthToken(accessToken);
			const data = await api.follows.getMyFollows();
			setFollows(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load follows');
		} finally {
			setLoading(false);
		}
	}, [accessToken]);

	useEffect(() => {
		fetchFollows();
	}, [fetchFollows]);

	/** Extract unique years from race dates */
	const yearOptions = useMemo(() => {
		const years = new Set<number>();
		follows.forEach((f) => {
			const year = new Date(f.raceDate).getFullYear();
			years.add(year);
		});
		return Array.from(years).sort((a, b) => b - a);
	}, [follows]);

	/** Extract unique event series */
	const seriesOptions = useMemo(() => {
		const series = new Set<EventSeries>();
		follows.forEach((f) => {
			if (f.eventSeries !== EventSeries.Unknown) {
				series.add(f.eventSeries);
			}
		});
		return Array.from(series).sort((a, b) => a - b);
	}, [follows]);

	/** Apply filters then split by follow type */
	const filtered = useMemo(() => {
		return follows.filter((f) => {
			if (filterYear !== null) {
				const year = new Date(f.raceDate).getFullYear();
				if (year !== filterYear) return false;
			}
			if (filterSeries !== null) {
				if (f.eventSeries !== filterSeries) return false;
			}
			return true;
		});
	}, [follows, filterYear, filterSeries]);

	const claimed = useMemo(
		() => filtered.filter((f) => f.followType === FollowType.Claimed),
		[filtered]
	);

	const interested = useMemo(
		() => filtered.filter((f) => f.followType === FollowType.Interested),
		[filtered]
	);

	const unfollowResult = useCallback(async (raceResultId: number): Promise<boolean> => {
		if (!accessToken) return false;
		setActionLoading(true);
		try {
			setAuthToken(accessToken);
			await api.follows.unfollow(raceResultId);
			setFollows((prev) => prev.filter((f) => f.raceResultId !== raceResultId));
			return true;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to unfollow');
			return false;
		} finally {
			setActionLoading(false);
		}
	}, [accessToken]);

	const claimResult = useCallback(async (request: FollowRaceResultRequest): Promise<boolean> => {
		if (!accessToken) return false;
		setActionLoading(true);
		try {
			setAuthToken(accessToken);
			await api.follows.follow(request);
			await fetchFollows();
			return true;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to claim result');
			return false;
		} finally {
			setActionLoading(false);
		}
	}, [accessToken, fetchFollows]);

	const claimResults = useCallback(async (requests: FollowRaceResultRequest[]): Promise<boolean> => {
		if (!accessToken || requests.length === 0) return false;
		setActionLoading(true);
		try {
			setAuthToken(accessToken);
			for (const request of requests) {
				await api.follows.follow(request);
			}
			await fetchFollows();
			return true;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to claim results');
			return false;
		} finally {
			setActionLoading(false);
		}
	}, [accessToken, fetchFollows]);

	const updateFollow = useCallback(async (raceResultId: number, deadLastStarted: boolean | null): Promise<boolean> => {
		if (!accessToken) return false;
		try {
			setAuthToken(accessToken);
			await api.follows.updateFollow(raceResultId, deadLastStarted);
			// Optimistic local update — no full refresh needed
			setFollows((prev) => prev.map((f) =>
				f.raceResultId === raceResultId ? { ...f, deadLastStarted } : f
			));
			return true;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to update follow');
			return false;
		}
	}, [accessToken]);

	const searchMyResults = useCallback(async (skip: number = 0, limit: number = 25): Promise<FollowSearchResult[]> => {
		if (!accessToken) return [];
		try {
			setAuthToken(accessToken);
			return await api.follows.searchMyResults(skip, limit);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Search failed');
			return [];
		}
	}, [accessToken]);

	return {
		follows,
		claimed,
		interested,
		yearOptions,
		seriesOptions,
		filterYear,
		filterSeries,
		setFilterYear,
		setFilterSeries,
		loading,
		error,
		refresh: fetchFollows,
		unfollowResult,
		claimResult,
		claimResults,
		updateFollow,
		searchMyResults,
		actionLoading,
	};
}
