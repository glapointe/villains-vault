/**
 * Submit event response
 */
export interface SubmitEventResponse {
	eventId: number;
	eventName: string;
	savedRaces: number;
	jobsCreated: number;
	jobIds: number[];
	errors: string[];
}
