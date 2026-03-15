import type { RaceMetadata } from './RaceMetadata';
import type { Event } from '../events/Event';
import { RaceDistance } from '../enums/RaceDistance';
import { EventSeries } from 'models/enums/EventSeries';

/**
 * Race from backend API
 */
export interface Race {
	id: number;
	eventId: number;
	name: string;
	eventSeries?: EventSeries; // Optional event series for enhanced context
	raceDate: string;
	distance: RaceDistance; // RaceDistance enum value
	notes?: string;
	trackShackUrl: string;
	metadata?: RaceMetadata;
	createdAt: string;
	modifiedAt: string;
    event?: Event; // Optional event data for convenience
}
