import type { FollowType } from '../enums/FollowType';
import type { EventSeries } from '../enums/EventSeries';
import type { RaceDistance } from '../enums/RaceDistance';

/**
 * Enriched follow returned by GET /api/v1.0/follows.
 * Contains follow metadata plus race result, race, and event context
 * for dashboard display.
 */
export interface EnrichedFollow {
	/** Follow record ID */
	followId: number;
	/** Whether this is an Interested or Claimed follow */
	followType: FollowType;
	/** Whether the user dead-last started the race (Claimed only) */
	deadLastStarted: boolean | null;
	/** When the follow was created */
	followedAt: string;

	/** Race result ID */
	raceResultId: number;
	/** Runner name from the result */
	runnerName: string;
	/** Runner age at time of race */
	age: number;
	/** Runner hometown */
	hometown: string | null;
	/** Chip time (net time) */
	netTime: string | null;
	/** Overall pace per mile */
	overallPace: string | null;
	/** Overall placement */
	overallPlace: number | null;
	/** Kills (runners passed) */
	passes: number | null;

	/** Race ID */
	raceId: number;
	/** Race name */
	raceName: string;
	/** Race date */
	raceDate: string;
	/** Race distance */
	distance: RaceDistance;

	/** Event ID */
	eventId: number;
	/** Event name */
	eventName: string;
	/** Event series */
	eventSeries: EventSeries;
}

/**
 * Search result returned by GET /api/v1.0/follows/search.
 * Used by the "Find My Results" feature.
 */
export interface FollowSearchResult {
	resultId: number;
	runnerName: string;
	eventName: string;
	eventSeries: EventSeries;
	raceName: string;
	raceDate: string;
	distance: RaceDistance;
	overallPlace: number | null;
	netTime: string | null;
	overallPace: string | null;
	hometown: string | null;
}
