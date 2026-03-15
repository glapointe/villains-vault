/**
 * CommunityEventFormPanel Types
 */

import type { CommunityEvent } from '../../../models';

/** Props for the CommunityEventFormPanel */
export interface CommunityEventFormPanelProps {
	/** Whether the panel is open */
	isOpen: boolean;
	/** Event to edit (null for create mode) */
	event: CommunityEvent | null;
	/** Callback when the panel closes */
	onClose: () => void;
	/** Callback when an event is created or updated */
	onSaved: () => void;
}

/** Local state for a race form row */
export interface RaceFormRow {
	/** Temp key for React list rendering */
	key: string;
	/** Existing race ID (undefined for new) */
	id?: number;
	/** Race date ISO string */
	raceDate: string;
	/** Distance value */
	distance: string;
	/** Whether km or mi */
	isKilometers: boolean;
	/** Comments */
	comments: string;
	/** Virtual option */
	hasVirtualOption: boolean;
	/** Part of challenge */
	isPartOfChallenge: boolean;
	/** Whether this row was deleted (for edit mode) */
	deleted?: boolean;
}
