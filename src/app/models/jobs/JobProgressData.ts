import { DivisionProgress } from "./DivisionProgress";
/**
 * Job progress data structure
 */

export interface JobProgressData {
    divisions: DivisionProgress[];
    totalAdded: number;
    totalUpdated: number;
}
