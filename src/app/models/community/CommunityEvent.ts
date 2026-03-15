/**
 * Community Event Model
 * 
 * Represents a user-created community event with associated races.
 * Maps to the CommunityEventDto from the API.
 */

import type { CommunityRace } from './CommunityRace';

/** Community event returned by the API */
export interface CommunityEvent {
	/** Event ID */
	id: number;
	/** Event title */
	title: string;
	/** Optional link to event website */
	link: string | null;
	/** Optional comments about the event */
	comments: string | null;
	/** Optional event location */
	location: string | null;
	/** ID of the user who created the event */
	createdByUserId: number;
	/** Display name of the event creator */
	createdByDisplayName: string | null;
	/** ISO date string when the event was created */
	createdAt: string;
	/** Races in this event */
	races: CommunityRace[];
	/** Total distinct participants across all races */
	participantCount: number;
	/** Whether the current authenticated user is participating */
	isCurrentUserGoing: boolean;
}
