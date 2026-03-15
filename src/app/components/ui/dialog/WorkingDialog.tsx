/**
 * WorkingDialog Component
 * 
 * Displays a modal dialog with a loading spinner and message.
 * Used to indicate a background operation is in progress.
 */

import React from 'react';
import { View, Text, Modal, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { styles, getThemedStyles } from './Dialog.styles';

/**
 * Props for WorkingDialog component
 */
export interface WorkingDialogProps {
	/** Whether the dialog is visible */
	isOpen: boolean;
	/** Dialog title */
	title: string;
	/** Optional message/description */
	message?: string;
}

/**
 * Working Dialog Component
 * 
 * Displays a modal dialog with title, message, and a loading spinner.
 * Cannot be dismissed by the user - caller must close it programmatically.
 */
export const WorkingDialog: React.FC<WorkingDialogProps> = ({
	isOpen,
	title,
	message,
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
		>
			<View style={themedStyles.backdrop}>
				<View style={styles.centeredView}>
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

						{/* Loading Spinner */}
						<View style={{ paddingVertical: 24, alignItems: 'center' }}>
							<ActivityIndicator size="large" color={colors.primary} />
						</View>
					</View>
				</View>
			</View>
		</Modal>
	);
};
