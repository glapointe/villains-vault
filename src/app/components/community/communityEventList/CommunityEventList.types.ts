/**
 * CommunityEventList Types
 */

import type { CommunityEvent } from '../../../models';

/** Props for the CommunityEventList component */
export interface CommunityEventListProps {
	/** Whether the user is authenticated */
	isAuthenticated: boolean;
	/** Current user ID (for ownership checks) */
	currentUserId?: number;
}

/** Filter state for community events */
export interface CommunityEventFilters {
	year: number | null;
	name: string;
	location: string;
	includePast: boolean;
	page: number;
	pageSize: number;
}
