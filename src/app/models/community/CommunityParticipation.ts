/**
 * Community Participation Model
 * 
 * Represents a user's participation in a community race.
 * Maps to the CommunityParticipationDto from the API.
 */

/** Community participation returned by the API */
export interface CommunityParticipation {
	/** Participation ID */
	id: number;
	/** The community race ID */
	communityRaceId: number;
	/** User ID of the participant */
	userId: number;
	/** Display name of the participant */
	userDisplayName: string | null;
	/** Whether the user is DLSing this race */
	isDls: boolean;
	/** Whether the user is doing the challenge */
	isChallenge: boolean;
	/** Whether the user is doing it virtually */
	isVirtual: boolean;
	/** Whether the user is spectating */
	isSpectator: boolean;
	/** Optional notes (companions, travel plans, etc.) */
	notes: string | null;
	/** ISO date string when the participation was created */
	createdAt: string;
}
