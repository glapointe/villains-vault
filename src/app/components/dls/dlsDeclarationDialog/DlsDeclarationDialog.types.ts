/**
 * DlsDeclarationDialog Types
 *
 * Prop types for the DLS declaration dialog used when
 * self-declaring, editing, or withdrawing a DLS declaration.
 */

import type { DlsDeclaration } from '../../../models';

export interface DlsDeclarationDialogProps {
	/** Whether the dialog is visible */
	isOpen: boolean;
	/** The name of the race being declared for */
	raceName: string;
	/** Existing declaration (null for new) */
	existingDeclaration: DlsDeclaration | null;
	/** Whether an action is in progress */
	loading?: boolean;
	/** Called when the user submits a new or updated declaration */
	onSubmit: (data: DlsDeclarationFormData) => void;
	/** Called when the user withdraws their declaration */
	onWithdraw: () => void;
	/** Called when the dialog is dismissed */
	onClose: () => void;
}

export interface DlsDeclarationFormData {
	bibNumber?: number;
	isFirstDls: boolean;
	isGoingForKills: boolean;
	comments?: string;
}
