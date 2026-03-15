/**
 * DlsDeclarationDialog Component
 *
 * Dialog for creating, editing, or withdrawing a DLS declaration.
 * Shows form fields: optional bib number, first-DLS checkbox,
 * going-for-kills checkbox, and a comments text area.
 *
 * When an existing declaration is provided, pre-fills values and
 * shows a withdraw button.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { Dialog, Checkbox, Button } from '../../ui';
import { styles, getThemedStyles } from './DlsDeclarationDialog.styles';
import type { DlsDeclarationDialogProps, DlsDeclarationFormData } from './DlsDeclarationDialog.types';
import { Ionicons } from '@expo/vector-icons';

/**
 * DlsDeclarationDialog — modal form for DLS declaration management
 */
export function DlsDeclarationDialog({
	isOpen,
	raceName,
	existingDeclaration,
	loading = false,
	onSubmit,
	onWithdraw,
	onClose,
}: DlsDeclarationDialogProps): React.ReactElement {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);

	const [bibText, setBibText] = useState('');
	const [isFirstDls, setIsFirstDls] = useState(false);
	const [isGoingForKills, setIsGoingForKills] = useState(false);
	const [comments, setComments] = useState('');

	const isEditing = !!existingDeclaration;

	// Reset form when dialog opens or declaration changes
	useEffect(() => {
		if (isOpen) {
			if (existingDeclaration) {
				setBibText(existingDeclaration.bibNumber != null ? String(existingDeclaration.bibNumber) : '');
				setIsFirstDls(existingDeclaration.isFirstDls);
				setIsGoingForKills(existingDeclaration.isGoingForKills);
				setComments(existingDeclaration.comments ?? '');
			} else {
				setBibText('');
				setIsFirstDls(false);
				setIsGoingForKills(false);
				setComments('');
			}
		}
	}, [isOpen, existingDeclaration]);

	const handleSubmit = useCallback(() => {
		const bibNumber = bibText.trim() ? parseInt(bibText.trim(), 10) : undefined;
		const data: DlsDeclarationFormData = {
			bibNumber: bibNumber && !isNaN(bibNumber) ? bibNumber : undefined,
			isFirstDls,
			isGoingForKills,
			comments: comments.trim() || undefined,
		};
		onSubmit(data);
	}, [bibText, isFirstDls, isGoingForKills, comments, onSubmit]);

	return (
		<Dialog
			isOpen={isOpen}
			title={isEditing ? `Edit Declaration — ${raceName}` : `Declare for ${raceName}`}
			submitText={isEditing ? 'Update' : 'Declare!'}
			cancelText="Cancel"
			onSubmit={handleSubmit}
			onCancel={onClose}
			submitDisabled={loading}
		>
			<View style={styles.form}>
				{/* Bib Number */}
				<View>
					<Text style={[styles.fieldLabel, themedStyles.fieldLabel]}>
						Bib Number (optional)
					</Text>
					<TextInput
						style={[styles.textInput, themedStyles.textInput]}
						value={bibText}
						onChangeText={setBibText}
						placeholder="e.g. 12345"
						placeholderTextColor={colors.textDisabled}
						keyboardType="number-pad"
						maxLength={6}
						editable={!loading}
					/>
				</View>

				{/* Checkboxes */}
				<View style={styles.checkboxGroup}>
					<Checkbox
						label="First DLS"
						description="This is my first Dead Last Start!"
						checked={isFirstDls}
						onToggle={setIsFirstDls}
						disabled={loading}
					/>
					<Checkbox
						label="Going for kills"
						description="I plan to pass as many runners as possible"
						checked={isGoingForKills}
						onToggle={setIsGoingForKills}
						disabled={loading}
					/>
				</View>

				{/* Comments */}
				<View>
					<Text style={[styles.fieldLabel, themedStyles.fieldLabel]}>
						Comments (optional)
					</Text>
					<TextInput
						style={[styles.commentsInput, themedStyles.commentsInput]}
						value={comments}
						onChangeText={setComments}
						placeholder="Share your DLS plans, costume, or goals..."
						placeholderTextColor={colors.textDisabled}
						multiline
						numberOfLines={3}
						maxLength={500}
						editable={!loading}
					/>
				</View>

				{/* Withdraw section — only when editing */}
				{isEditing && (
					<View style={[styles.withdrawContainer, themedStyles.withdrawContainer]}>
						<Text style={[styles.withdrawLabel, themedStyles.withdrawLabel]}>
							Changed your mind?
						</Text>
						<Button
							title="Withdraw Declaration"
							variant="ghost"
							onPress={onWithdraw}
							loading={loading}
							fullWidth
							icon={<Ionicons name="close-circle-outline" size={24} color={colors.error} />}
						/>
					</View>
				)}
			</View>
		</Dialog>
	);
}
