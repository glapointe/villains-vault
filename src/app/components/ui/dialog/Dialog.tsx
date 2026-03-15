/**
 * Generic Dialog Component
 * 
 * Reusable modal dialog with configurable title, message, buttons, and custom content.
 */

import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { Button } from '../button';
import { styles, getThemedStyles } from './Dialog.styles';

/**
 * Props for Dialog component
 */
export interface DialogProps {
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
	/** Whether to disable the submit button */
	submitDisabled?: boolean;
    /** Whether to hide the cancel button */
    hideCancelButton?: boolean;
}

/**
 * Generic Dialog Component
 * 
 * Displays a modal dialog with title, optional message, custom content, and action buttons.
 */
export const Dialog: React.FC<DialogProps> = ({
	isOpen,
	title,
	message,
	children,
	submitText = 'Submit',
	cancelText = 'Cancel',
	onSubmit,
	onCancel,
	submitDisabled = false,
    hideCancelButton = false,
}): React.ReactElement | null => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);

	if (!isOpen) return null;

	return (
		<Modal
			visible={isOpen}
			transparent
			animationType="fade"
			onRequestClose={onCancel}
		>
			<TouchableOpacity
				style={themedStyles.backdrop}
				activeOpacity={1}
				onPress={onCancel}
			>
				<View style={styles.centeredView}>
					<TouchableOpacity
						activeOpacity={1}
						onPress={(e) => e.stopPropagation()}
					>
						<View style={[styles.modalView, themedStyles.modalView]}>
							{/* Header */}
							<Text style={[styles.title, themedStyles.title]}>
								{title}
							</Text>

							{/* Optional Message */}
							{Boolean(message) && (
								<Text style={[styles.message, themedStyles.message]}>
									{message}
								</Text>
							)}

							{/* Custom Content */}
							{children}

							{/* Action Buttons */}
							<View style={styles.actions}>
								{!hideCancelButton && (
									<Button
										title={cancelText}
										variant="secondary"
										onPress={onCancel}
										style={styles.actionButton}
									/>
								)}
								{Boolean(onSubmit) && (
									<Button
										title={submitText}
										variant="primary"
										onPress={onSubmit}
										disabled={submitDisabled}
										style={styles.actionButton}
									/>
								)}
							</View>
						</View>
					</TouchableOpacity>
				</View>
			</TouchableOpacity>
		</Modal>
	);
};
