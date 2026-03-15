/**
 * CommunityParticipantsPanel Types
 */

import type { CommunityEvent } from '../../../models';

/** Props for the CommunityParticipantsPanel */
export interface CommunityParticipantsPanelProps {
	/** Whether the panel is open */
	isOpen: boolean;
	/** The event to show participants for */
	event: CommunityEvent | null;
	/** Callback when the panel closes */
	onClose: () => void;
}
