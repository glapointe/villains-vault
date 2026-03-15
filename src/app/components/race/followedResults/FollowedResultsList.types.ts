import type { EnrichedFollow, FollowSearchResult, FollowRaceResultRequest } from '../../../models';
import type { EventSeries } from '../../../models';
import type { getThemedColors } from '../../../theme';
import type { getThemedStyles } from './FollowedResultsList.styles';

/** Resolved theme colors */
export type ThemedColors = ReturnType<typeof getThemedColors>;

/** Resolved themed styles */
export type ThemedStyles = ReturnType<typeof getThemedStyles>;

/**
 * Props for the FollowedResultsList component
 */
export interface FollowedResultsListProps {
	/** Claimed race results */
	claimed: EnrichedFollow[];
	/** Interested race results */
	interested: EnrichedFollow[];
	/** Whether data is loading */
	loading: boolean;
	/** Error message, if any */
	error: string;
	/** Mutation (follow/unfollow) in progress */
	actionLoading: boolean;
	/** Year filter options */
	yearOptions: number[];
	/** Event series filter options */
	seriesOptions: EventSeries[];
	/** Currently selected year (null = all) */
	filterYear: number | null;
	/** Currently selected event series (null = all) */
	filterSeries: EventSeries | null;
	/** Set year filter */
	onFilterYearChange: (year: number | null) => void;
	/** Set event series filter */
	onFilterSeriesChange: (series: EventSeries | null) => void;
	/** Unfollow a result */
	onUnfollow: (raceResultId: number) => Promise<boolean>;
	/** Claim a result (from search panel) */
	onClaim: (request: FollowRaceResultRequest) => Promise<boolean>;
	/** Batch-claim multiple results, refreshing only once */
	onClaimBatch: (requests: FollowRaceResultRequest[]) => Promise<boolean>;
	/** Search for the user's unclaimed results (paginated, no name needed) */
	onSearchMyResults: (skip?: number, limit?: number) => Promise<FollowSearchResult[]>;
	/** Update a follow (e.g. toggle DLS) */
	onUpdateFollow: (raceResultId: number, deadLastStarted: boolean | null) => Promise<boolean>;
}

/**
 * Display mode for the result row
 */
export type ResultRowMode = 'claimed' | 'interested' | 'search';

/**
 * A group of follows under a single event heading
 */
export interface EventGroup {
	eventId: number;
	eventName: string;
	eventSeries: EventSeries;
	results: EnrichedFollow[];
}

/**
 * Props for the ResultRow sub-component
 */
export interface ResultRowProps {
	follow: EnrichedFollow;
	mode: ResultRowMode;
	onViewResult: (resultId: number) => void;
	onUnfollow: (raceResultId: number) => void;
	onUpdateFollow: (raceResultId: number, deadLastStarted: boolean | null) => Promise<boolean>;
	colors: ThemedColors;
	themedStyles: ThemedStyles;
	actionLoading: boolean;
}

/**
 * Props for the EmptyState sub-component
 */
export interface EmptyStateProps {
	title: string;
	subtitle: string;
	themedStyles: ThemedStyles;
}

/**
 * Props for the EventGroupSection sub-component
 */
export interface EventGroupSectionProps {
	group: EventGroup;
	mode: ResultRowMode;
	onViewResult: (resultId: number) => void;
	onUnfollow: (raceResultId: number) => void;
	onUpdateFollow: (raceResultId: number, deadLastStarted: boolean | null) => Promise<boolean>;
	colors: ThemedColors;
	themedStyles: ThemedStyles;
	actionLoading: boolean;
}

/**
 * Props for the FindMyResultsPanel sub-component
 */
export interface FindMyResultsPanelProps {
	isOpen: boolean;
	onClose: () => void;
	/** Search for unclaimed results (paginated). Returns one page of results. */
	onSearch: (skip?: number, limit?: number) => Promise<FollowSearchResult[]>;
	onClaimBatch: (requests: FollowRaceResultRequest[]) => Promise<boolean>;
	colors: ThemedColors;
	themedStyles: ThemedStyles;
}
