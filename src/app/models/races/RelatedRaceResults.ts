import type { RaceDistance } from '../enums/RaceDistance';

/**
 * Related race results for the same runner across events.
 * Used to display navigation badges linking to other races the runner participated in.
 */
export interface RelatedRaceResults {
	/** The source result ID used to find related results */
	sourceResultId: number;
	/** The source result's race ID */
	sourceRaceId: number;
	/** Related results grouped by event */
	events: RelatedEventResults[];
}

/**
 * An event containing related race results for the same runner.
 */
export interface RelatedEventResults {
	/** The event ID */
	eventId: number;
	/** The event name */
	eventName: string;
	/** Races within this event with their matched results */
	races: RelatedRaceResultItem[];
}

/**
 * A single race within an event and the matched result (if found) for the runner.
 */
export interface RelatedRaceResultItem {
	/** The race ID */
	raceId: number;
	/** The race name */
	raceName: string;
	/** The race distance enum value */
	distance: RaceDistance;
	/** The race date */
	raceDate: string;
	/** The matched result ID, or null if no unique match could be determined */
	resultId: number | null;
}
