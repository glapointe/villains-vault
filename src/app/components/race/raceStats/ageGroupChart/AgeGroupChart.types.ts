import { AgeGroupItem } from "models";

/**
 * Metric types that can be displayed
 */
export type AgeGroupMetric = 'count' | 'averagePace' | 'medianPace' | 'averageNetTime' | 'dnfCount';

export interface AgeGroupChartProps {
	maleAgeGroups: AgeGroupItem[];
	femaleAgeGroups: AgeGroupItem[];
	title?: string;
	/** Metric to display as bars */
	metric?: AgeGroupMetric;
}
