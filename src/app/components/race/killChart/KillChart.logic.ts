/**
 * Shared logic for Kill Chart components (web and native)
 */

import { RaceResult, getRaceDistanceMiles, RaceDistance, RunnerType } from '../../../models';
import { timeToSeconds, paceToMinutes } from '../../../utils';

export type ChartCategory = 'runner' | 'kill' | 'assassin' | 'evaluated' | 'dls';

export interface ChartDataPoint {
	x: number; // Start time in minutes
	y: number; // Overall pace in minutes per mile
	fill: string;
	stroke: string;
	strokeWidth: number;
	size: number;
	isEvaluatedRunner: boolean;
	/** Runner name for hover tooltips */
	label: string;
	/** Bib number for tooltips and potential 3D axis */
	bibNumber: number;
	/** Category for trace grouping */
	category: ChartCategory;
}

export interface BalloonLadiesSweepLine {
	balloonStartTime: number;
	balloonPace: number;
	raceDistance: number;
}

/**
 * Gets start time from result (always present, may be zero)
 */
export const getStartTime = (result: RaceResult): number => {
	const time = timeToSeconds(result.startTime);
	return time !== null ? time : 0; // Default to 0 if missing
};

/**
 * Determines if evaluated runner passed the other runner (a "kill")
 * Pass = started later but finished earlier in absolute time (clock time)
 * Only compares runners within the same runner type pool:
 * - HandCycle and PushRim compare against each other (wheelchair pool)
 * - Runner and Duo compare against each other (standard pool)
 */
export const wasKill = (evaluatedRunner: RaceResult, otherRunner: RaceResult): boolean => {
	// Check runner type compatibility
	const evalIsWheelchair = evaluatedRunner.runnerType === RunnerType.HandCycle || evaluatedRunner.runnerType === RunnerType.PushRim;
	const otherIsWheelchair = otherRunner.runnerType === RunnerType.HandCycle || otherRunner.runnerType === RunnerType.PushRim;
	if (evalIsWheelchair !== otherIsWheelchair) {
		return false;
	}

	const evalStartTime = getStartTime(evaluatedRunner);
	const otherStartTime = getStartTime(otherRunner);
	const evalClockTime = timeToSeconds(evaluatedRunner.clockTime);
	const otherClockTime = timeToSeconds(otherRunner.clockTime);
	
	if (evalClockTime === null || otherClockTime === null) {
		return false;
	}
	// Evaluated runner started later but finished earlier = passed them
	return evalStartTime > otherStartTime && evalClockTime < otherClockTime;
};

/**
 * Determines if other runner passed the evaluated runner (an "assassin")
 * Pass = other started later but finished earlier in absolute time (clock time)
 * Only compares runners within the same runner type pool:
 * - HandCycle and PushRim compare against each other (wheelchair pool)
 * - Runner and Duo compare against each other (standard pool)
 */
export const wasAssassin = (evaluatedRunner: RaceResult, otherRunner: RaceResult): boolean => {
	// Check runner type compatibility
	const evalIsWheelchair = evaluatedRunner.runnerType === RunnerType.HandCycle || evaluatedRunner.runnerType === RunnerType.PushRim;
	const otherIsWheelchair = otherRunner.runnerType === RunnerType.HandCycle || otherRunner.runnerType === RunnerType.PushRim;
	if (evalIsWheelchair !== otherIsWheelchair) {
		return false;
	}

	const evalStartTime = getStartTime(evaluatedRunner);
	const otherStartTime = getStartTime(otherRunner);
	const evalClockTime = timeToSeconds(evaluatedRunner.clockTime);
	const otherClockTime = timeToSeconds(otherRunner.clockTime);
	
	if (evalClockTime === null || otherClockTime === null) {
		return false;
	}
	// Other runner started later but finished earlier = passed eval runner
	return otherStartTime > evalStartTime && otherClockTime < evalClockTime;
};

/**
 * Transforms results to chart data points
 */
