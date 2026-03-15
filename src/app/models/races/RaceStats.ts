/**
 * Age group statistics for a specific age range
 */
export interface AgeGroupItem {
	/** Label for the age group (e.g., "20-24", "80+") */
	ageGroupLabel: string;
	
	/** Number of runners in this age group */
	count: number;
	
	/** Age range for this group */
	ageRange: {
		min: number;
		max: number;
	};
	
	/** Average net time for this age group (ISO 8601 duration format) */
	averageNetTime: string;
	
	/** Average pace for this age group (ISO 8601 duration format) */
	averagePace: string;
	
	/** Median pace for this age group (ISO 8601 duration format) */
	medianPace: string;
	
	/** Number of DNF runners in this age group */
	dnfCount: number;
}

/**
 * Extended split time information with statistics
 */
export interface SplitTimeStats {
    /** The label for this split as it appears in the race results. Examples: "5K", "10K", "Half Marathon", "5 Mile", "11.5 Mile" */
    label: string;

	/** Average pace from previous split to this split marker (ISO 8601 duration format) */
	averagePace: string;
	
	/** Median pace from previous split to this split marker (ISO 8601 duration format) */
	medianPace: string;
	
	/** The total distance from the start line to the split marker. If the finish split then this will be the total race distance. */
	totalDistanceToSplitInMiles: number;

    /** The total distance from the previous split (start if this is the first split) to the split marker. If the finish split then this will be from the last available split to the finish line. */
    segmentDistanceInMiles: number;
	
	/** Number of runners with no data for this split (DNF if finish split) */
	misses: number;
}

/**
 * Comprehensive race statistics
 */
export interface RaceStats {
	/** Total number of all participants including DNF, Hand Cycle, Push Rim, Duo, and Unknown */
	totalRunners: number;
	
	/** Total number of male runners (excluding Duo since gender cannot be determined) */
	maleRunners: number;
	
	/** Total number of female runners (excluding Duo since gender cannot be determined) */
	femaleRunners: number;

	/** Total number of runners with unknown gender */
	unknownRunners: number;
	
	/** Total number of standard runners (excluding Hand Cycle, Push Rim, Duo, and Unknown) */
	runnerTypeRunner: number;
	
	/** Total number of Push Rim runners */
	runnerTypePushRim: number;
	
	/** Total number of Hand Cycle runners */
	runnerTypeHandCycle: number;
	
	/** Total number of Duo runners */
	runnerTypeDuo: number;
	
	/** Total number of DNF (Did Not Finish) runners */
	dnfCount: number;
	
	/** Split time statistics for each segment of the race */
	splits?: SplitTimeStats[];
	
	/** Number of runners with overall pace slower than 16 min/mile */
	runnersOver16minPace: number;
	
	/** Duration from first to last starter crossing the start line (ISO 8601 duration format) */
	launchTime: string;
	
	/** Launch congestion factor (ratio of total runners to launch time in minutes) */
	launchCongestionFactor: number;
	
	/** Duration from first to last finisher crossing the finish line (ISO 8601 duration format) */
	landingTime: string;
	
	/** Landing congestion factor (ratio of total runners to landing time in minutes) */
	landingCongestionFactor: number;
	
	/** Result ID of the slowest finisher (excluding DNF) */
	slowestFinisherResultId?: number;
	
	/** Result ID of the last person to cross the finish line (excluding DNF) */
	lastFinisherResultId?: number;
	
	/** Age group statistics for male runners */
	maleAgeGroupStats?: AgeGroupItem[];
	
	/** Age group statistics for female runners */
	femaleAgeGroupStats?: AgeGroupItem[];
}
