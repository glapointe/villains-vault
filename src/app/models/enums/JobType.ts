export enum JobType {
	/** * Scrape job: Scraping race results from external sources (e.g. Track Shack) */
	Scrape = 0,
	/** * RecalculateStats job: Recalculating pass/passer breakdowns and rankings for existing results */
	RecalculateStats = 1,
}

export function getJobTypeLabel(jobType: JobType): string {
	switch (jobType) {
		case JobType.Scrape: return 'Scrape';
		case JobType.RecalculateStats: return 'Recalculate Stats';
		default: return 'Unknown';
	}
};