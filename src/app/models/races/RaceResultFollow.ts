import type { FollowType } from '../enums/FollowType';

/**
 * Represents a user's follow on a race result
 */
export interface RaceResultFollow {
	/** Follow ID */
	id: number;
	/** The race result ID being followed */
	raceResultId: number;
	/** The type of follow (Interested or Claimed) */
	followType: FollowType;
	/** Whether the user dead-last started the race (only for Claimed follows) */
	deadLastStarted: boolean | null;
	/** When the follow was created */
	createdAt: string;
}

/**
 * Request to follow a race result
 */
export interface FollowRaceResultRequest {
	/** The race result ID to follow */
	raceResultId: number;
	/** The type of follow (0 = Interested, 1 = Claimed) */
	followType: FollowType;
	/** Whether the user dead-last started the race (only for Claimed) */
	deadLastStarted?: boolean | null;
}
