/**
 * CommunityParticipationPanel Types
 */

import type { CommunityEvent } from '../../../models';

/** Props for the CommunityParticipationPanel */
export interface CommunityParticipationPanelProps {
	/** Whether the panel is open */
	isOpen: boolean;
	/** The event to participate in */
	event: CommunityEvent | null;
	/** Callback when the panel closes */
	onClose: () => void;
	/** Callback when participation is saved */
	onSaved: () => void;
}

/** Local form state for a single race's participation */
export interface RaceParticipationRow {
	communityRaceId: number;
	raceDate: string;
	distance: number;
	isKilometers: boolean;
	hasVirtualOption: boolean;
	isPartOfChallenge: boolean;
	/** User toggles */
	isParticipating: boolean;
	isDls: boolean;
	isChallenge: boolean;
	isVirtual: boolean;
	isSpectator: boolean;
	notes: string;
}
