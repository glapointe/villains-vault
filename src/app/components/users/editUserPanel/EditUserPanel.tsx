/**
 * EditUserPanel Component
 * 
 * Generic user editing panel that works in two modes:
 * - Admin mode: Edit any user's name, email, and admin status
 * - Self mode: Edit own name and email only (no admin toggle, uses /me endpoint)
 * 
 * When editing the current user as admin, the admin toggle is disabled
 * to prevent the user from revoking their own admin access.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { Panel, Button, MessageBox, Checkbox } from '../../ui';
import { useDialog } from '../../../contexts/DialogContext';
import { api, setAuthToken } from '../../../services/api';
import type { UserProfile, NotificationPreference } from '../../../models';
import { styles, getThemedStyles } from './EditUserPanel.styles';

/**
 * Mode of the edit user panel
 * - 'admin': Admin editing another user (or self with restricted admin toggle)
 * - 'self': User editing their own profile (no admin toggle, uses /me endpoint)
 */
export type EditUserMode = 'admin' | 'self';

export interface EditUserPanelProps {
	/** Whether the panel is visible */
	isOpen: boolean;
	/** Callback when panel is closed */
	onClose: () => void;
	/** Access token for API requests */
	accessToken: string;
	/** The user being edited */
	user: UserProfile | null;
	/** The current logged-in user's ID (to detect self-editing in admin mode) */
	currentUserId?: number;
	/** Mode: 'admin' for admin editing, 'self' for self-editing */
	mode: EditUserMode;
	/** Callback after successful save */
	onSaved?: (updatedUser: UserProfile) => void;
	/** Callback after own account has been deleted (self mode only) */
	onAccountDeleted?: () => void;
}

/**
 * EditUserPanel Component
 * Slide-in panel for editing user details
 */
