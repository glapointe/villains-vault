import { Gender } from "models/enums/Gender";
import { RunnerType } from "models/enums/RunnerType";
import { ResultBreakdownData } from "./ResultBreakdownData";

/**
 * Detailed race result with ID and metadata
 */
export interface RaceResult {
	id: number;
	raceId: number;
	divisionId: number;
	bibNumber: number;
	name: string;
	age: number;
	gender: Gender; // Gender enum (0=Unknown, 1=Male, 2=Female)
	runnerType: RunnerType; // RunnerType enum (0=Runner, 1=PushRim, 2=HandCycle, 3=Duo)
	divisionPlace?: number;
	overallPlace?: number;
	genderPlace?: number;
	netTime?: string;
	clockTime?: string;
    startTime?: string; // A calculated time that subtracts netTime from clockTime to get the actual start time from zero
	overallPace?: string;
	hometown?: string;
	split1?: string | null;
	split2?: string | null;
	split3?: string | null;
	split4?: string | null;
	split5?: string | null;
	split6?: string | null;
	split7?: string | null;
	split8?: string | null;
	split9?: string | null;
	split10?: string | null;
	/** Number of runners this runner passed (kills) */
	passes?: number | null;
	/** Number of runners who passed this runner (assassins) */
	passers?: number | null;
	/** Breakdown data: pass/passer breakdowns and rankings by dimension */
	resultData?: ResultBreakdownData | null;
	modifiedAt: string;
}
