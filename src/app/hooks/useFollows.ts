/**
 * useFollows Hook
 * 
 * Manages follow/unfollow state for a specific race result.
 * Fetches the current follow status on mount and provides
 * actions to follow and unfollow.
 */

import { useState, useEffect, useCallback } from 'react';
import { api, setAuthToken } from '../services/api';
import type { RaceResultFollow, FollowRaceResultRequest } from '../models';
import { FollowType } from '../models';

interface UseFollowsOptions {
	/** The race result ID to check follow status for */
	raceResultId: number;
	/** Access token for authenticated requests (null if not logged in) */
	accessToken: string | null;
}

interface UseFollowsReturn {
	/** The current follow object, or null if not following */
	follow: RaceResultFollow | null;
	/** Whether the follow status is being loaded */
	loading: boolean;
	/** Whether a follow/unfollow action is in progress */
	actionLoading: boolean;
	/** Error message if a request failed */
	error: string;
	/** Whether the user is currently following this result */
	isFollowing: boolean;
	/** Follow a race result */
	followResult: (request: FollowRaceResultRequest) => Promise<boolean>;
	/** Unfollow a race result */
	unfollowResult: () => Promise<boolean>;
}

/**
 * Hook for managing follow state on a race result
 */
export function useFollows({ raceResultId, accessToken }: UseFollowsOptions): UseFollowsReturn {
	const [follow, setFollow] = useState<RaceResultFollow | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [actionLoading, setActionLoading] = useState<boolean>(false);
	const [error, setError] = useState<string>('');

	const isFollowing = follow !== null;

	// Fetch follow status on mount or when raceResultId changes
	useEffect(() => {
		const fetchFollowStatus = async (): Promise<void> => {
			if (!accessToken || !raceResultId) return;

			setLoading(true);
			setError('');
			try {
				setAuthToken(accessToken);
				const result = await api.follows.getFollowStatus(raceResultId);
				setFollow(result);
			} catch (err) {
				// Don't show error for auth issues - user just isn't logged in
				const status = (err as { response?: { status?: number } })?.response?.status;
				if (status !== 401 && status !== 403) {
					setError(err instanceof Error ? err.message : 'Failed to check follow status');
				}
			} finally {
				setLoading(false);
			}
		};

		fetchFollowStatus();
	}, [raceResultId, accessToken]);

	const followResult = useCallback(async (request: FollowRaceResultRequest): Promise<boolean> => {
		if (!accessToken) return false;

		setActionLoading(true);
		setError('');
		try {
			setAuthToken(accessToken);
			const result = await api.follows.follow(request);
			setFollow(result);
			return true;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to follow result');
			return false;
		} finally {
			setActionLoading(false);
		}
	}, [accessToken]);

	const unfollowResult = useCallback(async (): Promise<boolean> => {
		if (!accessToken) return false;

		setActionLoading(true);
		setError('');
		try {
			setAuthToken(accessToken);
			await api.follows.unfollow(raceResultId);
			setFollow(null);
			return true;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to unfollow result');
			return false;
		} finally {
			setActionLoading(false);
		}
	}, [accessToken, raceResultId]);

	return {
		follow,
		loading,
		actionLoading,
		error,
		isFollowing,
		followResult,
		unfollowResult,
	};
}