export const EditUserPanel: React.FC<EditUserPanelProps> = ({
	isOpen,
	onClose,
	accessToken,
	user,
	currentUserId,
	mode,
	onSaved,
	onAccountDeleted,
}): React.ReactElement => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const { showConfirm } = useDialog();

	// Notification preferences — local state, loaded when panel opens, saved via Save button
	const showNotifications = mode === 'self' && Platform.OS !== 'web';
	const [pendingNotifPrefs, setPendingNotifPrefs] = useState<NotificationPreference | null>(null);
	const [savedNotifPrefs, setSavedNotifPrefs] = useState<NotificationPreference | null>(null);
	const [notifLoading, setNotifLoading] = useState<boolean>(false);
	const [notifError, setNotifError] = useState<string | null>(null);

	const [email, setEmail] = useState<string>('');
	const [displayName, setDisplayName] = useState<string>('');
	const [isAdmin, setIsAdmin] = useState<boolean>(false);
	const [saving, setSaving] = useState<boolean>(false);
	const [deleting, setDeleting] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

	// Whether this is the admin editing themselves (admin toggle should be disabled)
	const isEditingSelf = mode === 'admin' && user?.id === currentUserId;

	// Whether to show the admin toggle at all
	const showAdminToggle = mode === 'admin';

	// Load notification preferences when the panel opens (native + self mode only)
	useEffect(() => {
		if (!isOpen || !showNotifications) return;
		let cancelled = false;
		setNotifLoading(true);
		setNotifError(null);
		api.notifications.getPreferences()
			.then((prefs) => {
				if (cancelled) return;
				setSavedNotifPrefs(prefs);
				setPendingNotifPrefs(prefs);
			})
			.catch(() => {
				if (!cancelled) setNotifError('Failed to load notification preferences');
			})
			.finally(() => {
				if (!cancelled) setNotifLoading(false);
			});
		return () => { cancelled = true; };
	}, [isOpen, showNotifications]);

	// Reset form when user changes
	useEffect(() => {
		if (user) {
			setEmail(user.email);
			setDisplayName(user.displayName ?? '');
			setIsAdmin(user.isAdmin);
			setError(null);
		}
	}, [user]);

	// Clear success banner + notification state whenever the panel is closed
	useEffect(() => {
		if (!isOpen) {
			setSavedSuccess(false);
			setPendingNotifPrefs(null);
			setSavedNotifPrefs(null);
			setNotifError(null);
		}
	}, [isOpen]);

	const hasNotifChanges = showNotifications &&
		savedNotifPrefs !== null &&
		pendingNotifPrefs !== null && (
			pendingNotifPrefs.raceResults !== savedNotifPrefs.raceResults ||
			pendingNotifPrefs.dlsDeclarations !== savedNotifPrefs.dlsDeclarations ||
			pendingNotifPrefs.communityEvents !== savedNotifPrefs.communityEvents
		);

	const hasChanges = user && (
		(mode === 'admin' && email !== user.email) ||
		displayName !== (user.displayName ?? '') ||
		(showAdminToggle && !isEditingSelf && isAdmin !== user.isAdmin) ||
		hasNotifChanges
	);

	/** Handle save */
	const handleSave = async (): Promise<void> => {
		if (!user) return;

		try {
			setSaving(true);
			setError(null);
			setAuthToken(accessToken);

			let updatedUser: UserProfile;

			if (mode === 'self') {
				// Self-editing: update profile and notification prefs if changed
				const profilePromise = api.users.updateOwnProfile({
					displayName: displayName !== (user.displayName ?? '') ? displayName : undefined,
				});
				const notifPromise = (showNotifications && pendingNotifPrefs && hasNotifChanges)
					? api.notifications.updatePreferences(pendingNotifPrefs)
					: Promise.resolve(null);
				const [profileResult, notifResult] = await Promise.all([profilePromise, notifPromise]);
				updatedUser = profileResult;
				if (notifResult) {
					setSavedNotifPrefs(notifResult);
					setPendingNotifPrefs(notifResult);
				}
			} else {
				// Admin editing: use admin endpoint
				updatedUser = await api.users.updateUser(user.id, {
					email: email !== user.email ? email : undefined,
					displayName: displayName !== (user.displayName ?? '') ? displayName : undefined,
					isAdmin: !isEditingSelf && isAdmin !== user.isAdmin ? isAdmin : undefined,
				});
			}

			onSaved?.(updatedUser);
			setSavedSuccess(true);
		} catch (err) {
			console.error('Failed to update user:', err);
			setError('Failed to save changes. Please try again.');
		} finally {
			setSaving(false);
		}
	};

	/** Handle account deletion (self mode only) */
	const handleDeleteAccount = async (): Promise<void> => {
		const confirmed = await showConfirm({
			title: 'Delete Account',
			message: 'Are you sure you want to permanently delete your account? This action cannot be undone and will remove all data associated with your account.',
			submitText: 'Delete My Account',
			cancelText: 'Keep Account',
		});
		if (!confirmed) return;

		try {
			setDeleting(true);
			setError(null);
			setAuthToken(accessToken);
			await api.users.deleteOwnAccount();
			onClose();
			onAccountDeleted?.();
		} catch (err) {
			console.error('Failed to delete account:', err);
			setError('Failed to delete account. Please try again.');
		} finally {
			setDeleting(false);
		}
	};

	const headerTitle = mode === 'self' ? 'Edit Profile' : `Edit User`;

	return (
		<Panel
			isOpen={isOpen}
			onClose={onClose}
			headerTitle={headerTitle}
			showCloseButton
			width="large"
			footer={
				<View style={styles.footerButtons}>
					<Button
						title={savedSuccess ? 'Close' : 'Cancel'}
						variant="ghost"
						onPress={onClose}
						disabled={saving}
					/>
					<Button
						title={saving ? 'Saving...' : 'Save'}
						variant="primary"
						onPress={handleSave}
						disabled={saving || !hasChanges}
						loading={saving}
					/>
				</View>
			}
		>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<Text style={[styles.description, themedStyles.description]}>
					{mode === 'self'
						? 'Update your profile information.'
						: `Editing user ${user?.email ?? ''}. Changes take effect immediately.`}
				</Text>

				{Boolean(error) && (
					<MessageBox
						type="error"
						message={error as string}
						showIcon
						dismissible
						onDismiss={() => setError(null)}
					/>
				)}

				{savedSuccess && !error && (
					<MessageBox
						type="success"
						title="Changes saved"
						message="Your profile has been updated successfully."
						showIcon
						dismissible
						onDismiss={() => setSavedSuccess(false)}
					/>
				)}

				{/* Email field */}
				<View style={styles.fieldGroup}>
					<Text style={[styles.label, themedStyles.label]}>Email</Text>
					{mode === 'self' ? (
						<>
							<Text style={[styles.readOnlyField, themedStyles.readOnlyField]}>{email}</Text>
							<Text style={[styles.disabledNote, themedStyles.disabledNote]}>
								Email can only be changed by an administrator.
							</Text>
						</>
					) : (
						<TextInput
							style={[styles.input, themedStyles.input]}
							value={email}
							onChangeText={(text) => { setEmail(text); setSavedSuccess(false); }}
							placeholder="Email address"
							placeholderTextColor={colors.textTertiary}
							keyboardType="email-address"
							autoCapitalize="none"
							editable={!saving}
						/>
					)}
				</View>

				{/* Display Name field */}
				<View style={styles.fieldGroup}>
					<Text style={[styles.label, themedStyles.label]}>Display Name</Text>
					<TextInput
						style={[styles.input, themedStyles.input]}
						value={displayName}
						onChangeText={(text) => { setDisplayName(text); setSavedSuccess(false); }}
						placeholder="Display name"
						placeholderTextColor={colors.textTertiary}
						editable={!saving}
					/>
				</View>

				{/* User ID (read-only) */}
				{mode === 'admin' && Boolean(user) && (
					<View style={styles.fieldGroup}>
						<Text style={[styles.label, themedStyles.label]}>User ID</Text>
						<Text style={[styles.readOnlyField, themedStyles.readOnlyField]}>{(user as UserProfile).id}</Text>
					</View>
				)}

				{/* Created At (read-only) */}
				{Boolean(user) && (
					<View style={styles.fieldGroup}>
						<Text style={[styles.label, themedStyles.label]}>Created</Text>
						<Text style={[styles.readOnlyField, themedStyles.readOnlyField]}>
							{new Date((user as UserProfile).createdAt).toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric',
								year: 'numeric',
								hour: 'numeric',
								minute: '2-digit',
							})}
						</Text>
					</View>
				)}

				{/* Admin toggle - only in admin mode */}
				{showAdminToggle && (
					<View style={styles.checkboxContainer}>
						<Checkbox
							label="Administrator"
							description="Grant administrative privileges to this user"
							checked={isAdmin}
							onToggle={(v) => { setIsAdmin(v); setSavedSuccess(false); }}
							disabled={isEditingSelf || saving}
						/>
						{isEditingSelf && (
							<Text style={[styles.disabledNote, themedStyles.disabledNote]}>
								You cannot change your own admin status
							</Text>
						)}
					</View>
				)}

				{/* Push Notification Preferences - self mode, native only */}
				{showNotifications && (
					<View style={styles.fieldGroup}>
						<Text style={[styles.sectionHeader, themedStyles.label]}>Push Notifications</Text>
						<Text style={[styles.description, themedStyles.description]}>
							Choose which notifications you'd like to receive on this device.
						</Text>
						{notifLoading ? (
							<ActivityIndicator size="small" color={colors.primary} />
					) : notifError && !pendingNotifPrefs ? (
						<MessageBox type="error" message={notifError} showIcon />
					) : pendingNotifPrefs ? (
							<View style={styles.checkboxGroup}>
								<Checkbox
									label="Race Results"
									description="New race results have been scraped and are available"
									checked={pendingNotifPrefs.raceResults}
									onToggle={(v) => { setPendingNotifPrefs(p => p ? { ...p, raceResults: v } : p); setSavedSuccess(false); }}
								/>
								<Checkbox
									label="DLS Declarations"
									description="A new DLS declaration event has been added"
									checked={pendingNotifPrefs.dlsDeclarations}
									onToggle={(v) => { setPendingNotifPrefs(p => p ? { ...p, dlsDeclarations: v } : p); setSavedSuccess(false); }}
								/>
								<Checkbox
									label="Community Events"
									description="A new community event has been created"
									checked={pendingNotifPrefs.communityEvents}
									onToggle={(v) => { setPendingNotifPrefs(p => p ? { ...p, communityEvents: v } : p); setSavedSuccess(false); }}
								/>
							</View>
						) : null}
					</View>
				)}

				{/* Danger Zone - self mode only */}
				{mode === 'self' && !user?.isAdmin && (
					<MessageBox
						type="error"
						title="Danger Zone"
						message="Permanently delete your account and all associated data. This action cannot be undone."
					>
						<Button
							title={deleting ? 'Deleting...' : 'Delete My Account'}
							variant="danger"
							onPress={handleDeleteAccount}
							disabled={saving || deleting}
							loading={deleting}
						/>
					</MessageBox>
				)}
			</ScrollView>
		</Panel>
	);
};

export default EditUserPanel;
