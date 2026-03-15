/**
 * useDlsDeclarations Hook
 * 
 * Manages DLS race declarations: fetching upcoming races,
 * viewing declarations, self-declaring, and managing user declarations.
 */

import { useState, useEffect, useCallback } from 'react';
import { api, setAuthToken } from '../services/api';
import type { DlsRace, DlsDeclaration, CreateDlsDeclarationRequest, UpdateDlsDeclarationRequest } from '../models';

interface UseDlsDeclarationsOptions {
	/** Access token for authenticated requests (null if not logged in) */
	accessToken: string | null;
	/** Whether to auto-fetch races on mount (default true) */
	autoFetch?: boolean;
}

interface UseDlsDeclarationsReturn {
	/** List of upcoming DLS races */
	races: DlsRace[];
	/** Whether races are being loaded */
	loading: boolean;
	/** Error message if a request failed */
	error: string;
	/** Refetch the list of DLS races */
	refreshRaces: () => Promise<void>;
	/** Get declarations for a specific DLS race */
	getDeclarations: (dlsRaceId: number) => Promise<DlsDeclaration[]>;
	/** Self-declare for a DLS race */
	selfDeclare: (request: CreateDlsDeclarationRequest) => Promise<DlsDeclaration | null>;
	/** Get the current user's declarations for multiple DLS races */
	getMyDeclarations: (dlsRaceIds: number[]) => Promise<DlsDeclaration[]>;
	/** Delete the current user's declaration */
	deleteMyDeclaration: (declarationId: number, dlsRaceId?: number) => Promise<boolean>;
	/** Update the current user's declaration */
	updateMyDeclaration: (declarationId: number, request: UpdateDlsDeclarationRequest) => Promise<DlsDeclaration | null>;
	/** Get DLS result IDs for kill chart highlighting */
	getDlsResultIds: (raceId: number) => Promise<number[]>;
	/** Whether an action is in progress */
	actionLoading: boolean;
}

/**
 * Hook for managing DLS declarations
 */
export function useDlsDeclarations({ accessToken, autoFetch = true }: UseDlsDeclarationsOptions): UseDlsDeclarationsReturn {
	const [races, setRaces] = useState<DlsRace[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [actionLoading, setActionLoading] = useState<boolean>(false);
	const [error, setError] = useState<string>('');

	const refreshRaces = useCallback(async (): Promise<void> => {
		setLoading(true);
		setError('');
		try {
			const result = await api.dls.getUpcomingRaces();
			setRaces(result);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load DLS races');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (autoFetch) {
			refreshRaces();
		}
	}, [autoFetch, refreshRaces]);

	const getDeclarations = useCallback(async (dlsRaceId: number): Promise<DlsDeclaration[]> => {
		try {
			return await api.dls.getDeclarations(dlsRaceId);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load declarations');
			return [];
		}
	}, []);

	const selfDeclare = useCallback(async (request: CreateDlsDeclarationRequest): Promise<DlsDeclaration | null> => {
		if (!accessToken) return null;

		setActionLoading(true);
		setError('');
		try {
			setAuthToken(accessToken);
			const declaration = await api.dls.selfDeclare(request);
			// Update only the affected race's declaration count locally
			setRaces((prev) => prev.map((r) =>
				r.id === request.dlsRaceId
					? { ...r, declarationCount: r.declarationCount + 1 }
					: r
			));
			return declaration;
		} catch (err) {
			const message = err?.response?.data?.error || err?.message || 'Failed to create declaration';
			setError(message);
			return null;
		} finally {
			setActionLoading(false);
		}
	}, [accessToken]);

	const getMyDeclarations = useCallback(async (dlsRaceIds: number[]): Promise<DlsDeclaration[]> => {
		if (!accessToken || dlsRaceIds.length === 0) return [];

		try {
			setAuthToken(accessToken);
			return await api.dls.getMyDeclarations(dlsRaceIds);
		} catch {
			return [];
		}
	}, [accessToken]);

	const deleteMyDeclaration = useCallback(async (declarationId: number, dlsRaceId?: number): Promise<boolean> => {
		if (!accessToken) return false;

		setActionLoading(true);
		setError('');
		try {
			setAuthToken(accessToken);
			await api.dls.deleteMyDeclaration(declarationId);
			// Update only the affected race's declaration count locally
			if (dlsRaceId != null) {
				setRaces((prev) => prev.map((r) =>
					r.id === dlsRaceId
						? { ...r, declarationCount: Math.max(0, r.declarationCount - 1) }
						: r
				));
			}
			return true;
		} catch (err) {
			const message = err?.response?.data?.error || err?.message || 'Failed to delete declaration';
			setError(message);
			return false;
		} finally {
			setActionLoading(false);
		}
	}, [accessToken]);

	const getDlsResultIds = useCallback(async (raceId: number): Promise<number[]> => {
		try {
			return await api.dls.getDlsResultIds(raceId);
		} catch {
			return [];
		}
	}, []);

	const updateMyDeclaration = useCallback(async (declarationId: number, request: UpdateDlsDeclarationRequest): Promise<DlsDeclaration | null> => {
		if (!accessToken) return null;

		setActionLoading(true);
		setError('');
		try {
			setAuthToken(accessToken);
			return await api.dls.updateMyDeclaration(declarationId, request);
		} catch (err) {
			const message = err?.response?.data?.error || err?.message || 'Failed to update declaration';
			setError(message);
			return null;
		} finally {
			setActionLoading(false);
		}
	}, [accessToken]);

	return {
		races,
		loading,
		error,
		refreshRaces,
		getDeclarations,
		selfDeclare,
		getMyDeclarations,
		deleteMyDeclaration,
		updateMyDeclaration,
		getDlsResultIds,
		actionLoading,
	};
}
