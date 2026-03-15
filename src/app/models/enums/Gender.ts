/**
 * Represents the gender category of a runner.
 * Determined from the division label.
 */
export enum Gender {
	/**
	 * Gender cannot be determined (e.g., Duo Division)
	 */
	Unknown = 0,

	/**
	 * Male runner
	 */
	Male = 1,

	/**
	 * Female runner
	 */
	Female = 2,
}

/**
 * Get the display label for a given gender.
 * @param gender The gender enum value
 * @returns A string label for the gender
 */
export function getGenderLabel(gender: Gender): string {
	switch (gender) {
		case Gender.Male: return 'Male';
		case Gender.Female: return 'Female';
		default: return 'Unknown';
	}
};