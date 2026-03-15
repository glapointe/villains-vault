import { Race } from '../races/Race';
import { EventSeries } from 'models/enums/EventSeries';

/**
 * Event with races from backend API
 */
export interface Event {
	id: number;
	name: string;
	trackShackUrl: string;
	eventSeries?: EventSeries;
	createdAt: string;
	modifiedAt: string;
	races: Race[];
}
