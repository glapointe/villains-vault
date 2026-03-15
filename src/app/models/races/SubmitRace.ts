/**
 * Submit race for event submission
 */
export interface SubmitRace {
	url: string;
	name: string;
	raceDate: string;
	distance: number; // RaceDistance enum value
	notes?: string;
	shouldProcess: boolean;
}
