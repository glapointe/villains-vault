/**
 * Race Distance Enum
 * 
 * Represents standard full race distances for runDisney events.
 * Split distances are now tracked dynamically via race metadata.
 * Values match the backend API enum values.
 */
export enum RaceDistance {
	FiveK = 1,
	TenK = 2,
	TenMile = 3,
	HalfMarathon = 4,
	FullMarathon = 5,
}

/**
 * Race distance option for UI dropdowns
 */
export interface RaceDistanceOption {
	label: string;
	value: RaceDistance | 0; // 0 represents "Select Distance"
}

/**
 * Get display label for a race distance
 */
export function getRaceDistanceLabel(distance: RaceDistance): string {
	switch (distance) {
		case RaceDistance.FiveK:
			return '5K';
		case RaceDistance.TenK:
			return '10K';
		case RaceDistance.TenMile:
			return '10 Mile';
		case RaceDistance.HalfMarathon:
			return 'Half Marathon';
		case RaceDistance.FullMarathon:
			return 'Marathon';
		default:
			return 'Unknown';
	}
}

/**
 * Get display label for a race distance
 */
export function getRaceDistanceMilesLabel(distance: RaceDistance): string {
	switch (distance) {
		case RaceDistance.FiveK:
			return '3.1 mi';
		case RaceDistance.TenK:
			return '6.2 mi';
		case RaceDistance.TenMile:
			return '10 mi';
		case RaceDistance.HalfMarathon:
			return '13.1 mi';
		case RaceDistance.FullMarathon:
			return '26.2 mi';
		default:
			return '';
	}
}
/**
 * Get distance in miles for a race distance
 */
export function getRaceDistanceMiles(distance: RaceDistance): number {
	switch (distance) {
		case RaceDistance.FiveK:
			return 3.10686;
		case RaceDistance.TenK:
			return 6.21371;
		case RaceDistance.TenMile:
			return 10.0;
		case RaceDistance.HalfMarathon:
			return 13.1;
		case RaceDistance.FullMarathon:
			return 26.2;
		default:
			return 0;
	}
}

/**
 * Color pair for distance badges
 */
export interface DistanceColorPair {
	/** Background color for the badge */
	background: string;
	/** Text color for the badge */
	text: string;
}

/**
 * Distance-specific color palette.
 * Each distance has a unique hue that progresses from short → long,
 * with light and dark mode variants for proper contrast.
 */
const DISTANCE_COLORS: Record<RaceDistance, { light: DistanceColorPair; dark: DistanceColorPair }> = {
	[RaceDistance.FiveK]: {
		light: { background: '#E0F7FA', text: '#00838F' },   // Teal — fresh, approachable
		dark:  { background: '#004D40', text: '#4DD0E1' },
	},
	[RaceDistance.TenK]: {
		light: { background: '#E8EAF6', text: '#3949AB' },   // Indigo — steady, progressing
		dark:  { background: '#1A237E', text: '#9FA8DA' },
	},
	[RaceDistance.TenMile]: {
		light: { background: '#FFF3E0', text: '#E65100' },   // Orange — warming up, endurance
		dark:  { background: '#4E342E', text: '#FFB74D' },
	},
	[RaceDistance.HalfMarathon]: {
		light: { background: '#F3E5F5', text: '#7B1FA2' },   // Purple — serious commitment
		dark:  { background: '#4A148C', text: '#CE93D8' },
	},
	[RaceDistance.FullMarathon]: {
		light: { background: '#FCE4EC', text: '#C62828' },   // Rose — peak achievement
		dark:  { background: '#B71C1C', text: '#EF9A9A' },
	},
};

/**
 * Get color pair for a race distance badge.
 * Each distance has a unique hue for instant visual differentiation.
 *
 * @param distance - The race distance enum value
 * @param isDark - Whether dark mode is active
 * @returns Background and text color pair for the badge
 */
export function getDistanceColor(distance: RaceDistance, isDark: boolean): DistanceColorPair {
	const entry = DISTANCE_COLORS[distance];
	if (!entry) {
		return isDark
			? { background: '#37474F', text: '#B0BEC5' }
			: { background: '#ECEFF1', text: '#546E7A' };
	}
	return isDark ? entry.dark : entry.light;
}

/**
 * All race distance options for runDisney events (full race distances only)
 */
export const ALL_RACE_DISTANCES: RaceDistanceOption[] = [
	{ label: '5K', value: RaceDistance.FiveK },
	{ label: '10K', value: RaceDistance.TenK },
	{ label: '10 Mile', value: RaceDistance.TenMile },
	{ label: 'Half Marathon', value: RaceDistance.HalfMarathon },
	{ label: 'Marathon', value: RaceDistance.FullMarathon },
];
