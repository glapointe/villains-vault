/**
 * Shared logic for Pace Chart components (web and native)
 * 
 * Calculates and formats pace data for split-by-split pace analysis
 */

import { timeToSeconds, paceToMinutes, minutesToPace, kmToMiles } from '../../../utils';
import { RaceResultDetailed, SplitTimeInfo, SplitTimeStats } from '../../../models';

export interface PaceDataPoint {
	x: number; // Distance in miles or km
	y: number; // Pace in minutes per mile
	segmentLabel: string; // Segment label (e.g., "0-5K", "5K-10K")
    paceLabel: string; // Formatted pace label (e.g., "8:24")
}

export interface RaceStatsPaceDataPoint extends PaceDataPoint {
	median: number; // Median pace in minutes per mile
	medianLabel: string; // Formatted median pace
}

/**
 * Calculate pace for a segment given two cumulative times and the distance between them
 * 
 * @param startTime - Starting time (cumulative from race start), undefined/null = race start (0:00:00)
 * @param endTime - Ending time (cumulative from race start)
 * @param distanceInMiles - Distance of the segment in miles
 * @returns Pace in minutes per mile, or null if calculation fails
 */
const calculateSegmentPace = (
	startTime: string | null | undefined,
	endTime: string | null | undefined,
	distanceInMiles: number
): number | null => {
	// Treat undefined/null startTime as race start (0 seconds)
	const startSeconds = startTime ? timeToSeconds(startTime) : 0;
	const endSeconds = timeToSeconds(endTime || undefined);
	
	if (startSeconds === null || endSeconds === null || distanceInMiles <= 0) {
		return null;
	}
	
	const segmentTimeSeconds = endSeconds - startSeconds;
	const segmentTimeMinutes = segmentTimeSeconds / 60;
	const paceMinutesPerMile = segmentTimeMinutes / distanceInMiles;
	
	return paceMinutesPerMile > 0 ? paceMinutesPerMile : null;
};


/**
 * Calculate pace data for all split segments
 * 
 * @param result - Race result with split times
 * @param splitTimes - Metadata about split distances
 * @param totalDistanceInMiles - Total race distance in miles
 * @returns Array of pace data points for each segment
 */
export const calculatePaceData = (
	result: RaceResultDetailed,
	splitTimes: SplitTimeInfo[],
	totalDistanceInMiles: number
): PaceDataPoint[] => {
	const paceData: PaceDataPoint[] = [];
    const splitTimesWithFinish = [...splitTimes]; // Create a copy to avoid mutating original
    // Add the finish time as the last split
    splitTimesWithFinish.push({
        label: 'Finish',
        distance: totalDistanceInMiles,
        isKilometers: false,
    });
	// Get all split values
	const splitValues = [
		result.split1,
		result.split2,
		result.split3,
		result.split4,
		result.split5,
		result.split6,
		result.split7,
		result.split8,
		result.split9,
		result.split10,
	];
    splitValues[splitTimes.length ?? splitValues.length - 1] = result.netTime;
	
	// Track cumulative distance
	let cumulativeDistance = 0;
	let previousTime: string | null | undefined = undefined;
	let previousDistance = 0;
	
	// Process each split
	for (let i = 0; i < splitTimesWithFinish.length; i++) {
		const split = splitTimesWithFinish[i];
		const splitValue = splitValues[i];
		
		// Convert split distance to miles if needed
		const splitDistanceInMiles = split.isKilometers 
			? kmToMiles(split.distance) 
			: split.distance;
		
		cumulativeDistance = splitDistanceInMiles;
		
		// Calculate segment distance
		const segmentDistance = cumulativeDistance - previousDistance;
		
		// Calculate pace for this segment
		const pace = calculateSegmentPace(
			previousTime,
			splitValue,
			segmentDistance
		);
		
		if (pace !== null) {
			// Create distance label for x-axis (e.g., "5mi", "10K")
			const distanceLabel = split.isKilometers 
				? `${split.distance}K`
				: `${split.distance}mi`;
			
			paceData.push({
				x: cumulativeDistance,
				y: pace,
				segmentLabel: distanceLabel,
                paceLabel: minutesToPace(pace),
			});
		}
		
		previousTime = splitValue;
		previousDistance = cumulativeDistance;
	}
	return paceData;
};

/**
 * Get overall pace as a constant line across the chart
 * 
 * @param overallPace - Overall pace string (e.g., "00:08:24")
 * @param totalDistanceInMiles - Total race distance in miles
 * @returns Array of two points forming a horizontal line
 */
export const getOverallPaceLine = (
	overallPace: string | null | undefined,
	totalDistanceInMiles: number
): PaceDataPoint[] => {
	const pace = paceToMinutes(overallPace || undefined);
	
	if (pace === null) {
		return [];
	}
	
	return [
		{ x: 0, y: pace, segmentLabel: 'Overall', paceLabel: minutesToPace(pace) },
		{ x: totalDistanceInMiles, y: pace, segmentLabel: 'Overall', paceLabel: minutesToPace(pace) },
	];
};

/**
 * Calculate Y-axis domain with padding
 */
export const calculateYDomain = (paceData: PaceDataPoint[], overallPaceLine: PaceDataPoint[]): [number, number] => {
	const allPaces = [...paceData, ...overallPaceLine].map(p => p.y);
	
	if (allPaces.length === 0) {
		return [0, 20]; // Default range
	}
	
	const minPace = Math.min(...allPaces);
	const maxPace = Math.max(...allPaces);
	
	// Add 10% padding
	const padding = (maxPace - minPace) * 0.1;
	
	return [
		Math.max(0, minPace - padding),
		maxPace + padding,
	];
};

/**
 * Calculate pace data from race statistics
 * 
 * @param splits - Split time statistics from race stats
 * @returns Array of pace data points with average and median paces
 */
export const calculateRaceStatsPaceData = (
	splits: SplitTimeStats[]
): RaceStatsPaceDataPoint[] => {
	return splits.map((split, index) => {
		const averagePace = paceToMinutes(split.averagePace);
		const medianPace = paceToMinutes(split.medianPace);
		
		return {
			x: index,
			y: averagePace || 0,
			median: medianPace || 0,
			segmentLabel: split.label,
			paceLabel: minutesToPace(averagePace || 0),
			medianLabel: minutesToPace(medianPace || 0),
		};
	});
};