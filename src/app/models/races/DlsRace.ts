/**
 * DLS Race model
 * Represents a race that has been set up for DLS (Dead Last Start) declarations
 */
export interface DlsRace {
	/** DLS race ID */
	id: number;
	/** Display name for this DLS race (e.g. "Princess Half Marathon 2025") */
	name: string;
	/** The date of the race */
	raceDate: string;
	/** Optional link to the actual scraped race entity */
	raceId: number | null;
	/** When this DLS race was created */
	createdAt: string;
	/** Number of declarations for this race */
	declarationCount: number;
}
