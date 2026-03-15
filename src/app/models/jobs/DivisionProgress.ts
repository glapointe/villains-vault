/**
 * Division progress information
 */

export interface DivisionProgress {
    divisionValue: string;
    divisionName: string;
    recordsParsed: number;
    recordsAdded: number;
    recordsUpdated: number;
    status: number; // DivisionStatus enum value
    errorMessage?: string | null;
}
