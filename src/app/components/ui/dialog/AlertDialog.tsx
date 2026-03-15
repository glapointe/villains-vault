import { Dialog } from "./Dialog";

/**
 * Props for AlertDialog component
 */
export interface AlertDialogProps {
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
	/** Callback when submit button is pressed */
	onSubmit?: () => void;
}

/**
 * Alert Dialog Component
 *
 * Displays a modal dialog with title, optional message, custom content, and a single action button.
 */
export const AlertDialog: React.FC<AlertDialogProps> = ({
    isOpen,
    title,
    message,
    children,
    submitText = 'OK',
    onSubmit,
}): React.ReactElement | null => {
    return (
        <Dialog
            isOpen={isOpen}
            title={title}
            message={message}
            onSubmit={onSubmit}
            onCancel={() => {}}
            hideCancelButton={true}
            submitText={submitText}
        >
            {children}
        </Dialog>
    );
};