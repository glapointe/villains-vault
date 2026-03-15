/**
 * Runner Type Enum
 * 
 * Represents the type of runner participating in a race.
 * This is determined from the division name.
 * Values match the backend API enum values.
 */
export enum RunnerType {
	Runner = 0,
	PushRim = 1,
	HandCycle = 2,
	Duo = 3,
}

/**
 * Get display label for a runner type
 */
export function getRunnerTypeLabel(type: RunnerType): string {
	switch (type) {
		case RunnerType.Runner:
			return 'Runner';
		case RunnerType.PushRim:
			return 'Push Rim';
		case RunnerType.HandCycle:
			return 'Hand Cycle';
		case RunnerType.Duo:
			return 'Duo';
		default:
			return 'Unknown';
	}
}

/**
 * Get all runner types as options for dropdowns
 */
export function getRunnerTypeOptions(): Array<{ label: string; value: RunnerType }> {
	return [
		{ label: 'Runner', value: RunnerType.Runner },
		{ label: 'Push Rim', value: RunnerType.PushRim },
		{ label: 'Hand Cycle', value: RunnerType.HandCycle },
		{ label: 'Duo', value: RunnerType.Duo },
	];
}
