/**
 * Race preview for event submission
 */
export interface RacePreview {
	url: string;
	name: string;
	raceDate: string;
	distance?: number; // RaceDistance enum value (nullable)
	notes?: string | null;
	isExisting: boolean;
	existingId?: number;
	resultCount: number;
}
