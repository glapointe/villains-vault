import { RacePreview } from '../races/RacePreview';

/**
 * Event preview for event submission
 */
export interface EventPreview {
	url: string;
	name: string;
	isExisting: boolean;
	existingId?: number;
	races: RacePreview[];
}
