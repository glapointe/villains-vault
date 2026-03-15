import { JobProgressData } from "./JobProgressData";
import { JobType } from "models/enums/JobType";
import { JobStatus } from "models/enums/JobStatus";

/**
 * Job from backend API
 */
export interface Job {
	id: number;
    eventName: string;
	raceId: number;
	raceName: string;
	jobType: JobType; // JobType enum value (0 = Scrape, 1 = RecalculateStats)
	status: JobStatus; // JobStatus enum value
	progressData?: JobProgressData | null;
	cancellationRequested: boolean;
	createdAt: string;
	completedAt?: string | null;
}
