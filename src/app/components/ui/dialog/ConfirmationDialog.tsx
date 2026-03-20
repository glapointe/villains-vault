import { Dialog } from "./Dialog";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "theme";

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
 * Displays a modal dialog with title, optional message, custom content, and action buttons.
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
	const { width } = useWindowDimensions();
	const insets = useSafeAreaInsets();

	const modalMaxWidth = Math.min(width, 500) - insets.left - insets.right - (spacing.md * 2);

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
			maxWidth={modalMaxWidth}
        >
			{children}
        </Dialog>
    );
};