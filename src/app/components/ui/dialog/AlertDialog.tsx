import { Dialog } from "./Dialog";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "theme";

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
	const { width } = useWindowDimensions();
	const insets = useSafeAreaInsets();

	const modalMaxWidth = Math.min(width, 500) - insets.left - insets.right - (spacing.md * 2);
	
	return (
        <Dialog
            isOpen={isOpen}
            title={title}
            message={message}
            onSubmit={onSubmit}
            onCancel={() => {}}
            hideCancelButton={true}
            submitText={submitText}
			maxWidth={modalMaxWidth}
        >
            {children}
        </Dialog>
    );
};