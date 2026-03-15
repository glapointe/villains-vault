/**
 * useUsers Hook
 * 
 * Manages paged user data fetching for the admin user management grid.
 * Handles pagination, sorting, and search with server-side processing.
 */

import { useState, useEffect, useCallback } from 'react';
import { api, setAuthToken } from '../services/api';
import type { UserProfile, UserSortField, SortDirection } from '../models';

interface UseUsersOptions {
	/** Access token for authenticated requests */
	accessToken: string;
	/** Initial page size (default: 25) */
	initialPageSize?: number;
}

interface UseUsersReturn {
	/** Current page of user results */
	users: UserProfile[];
	/** Whether data is being loaded */
	loading: boolean;
	/** Error message if request failed */
	error: string;
	/** Current page number */
	page: number;
	/** Current page size */
	pageSize: number;
	/** Total number of users */
	totalCount: number;
	/** Total number of pages */
	totalPages: number;
	/** Current sort field */
	sortField: UserSortField;
	/** Current sort direction */
	sortDirection: SortDirection;
	/** Current search term */
	searchTerm: string;
	/** Update current page */
	setPage: (page: number) => void;
	/** Update page size */
	setPageSize: (size: number) => void;
	/** Update sort field and direction */
	handleSort: (field: UserSortField) => void;
	/** Update search term */
	setSearchTerm: (term: string) => void;
	/** Refetch the current page of users */
	refetch: () => Promise<void>;
}

/**
 * Hook for fetching and managing paged user data
 */
export function useUsers({ accessToken, initialPageSize = 25 }: UseUsersOptions): UseUsersReturn {
	const [users, setUsers] = useState<UserProfile[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string>('');
	const [page, setPage] = useState<number>(1);
	const [pageSize, setPageSize] = useState<number>(initialPageSize);
	const [totalCount, setTotalCount] = useState<number>(0);
	const [totalPages, setTotalPages] = useState<number>(0);
	const [sortField, setSortField] = useState<UserSortField>('createdAt');
	const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [debouncedSearch, setDebouncedSearch] = useState<string>('');

	// Debounce search term
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchTerm);
			setPage(1);
		}, 500);
		return () => clearTimeout(timer);
	}, [searchTerm]);

	const fetchUsers = useCallback(async (): Promise<void> => {
		setLoading(true);
		setError('');
		try {
			setAuthToken(accessToken);
			const result = await api.users.getPagedUsers({
				page,
				pageSize,
				search: debouncedSearch || undefined,
				sortBy: sortField,
				sortDirection,
			});
			setUsers(result.items);
			setTotalCount(result.totalCount);
			setTotalPages(result.totalPages);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load users');
		} finally {
			setLoading(false);
		}
	}, [accessToken, page, pageSize, debouncedSearch, sortField, sortDirection]);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	const handleSort = useCallback((field: UserSortField): void => {
		if (sortField === field) {
			setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
		} else {
			setSortField(field);
			setSortDirection('asc');
		}
		setPage(1);
	}, [sortField]);

	const handleSetPageSize = useCallback((size: number): void => {
		setPageSize(size);
		setPage(1);
	}, []);

	return {
		users,
		loading,
		error,
		page,
		pageSize,
		totalCount,
		totalPages,
		sortField,
		sortDirection,
		searchTerm,
		setPage,
		setPageSize: handleSetPageSize,
		handleSort,
		setSearchTerm,
		refetch: fetchUsers,
	};
}
