import { RaceResultDetailed, SplitTimeInfo, RaceDistance, SplitTimeStats } from "models";

/**
 * Props for PaceChart component
 */
export interface PaceChartProps {
	/**
	 * Race result with split times (for individual runner view)
	 */
	result?: RaceResultDetailed;

	/**
	 * Split time metadata from race (for individual runner view)
	 */
	splitTimes?: SplitTimeInfo[];

	/**
	 * Total race distance (enum value) (for individual runner view)
	 */
	raceDistance?: RaceDistance;

	/**
	 * Race statistics splits (for race stats view)
	 */
	statsSplits?: SplitTimeStats[];

	/**
	 * Optional custom title for the chart
	 */
	title?: string;
}