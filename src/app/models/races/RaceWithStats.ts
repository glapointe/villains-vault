import { Race } from './Race';
import { RaceStats } from './RaceStats';
/**
 * Detailed race result with ID and metadata
 */
export interface RaceWithStats extends Race {
	raceStats: RaceStats;
}
