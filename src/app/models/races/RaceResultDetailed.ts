import { RaceResult } from './RaceResult';
/**
 * Detailed race result with ID and metadata
 */
export interface RaceResultDetailed extends RaceResult {
	raceRunners: number;
    divisionRunners: number;
}
