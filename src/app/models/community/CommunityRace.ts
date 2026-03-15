/**
 * Community Race Model
 * 
 * Represents a single race within a community event.
 * Maps to the CommunityRaceDto from the API.
 */

/** Community race returned by the API */
export interface CommunityRace {
	/** Race ID */
	id: number;
	/** Parent event ID */
	communityEventId: number;
	/** ISO date string for the race date */
	raceDate: string;
	/** Numeric distance value (e.g. 5, 13.1, 26.2) */
	distance: number;
	/** Whether the distance is in kilometers (false = miles) */
	isKilometers: boolean;
	/** Optional comments about the race */
	comments: string | null;
	/** Whether a virtual option is available */
	hasVirtualOption: boolean;
	/** Whether this race is part of a challenge */
	isPartOfChallenge: boolean;
	/** Number of participants for this race */
	participantCount: number;
	/** ISO date string when the race was created */
	createdAt: string;
}
