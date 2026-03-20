/**
 * WorkingDialog Component
 * 
 * Displays a modal dialog with a loading spinner and message.
 * Used to indicate a background operation is in progress.
 */

import React from 'react';
import { View, Text, Modal, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors, spacing } from '../../../theme';
import { styles, getThemedStyles } from './Dialog.styles';
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
	const { width } = useWindowDimensions();
	const insets = useSafeAreaInsets();

	const modalMaxWidth = Math.min(width, 500) - insets.left - insets.right - (spacing.md * 2);

	if (!isOpen) return null;

	return (
		<Modal
			visible={isOpen}
			transparent
			animationType="fade"
		>
			<View style={themedStyles.backdrop}>
				<View style={styles.centeredView}>
					<View style={[styles.modalView, themedStyles.modalView, { maxWidth: modalMaxWidth } ]}>
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
