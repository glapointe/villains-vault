import { Dialog } from "./Dialog";

/**
 * Props for ConfirmationDialog component
 */
export interface ConfirmationDialogProps {
	/** Whether the dialog is visible */
	isOpen: boolean;
	/** Dialog title */
	title: string;
	/** Optional message/description */
	message?: string;
	/** Custom content to render in the dialog body */
	children?: React.ReactNode;
	/** Submit button text */
	submitText?: string;
	/** Cancel button text */
	cancelText?: string;
	/** Callback when submit button is pressed */
	onSubmit?: () => void;
	/** Callback when cancel button is pressed or backdrop is tapped */
	onCancel: () => void;
}

/**
 * Confirmation Dialog Component
 *
 * Displays a modal dialog with title, optional message, custom content, and a single action button.
 */
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    isOpen,
    title,
    message,
    children,
    submitText = 'OK',
    cancelText = 'Cancel',
    onSubmit,
    onCancel,
}): React.ReactElement | null => {
    return (
        <Dialog
            isOpen={isOpen}
            title={title}
            message={message}
            onSubmit={onSubmit}
            onCancel={onCancel}
            hideCancelButton={false}
            cancelText={cancelText}
            submitText={submitText}
        >
            {children}
        </Dialog>
    );
};