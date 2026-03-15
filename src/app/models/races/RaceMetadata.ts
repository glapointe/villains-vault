/**
 * Split time information for a race
 */
export interface SplitTimeInfo {
	distance: number;
	label: string;
	isKilometers: boolean; // true if kilometers, false if miles
}

/**
 * Race metadata containing split time information
 */
export interface RaceMetadata {
	splitTimes: SplitTimeInfo[];
}
