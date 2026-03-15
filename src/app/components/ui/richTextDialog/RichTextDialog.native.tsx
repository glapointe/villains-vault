/**
 * Rich Text Dialog Component (Native)
 * 
 * Dialog component for editing rich text content on native platforms.
 * Uses react-native-pell-rich-editor for WYSIWYG editing.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Text, View, ScrollView } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { useTheme } from '../../../contexts/ThemeContext';
import { Dialog } from '../dialog';
import { styles, getThemedStyles } from './RichTextDialog.native.styles';
import { getThemedColors } from '../../../theme';
import { RichTextDialogProps } from './RichTextDialog.types';

/**
 * Helper function to extract plain text length from HTML
 */
const getTextLength = (html: string): number => {
	return html.replace(/<[^>]*>/g, '').trim().length;
};

/**
 * Rich Text Dialog Component
 * 
 * Displays a dialog with a rich text editor for editing formatted content.
 * Shows character count and enforces maximum length.
 */
export const RichTextDialog: React.FC<RichTextDialogProps> = ({
	isOpen,
	title,
	message,
	value,
	onSave,
	onCancel,
	submitText = 'Save',
	cancelText = 'Cancel',
	maxLength = 500,
	placeholder = 'Enter text...',
}): React.ReactElement => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const editorRef = useRef<RichEditor>(null);
	const [html, setHtml] = useState<string>(value);

	// Reset editor when dialog opens/closes or value changes
	useEffect(() => {
		if (isOpen && editorRef.current) {
			editorRef.current.setContentHTML(value);
			setHtml(value);
		}
	}, [value, isOpen]);

	/**
	 * Handle text changes with length validation
	 */
	const handleChange = (content: string): void => {
		const textLength = getTextLength(content);
		if (textLength <= maxLength) {
			setHtml(content);
		}
	};

	/**
	 * Handle save button press
	 */
	const handleSave = (): void => {
		onSave(html);
	};

	const textColor = colors.textPrimary;

	return (
		<Dialog
			isOpen={isOpen}
			title={title}
			message={message}
			submitText={submitText}
			cancelText={cancelText}
			onSubmit={handleSave}
			onCancel={onCancel}
		>
			<ScrollView style={styles.editorContainer} keyboardShouldPersistTaps="handled">
				{/* Rich Text Toolbar */}
				<RichToolbar
					editor={editorRef}
					actions={[
						actions.setBold,
						actions.setItalic,
						actions.setUnderline,
						actions.insertBulletsList,
						actions.insertOrderedList,
					]}
					style={[styles.toolbar, themedStyles.toolbar]}
					iconTint={colors.textPrimary}
					selectedIconTint={colors.primary}
					disabledIconTint={colors.textSecondary}
				/>

				{/* Rich Text Editor */}
				<RichEditor
					ref={editorRef}
					initialContentHTML={value}
					onChange={handleChange}
					placeholder={placeholder}
					style={[styles.editor, themedStyles.editor]}
					editorStyle={{
						backgroundColor: colors.surface,
						color: textColor,
						placeholderColor: colors.textSecondary,
						contentCSSText: `
							body { 
								font-size: 14px; 
								color: ${textColor}; 
								padding: 8px;
								font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
							}
						`,
					}}
				/>

				{/* Character Count */}
				<View style={styles.footer}>
					<Text style={[styles.charCount, themedStyles.charCount]}>
						{getTextLength(html)} / {maxLength} characters
					</Text>
				</View>
			</ScrollView>
		</Dialog>
	);
};
