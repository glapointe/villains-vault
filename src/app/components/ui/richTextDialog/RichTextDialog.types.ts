
/**
 * Props for RichTextDialog component
 */
export interface RichTextDialogProps {
	/** Whether the dialog is visible */
	isOpen: boolean;
	/** Dialog title */
	title: string;
	/** Optional message/description */
	message?: string;
	/** Initial text value (HTML) */
	value: string;
	/** Callback when text is saved */
	onSave: (html: string) => void;
	/** Callback when dialog is cancelled */
	onCancel: () => void;
	/** Submit button text */
	submitText?: string;
	/** Cancel button text */
	cancelText?: string;
	/** Maximum character limit */
	maxLength?: number;
	/** Placeholder text */
	placeholder?: string;
}