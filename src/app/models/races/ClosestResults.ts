import { RaceResult } from './RaceResult';

/**
 * Race result with proximity information to a target result
 */
export interface RaceResultWithProximity extends RaceResult {
	/**
	 * Absolute time difference from the target result.
	 * For starters: difference in start time.
	 * For finishers: difference in finish time (net time).
	 */
	timeDifference: string; // TimeSpan formatted as string (HH:MM:SS)
}

/**
 * DTO containing race results closest to a target result by start time and finish time
 */
export interface ClosestResults {
	/**
	 * The target race result that was used to find closest starters and finishers
	 */
	targetResult: RaceResult;

	/**
	 * The closest starters (by start time), sorted by proximity to the target result.
	 * Includes runners who started both before and after the target runner.
	 */
	closestStarters: RaceResultWithProximity[];

	/**
	 * The closest finishers (by finish time/net time), sorted by proximity to the target result.
	 * Includes runners who finished both before and after the target runner.
	 */
	closestFinishers: RaceResultWithProximity[];
}
