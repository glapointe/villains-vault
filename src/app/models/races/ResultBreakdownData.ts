/**
 * Breakdown of pass (or passer) counts by various dimensions.
 */
export interface PassBreakdown {
	/** Passes/passers within the same division */
	byDivision?: number | null;
	/** Passes/passers within the same gender */
	byGender?: number | null;
	/** Passes/passers from the same hometown (city + region) */
	byHometown?: number | null;
	/** Passes/passers from the same region (state/country) */
	byRegion?: number | null;
}

/**
 * Rank data within various groupings, ordered by net time.
 */
export interface RankData {
	/** Total runners of the same gender and runner type in this race */
	genderTotal?: number | null;
	/** Place among runners from the same hometown, ordered by net time */
	hometownPlace?: number | null;
	/** Total runners from the same hometown */
	hometownTotal?: number | null;
	/** Place among runners from the same region, ordered by net time */
	regionPlace?: number | null;
	/** Total runners from the same region */
	regionTotal?: number | null;
}

/**
 * Strongly-typed breakdown data stored per result.
 * Contains pass/passer breakdowns and rank data by various dimensions.
 */
export interface ResultBreakdownData {
	/** Pass (kill) breakdowns by category */
	passBreakdowns?: PassBreakdown;
	/** Passer (assassin) breakdowns by category */
	passerBreakdowns?: PassBreakdown;
	/** Rank data within various groupings (by net time) */
	rankings?: RankData;
}
