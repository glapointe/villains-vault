/**
 * Community Request Models
 * 
 * Request types for creating and managing community events,
 * races, and participations.
 */

/** Request to create a new community event with races */
export interface CreateCommunityEventRequest {
	/** Event title (required) */
	title: string;
	/** Optional link to event website */
	link?: string;
	/** Optional comments about the event */
	comments?: string;
	/** Optional event location */
	location?: string;
	/** Races to create with the event (at least one required) */
	races: CreateCommunityRaceRequest[];
}

/** Request to create a single community race */
export interface CreateCommunityRaceRequest {
	/** Date and time of the race (ISO string) */
	raceDate: string;
	/** Numeric distance value */
	distance: number;
	/** Whether the distance is in kilometers (false = miles) */
	isKilometers: boolean;
	/** Optional comments about the race */
	comments?: string;
	/** Whether the race offers a virtual option */
	hasVirtualOption: boolean;
	/** Whether this race is part of a challenge */
	isPartOfChallenge: boolean;
}

/** Request to update a community event */
export interface UpdateCommunityEventRequest {
	/** Updated title */
	title?: string;
	/** Updated link */
	link?: string;
	/** Updated comments */
	comments?: string;
	/** Updated location */
	location?: string;
}

/** Request to update a community race */
export interface UpdateCommunityRaceRequest {
	/** Updated race date */
	raceDate?: string;
	/** Updated distance */
	distance?: number;
	/** Updated kilometer flag */
	isKilometers?: boolean;
	/** Updated comments */
	comments?: string;
	/** Updated virtual option flag */
	hasVirtualOption?: boolean;
	/** Updated challenge flag */
	isPartOfChallenge?: boolean;
}

/** Request to save participation for an event (batch of per-race entries) */
export interface SaveCommunityParticipationRequest {
	/** Per-race participation entries */
	entries: RaceParticipationEntry[];
}

/** A single race participation entry within a batch save */
export interface RaceParticipationEntry {
	/** The community race ID */
	communityRaceId: number;
	/** Whether the user is DLSing this race */
	isDls: boolean;
	/** Whether the user is doing the challenge */
	isChallenge: boolean;
	/** Whether the user is doing it virtually */
	isVirtual: boolean;
	/** Whether the user is just spectating */
	isSpectator: boolean;
	/** Optional notes (companions, travel plans, etc.) */
	notes?: string;
}
