/**
 * Rich Text Dialog Component - Web Implementation
 * 
 * Simple contenteditable HTML editor for web platform.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '../dialog';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { baseStyles, getThemedStyles } from './RichTextDialog.web.styles';
import { RichTextDialogProps } from './RichTextDialog.types';

/**
 * Get plain text length from HTML
 */
const getTextLength = (html: string): number => {
	const div = document.createElement('div');
	div.innerHTML = html;
	return div.textContent?.length || 0;
};

/**
 * Rich Text Dialog Component (Web)
 * 
 * Displays a dialog with a simple rich text editor using contenteditable.
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
	const [html, setHtml] = useState<string>(value);
	const editorRef = useRef<HTMLDivElement>(null);

	// Reset editor when dialog opens/closes or value changes
	useEffect(() => {
		if (isOpen && editorRef.current) {
			editorRef.current.innerHTML = value;
			setHtml(value);
		}
	}, [value, isOpen]);

	/**
	 * Handle text changes with length validation
	 */
	const handleInput = (e: React.FormEvent<HTMLDivElement>): void => {
		const content = (e.currentTarget as HTMLDivElement).innerHTML;
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

	/**
	 * Apply formatting
	 */
	const applyFormat = (command: string, value?: string): void => {
		document.execCommand(command, false, value);
		editorRef.current?.focus();
	};

	const textLength = getTextLength(html);

	return (
		<Dialog
			isOpen={isOpen}
			title={title}
			message={message}
			submitText={submitText}
			cancelText={cancelText}
			onSubmit={handleSave}
			onCancel={onCancel}
			submitDisabled={textLength > maxLength}
		>
			<div style={baseStyles.container}>
				{/* Formatting Toolbar */}
				<div
					style={{
						...baseStyles.toolbar,
						...themedStyles.toolbar,
					}}
				>
					<button
						onMouseDown={(e) => {
							e.preventDefault();
							applyFormat('bold');
						}}
						style={{
							...baseStyles.button,
							...baseStyles.buttonBold,
							...themedStyles.button,
						}}
					>
						B
					</button>
					<button
						onMouseDown={(e) => {
							e.preventDefault();
							applyFormat('italic');
						}}
						style={{
							...baseStyles.button,
							...baseStyles.buttonItalic,
							...themedStyles.button,
						}}
					>
						I
					</button>
					<button
						onMouseDown={(e) => {
							e.preventDefault();
							applyFormat('underline');
						}}
						style={{
							...baseStyles.button,
							...baseStyles.buttonUnderline,
							...themedStyles.button,
						}}
					>
						U
					</button>
					<button
						onMouseDown={(e) => {
							e.preventDefault();
							applyFormat('insertUnorderedList');
						}}
						style={{
							...baseStyles.button,
							...themedStyles.button,
						}}
					>
						• List
					</button>
					<button
						onMouseDown={(e) => {
							e.preventDefault();
							applyFormat('insertOrderedList');
						}}
						style={{
							...baseStyles.button,
							...themedStyles.button,
						}}
					>
						1. List
					</button>
					<button
						onMouseDown={(e) => {
							e.preventDefault();
							applyFormat('removeFormat');
						}}
						style={{
							...baseStyles.button,
							...themedStyles.button,
						}}
					>
						Clear
					</button>
				</div>

				{/* Editor */}
				<div
					ref={editorRef}
					contentEditable
					suppressContentEditableWarning
					onInput={handleInput}
					onBlur={(e) => setHtml((e.currentTarget as HTMLDivElement).innerHTML)}
					style={{
						...baseStyles.editor,
						...themedStyles.editor,
					}}
				/>

				{/* Character Count */}
				<div style={baseStyles.charCountContainer}>
					<span style={{ ...baseStyles.charCount, ...themedStyles.charCount }}>
						{textLength} / {maxLength} characters
					</span>
				</div>
			</div>
		</Dialog>
	);
};
