import { SubmitRace } from '../races/SubmitRace';

/**
 * Submit event request
 */
export interface SubmitEventRequest {
	url: string;
	name: string;
	races: SubmitRace[];
}
