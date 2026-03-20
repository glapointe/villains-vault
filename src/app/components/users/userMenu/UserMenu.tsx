/**
 * UserMenu Component
 *
 * Avatar button (or Sign In) + portalled dropdown menu with Manage Account
 * and Sign Out. Also owns the EditUserPanel slide-in panel.
 * Self-contained: manages all user-menu state internally.
 */

import React, { lazy, useState, useRef, Suspense } from 'react';
import { View, Text, Image, Platform, StyleSheet, useWindowDimensions, Modal } from 'react-native';
import { Pressable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../hooks';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, setAuthToken } from '../../../services/api';
import type { UserProfile } from '../../../models';
import type { EditUserPanelProps } from '../editUserPanel/EditUserPanel';
import { styles, getThemedStyles } from './UserMenu.styles';

const EditUserPanel = lazy(() => import('../editUserPanel/EditUserPanel')) as unknown as React.FC<EditUserPanelProps>;

export interface UserMenuProps {
	/** Whether the header is currently in mobile layout */
	isMobile: boolean;
	/** Ref to the outer header View — used to measure the header bottom for mobile dropdown positioning */
	headerRef: React.RefObject<View | null>;
	/** Optional callback when menu is opened so that the main menu can be closed. */
	onOpenMenu?: () => void;
}

/**
 * User avatar button + dropdown menu + EditUserPanel.
 *
 * Place this inside the desktop nav row (isMobile=false) and inside the
 * mobile actions row (isMobile=true). The dropdown is portalled to
 * document.body on web so it escapes any CSS stacking context.
 */
export function UserMenu({ isMobile, headerRef, onOpenMenu }: UserMenuProps) {
	const { isAuthenticated, isAdmin, user, logout, accessToken, refreshUser } = useAuth();
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const router = useRouter();
	const insets = useSafeAreaInsets();

	const [userMenuOpen, setUserMenuOpen] = useState(false);
	const [hoveredItem, setHoveredItem] = useState<string | null>(null);
	const [profilePanelOpen, setProfilePanelOpen] = useState(false);
	const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
	const [dropdownPos, setDropdownPos] = useState({ top: 68, right: 16 });
	const avatarRef = useRef<View>(null);

	const handleSignIn = () => {
		router.push('/(auth)/login');
	};

	const handleSignOut = async () => {
		await logout();
		setUserMenuOpen(false);
	};

	const handleOpenManageAccount = async () => {
		setUserMenuOpen(false);
		try {
			if (accessToken) setAuthToken(accessToken);
			const profile = await api.users.getCurrentUser();
			setCurrentUserProfile(profile);
		} catch {
			if (user) {
				setCurrentUserProfile({
					id: 0,
					email: user.email ?? '',
					displayName: user.name,
					isAdmin: user.isAdmin ?? false,
					createdAt: new Date().toISOString(),
				});
			}
		}
		setProfilePanelOpen(true);
	};

	const handleAccountDeleted = async () => {
		await logout();
		router.push('/(tabs)');
	};
	
	const handleNavigate = (path: string) => {
		setUserMenuOpen(false);
		router.push(path as any);
	};

	const openUserMenu = () => {
		if (!userMenuOpen && onOpenMenu) {
			onOpenMenu();
		}
		if (Platform.OS === 'web') {
			const avatarEl = avatarRef.current as any;
			const headerEl = headerRef.current as any;
			if (avatarEl?.getBoundingClientRect) {
				const avatarRect = avatarEl.getBoundingClientRect();
				if (isMobile) {
					setDropdownPos({ top: avatarRect.bottom + 8, right: 0 });
				} else {
					setDropdownPos({
						top: avatarRect.bottom + 8,
						right: window.innerWidth - avatarRect.right,
					});
				}
			}
		}
		setHoveredItem(null);
		setUserMenuOpen(prev => !prev);
	};

	// ── Avatar / Sign-In trigger ───────────────────────────────────────────────

	const trigger = isAuthenticated ? (
		<View style={styles.userMenuContainer}>
			<Pressable
				ref={avatarRef as any}
				onPress={openUserMenu}
				style={[styles.avatarButton, themedStyles.avatarButton]}
			>
				{user?.picture ? (
					<Image source={{ uri: user.picture }} style={styles.avatarImage} />
				) : user ? (
					<Text style={[styles.avatarInitial, themedStyles.avatarInitial]}>
						{(user.name ?? user.email ?? '')[0]?.toUpperCase() ?? ''}
					</Text>
				) : (
					<Ionicons name="person" size={20} color={colors.textInverse} />
				)}
			</Pressable>
		</View>
	) : (
		<Pressable onPress={handleSignIn} style={[styles.signInButton, themedStyles.signInButton]}>
			<Text style={[styles.signInText, themedStyles.signInText]}>Sign In</Text>
		</Pressable>
	);

	// ── Shared user identity header (avatar + name + email) ───────────────────

	const renderUserHeader = (mobileStyle: boolean) => (
		<View style={[styles.dropdownUserHeader, themedStyles.dropdownUserHeader, mobileStyle && themedStyles.dropdownUserHeaderMobile]}>
			<View style={[styles.dropdownUserAvatar, themedStyles.dropdownUserAvatar]}>
				{user?.picture ? (
					<Image source={{ uri: user.picture }} style={styles.dropdownUserAvatarImage} />
				) : user ? (
					<Text style={[styles.dropdownUserAvatarInitial, themedStyles.dropdownUserAvatarInitial]}>
						{(user.name ?? user.email ?? '')[0]?.toUpperCase() ?? ''}
					</Text>
				) : (
					<Ionicons name="person" size={24} color={colors.textInverse} />
				)}
			</View>
			<View style={{ flex: 1 }}>
				{user?.name && (
					<Text style={[styles.dropdownUserName, themedStyles.dropdownUserName]} numberOfLines={1}>
						{user.name}
					</Text>
				)}
				<Text style={[styles.dropdownUserEmail, themedStyles.dropdownUserEmail]} numberOfLines={1}>
					{user?.email}
				</Text>
			</View>
		</View>
	);

	// ── Dropdown ──────────────────────────────────────────────────────────────

	const renderDropdown = () => {
		if (!userMenuOpen || !isAuthenticated) return null;

		const hoverProps = (key: string) =>
			Platform.OS === 'web' && !isMobile
				? { onMouseEnter: () => setHoveredItem(key), onMouseLeave: () => setHoveredItem(null) } as any
				: {};

		const nativePos = isMobile
			? { top: 68 + insets.top, right: 0 as any }
			: { top: 68 + insets.top };
		const webPos = isMobile
			? { position: 'fixed' as any, top: dropdownPos.top, right: 0 }
			: { position: 'fixed' as any, top: dropdownPos.top, right: dropdownPos.right };
		const posStyle = Platform.OS === 'web' ? webPos : nativePos;

		const backdrop = (
			<Pressable
				style={[
					styles.dropdownBackdrop,
					Platform.OS === 'web' ? { position: 'fixed' as any, zIndex: 9998 } : undefined,
				]}
				onPress={() => setUserMenuOpen(false)}
			/>
		);

		const dropdown = isMobile ? (
			<View style={[styles.userDropdownMobile, themedStyles.userDropdownMobile, posStyle]}>
				{renderUserHeader(true)}

				{isAdmin && (
					<Pressable style={styles.mobileMenuItem} onPress={() => handleNavigate('/(tabs)/admin')}>
						<Text style={[styles.mobileMenuText, themedStyles.mobileMenuText]}>Admin</Text>
					</Pressable>
				)}				
				<Pressable
					style={StyleSheet.flatten([styles.mobileMenuItem, themedStyles.mobileMenuItem])}
					onPress={handleOpenManageAccount}
				>
					<Text style={[styles.mobileMenuText, themedStyles.mobileMenuText]}>Manage Account</Text>
				</Pressable>
				<Pressable
					style={StyleSheet.flatten([styles.mobileMenuItem, themedStyles.mobileMenuItem])}
					onPress={handleSignOut}
				>
					<Text style={[styles.mobileMenuText, themedStyles.mobileMenuText]}>Sign Out</Text>
				</Pressable>
			</View>
		) : (
			<View style={[styles.userDropdown, themedStyles.userDropdown, posStyle]}>
				{renderUserHeader(false)}
				
				{isAdmin && (
					<Pressable 
						style={[styles.userDropdownItem, themedStyles.userDropdownItem, hoveredItem === 'admin' && themedStyles.userDropdownItemHovered]} 
						onPress={() => handleNavigate('/(tabs)/admin')}						
						{...hoverProps('admin')}
					>
						<Ionicons name="shield-checkmark-outline" size={16} color={colors.textPrimary} style={styles.dropdownItemIcon} />
						<Text style={[styles.userDropdownItemText, themedStyles.userDropdownItemText]}>Admin</Text>
					</Pressable>
				)}	
				<Pressable
					style={[styles.userDropdownItem, themedStyles.userDropdownItem, hoveredItem === 'account' && themedStyles.userDropdownItemHovered]}
					onPress={handleOpenManageAccount}
					{...hoverProps('account')}
				>
					<Ionicons name="person-outline" size={16} color={colors.textPrimary} style={styles.dropdownItemIcon} />
					<Text style={[styles.userDropdownItemText, themedStyles.userDropdownItemText]}>Manage Account</Text>
				</Pressable>
				<Pressable
					style={[styles.userDropdownItem, themedStyles.userDropdownItem, hoveredItem === 'signout' && themedStyles.userDropdownItemHovered]}
					onPress={handleSignOut}
					{...hoverProps('signout')}
				>
					<Ionicons name="log-out-outline" size={16} color={colors.textPrimary} style={styles.dropdownItemIcon} />
					<Text style={[styles.userDropdownItemText, themedStyles.userDropdownItemText]}>Sign Out</Text>
				</Pressable>
			</View>
		);

		if (Platform.OS === 'web' && typeof document !== 'undefined') {
			const ReactDOM = require('react-dom');
			return (
				<>
					{ReactDOM.createPortal(backdrop, document.body)}
					{ReactDOM.createPortal(dropdown, document.body)}
				</>
			);
		}
		// Native mobile: use a Modal to render at window root level,
		// escaping the parent mobileActions flex-row which clips overflow.
		// GestureHandlerRootView is required because Modal severs the RNGH root context.
		if (isMobile) {
			return (
				<Modal
					transparent
					visible={true}
					onRequestClose={() => setUserMenuOpen(false)}
					animationType="none"
					statusBarTranslucent
				>
					<GestureHandlerRootView>
						{backdrop}
						{dropdown}
					</GestureHandlerRootView>
				</Modal>
			);
		}
		return <>{backdrop}{dropdown}</>;
	};

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<>
			{trigger}
			{renderDropdown()}
			{isAuthenticated && accessToken && (
				<Suspense fallback={null}>
					<EditUserPanel
						isOpen={profilePanelOpen}
						onClose={() => setProfilePanelOpen(false)}
						accessToken={accessToken}
						user={currentUserProfile}
						mode="self"
						onSaved={(updated: UserProfile) => {
						setCurrentUserProfile(updated);
						refreshUser?.();
					}}
						onAccountDeleted={handleAccountDeleted}
					/>
				</Suspense>
			)}
		</>
	);
}