export const transformToChartData = (
	results: RaceResult[],
	evaluatedRunner: RaceResult,
	dlsResultIds: number[],
): ChartDataPoint[] => {
	const points: ChartDataPoint[] = [];

	// Add all streamed results
	results.forEach((result: RaceResult) => {
		const startTime = getStartTime(result);
		const pace = paceToMinutes(result.overallPace);

		if (pace !== null && pace > 0) {
			const isKill = wasKill(evaluatedRunner, result);
			const isAssassin = wasAssassin(evaluatedRunner, result);
			const isDls = dlsResultIds != null && dlsResultIds.includes(result.id);

			let fill: string;
			let stroke: string;
			let strokeWidth: number;
			let category: ChartCategory;

			if (isKill && !isDls) {
				// Kills: Orange circle with red fill
				fill = '#dc2626'; // red-600
				stroke = '#f97316'; // orange-500
				strokeWidth = 1,
				category = 'kill';
			} else if (isAssassin && !isDls) {
				// Assassins: Green circle with dark green fill
				fill = '#15803d'; // green-700
				stroke = '#22c55e'; // green-500
				strokeWidth = 1,
				category = 'assassin';
			} else {
				// Regular runners: Blue circle, no fill
				fill = 'transparent';
				stroke = '#3b82f6'; // blue-500
				strokeWidth = 1,
				category = 'runner';
			}

			points.push({
				x: startTime / 60, // Convert to minutes
				y: pace,
				fill,
				stroke,
				strokeWidth,
				size: 2,
				isEvaluatedRunner: false,
				label: result.name || 'Unknown',
				bibNumber: result.bibNumber,
				category,
			});

			if (isDls) {
				// Highlight DLS result with an empty circle slightly larger than the regular point
				points.push({
					x: startTime / 60,
					y: pace,
					fill: 'transparent',
					stroke: '#cba418',
					strokeWidth: 2,
					size: 4,
					isEvaluatedRunner: false,
					label: result.name || 'Unknown',
					bibNumber: result.bibNumber,
					category: 'dls',
				});
			}
		}
	});

	// Always add evaluated runner (may overlay existing point)
	const evalStartTime = getStartTime(evaluatedRunner);
	const evalPace = paceToMinutes(evaluatedRunner.overallPace);

	if (evalPace !== null && evalPace > 0) {
		points.push({
			x: evalStartTime / 60, // Convert to minutes
			y: evalPace,
			fill: '#dc2626', // red-600
			stroke: '#000000', // black
			strokeWidth: 1,
			size: 5,
			isEvaluatedRunner: true,
			label: evaluatedRunner.name || 'You',
			bibNumber: evaluatedRunner.bibNumber,
			category: 'evaluated',
		});
	}

	return points;
};

/**
 * Calculates balloon ladies sweep line data
 */
export const calculateBalloonSweepLine = (
	lastStarter: RaceResult | null,
	raceDistance: RaceDistance | null
): BalloonLadiesSweepLine | null => {
	if (!lastStarter || !raceDistance) return null;

	const balloonStartTime = getStartTime(lastStarter) / 60; // Convert to minutes
	const balloonPace = 16; // 16 min/mile
	const raceDistanceMiles = getRaceDistanceMiles(raceDistance); // Distance in miles

	return {
		balloonStartTime,
		balloonPace,
		raceDistance: raceDistanceMiles,
	};
};

/**
 * Calculates chart axis domains
 */
export const calculateDomains = (chartData: ChartDataPoint[]) => {
	// Y-axis domain (4 to max pace, ensuring 16 is visible)
	const yDomain: [number, number] = chartData.length === 0
		? [4, 20]
		: [4, Math.ceil(Math.max(...chartData.map(d => d.y), 18)) + 1];

	// X-axis domain (slight left padding so points at 0 aren't clipped by the axis)
	const xDomain: [number, number] = chartData.length === 0
		? [-0.5, 60]
		: [-0.5, Math.ceil(Math.max(...chartData.map(d => d.x), 1))];

	return { xDomain, yDomain };
};

/**
 * Generates axis tick values
 */
export const generateTicks = (xDomain: [number, number], yDomain: [number, number]) => {
	// Y-axis ticks (every 2 minutes from 4)
	const yTicks: number[] = [];
	for (let i = 4; i <= yDomain[1]; i += 2) {
		yTicks.push(i);
	}

	// X-axis ticks (every 5 minutes)
	const xTicks: number[] = [];
	for (let i = 0; i <= xDomain[1]; i += 5) {
		xTicks.push(i);
	}

	return { xTicks, yTicks };
};

/**
 * Counts kills and assassins
 */
export const calculateStats = (results: RaceResult[], evaluatedRunner: RaceResult, dlsResultIds: number[]) => {
	let kills = 0;
	let assassins = 0;

	results.forEach((result: RaceResult) => {
		const isDls = dlsResultIds != null && dlsResultIds.includes(result.id);
		if (!isDls) {
			if (wasKill(evaluatedRunner, result)) kills++;
			if (wasAssassin(evaluatedRunner, result)) assassins++;
		}
	});

	return { kills, assassins };
};

/**
 * Formats pace value for display (e.g., "16:30")
 */
export const formatPace = (pace: number): string => {
	const minutes = Math.floor(pace);
	const seconds = ((pace % 1) * 60).toFixed(0).padStart(2, '0');
	return `${minutes}:${seconds}`;
};
