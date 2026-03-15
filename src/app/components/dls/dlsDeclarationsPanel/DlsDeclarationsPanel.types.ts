import type { DlsRace } from '../../../models';

/**
 * Props for DlsDeclarationsPanel
 */
export interface DlsDeclarationsPanelProps {
	/** Whether the panel is open */
	isOpen: boolean;
	/** The DLS race to show declarations for */
	race: DlsRace | null;
	/** Callback when the panel is closed */
	onClose: () => void;
}
