/**
 * HeaderMenu Component
 *
 * Renders navigation links for desktop (inline in the nav row) and the
 * expandable mobile menu dropdown (rendered at header root level by AppHeader).
 *
 * Desktop usage (inside desktopNav):
 *   <HeaderMenu isMobile={false} />
 *
 * Mobile usage (after the container row, at header root level):
 *   <HeaderMenu isMobile={true} menuOpen={menuOpen} onClose={() => setMenuOpen(false)} />
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Modal } from 'react-native';
import { Pressable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth, useChatEnabled } from '../../../hooks';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { useRouter } from 'expo-router';
import { styles, getThemedStyles } from './HeaderMenu.styles';
import { getDisabledCommunityEvents } from 'utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface HeaderMenuProps {
	/** Whether the header is currently in mobile layout */
	isMobile: boolean;
	/** (Mobile only) Whether the menu is open */
	menuOpen?: boolean;
	/** Ref to the outer header View — used to measure the header bottom for mobile dropdown positioning */
	headerRef: React.RefObject<View | null>;
	/** (Mobile only) Callback to close the menu */
	onClose?: () => void;
}

/**
 * Navigation links + mobile hamburger menu dropdown.
 *
 * On desktop this renders the nav links inline; on mobile it renders the
 * full-width dropdown whose visibility is controlled by the parent (AppHeader).
 */
export function HeaderMenu({ isMobile, menuOpen = false, onClose, headerRef }: HeaderMenuProps) {
	const { isAuthenticated, isAdmin } = useAuth();
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const router = useRouter();
	const { enabled: chatEnabled } = useChatEnabled();
	const insets = useSafeAreaInsets();
	const [dropdownPos, setDropdownPos] = useState({ top: 68, right: 16 });

	useEffect(() => {
		if (Platform.OS === 'web' && isMobile && menuOpen) {
			const headerEl = headerRef.current as any;
			if (headerEl?.getBoundingClientRect) {
				const rect = headerEl.getBoundingClientRect();
				setDropdownPos({ top: rect.bottom + insets.top, right: window.innerWidth - rect.right - insets.right });
			}
		}
	}, [menuOpen, isMobile]);
	const handleNavigate = (path: string) => {
		if (onClose) onClose();
		router.push(path as any);
	};
	const disabledCommunityEvents = getDisabledCommunityEvents();

	// ── Desktop: inline nav links ─────────────────────────────────────────────
	if (!isMobile) {
		return (
			<>
				<Pressable style={styles.navLink} onPress={() => handleNavigate('/(tabs)')}>
					<Text style={[styles.navText, themedStyles.navText]}>Home</Text>
				</Pressable>
				{!disabledCommunityEvents && (
					<Pressable style={styles.navLink} onPress={() => handleNavigate('/(tabs)/community')}>
						<Text style={[styles.navText, themedStyles.navText]}>Community Events</Text>
					</Pressable>
				)}
				{isAuthenticated && (
					<Pressable style={styles.navLink} onPress={() => handleNavigate('/(tabs)/dashboard')}>
						<Text style={[styles.navText, themedStyles.navText]}>My Dashboard</Text>
					</Pressable>
				)}
				{chatEnabled && (
					<Pressable style={styles.navLink} onPress={() => handleNavigate('/(tabs)/chat')}>
						<Text style={[styles.navText, themedStyles.navText]}>Chat</Text>
					</Pressable>
				)}
			</>
		);
	}

	// ── Mobile: full-width dropdown ───────────────────────────────────────────
	if (!menuOpen) return null;
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
			onPress={() => onClose && onClose()}
		/>
	);

	const dropdown = (
		<View style={[styles.mobileMenu, themedStyles.mobileMenu, posStyle]}>
			<Pressable
				style={StyleSheet.flatten([styles.mobileMenuItem, themedStyles.mobileMenuItem])}
				onPress={() => handleNavigate('/(tabs)')}
			>
				<Text style={[styles.mobileMenuText, themedStyles.mobileMenuText]}>Home</Text>
			</Pressable>
			{!disabledCommunityEvents && (
				<Pressable
					style={StyleSheet.flatten([styles.mobileMenuItem, themedStyles.mobileMenuItem])}
					onPress={() => handleNavigate('/(tabs)/community')}
				>
					<Text style={[styles.mobileMenuText, themedStyles.mobileMenuText]}>Community Events</Text>
				</Pressable>
			)}
			{isAuthenticated && (
				<Pressable
					style={StyleSheet.flatten([styles.mobileMenuItem, themedStyles.mobileMenuItem])}
					onPress={() => handleNavigate('/(tabs)/dashboard')}
				>
					<Text style={[styles.mobileMenuText, themedStyles.mobileMenuText]}>My Dashboard</Text>
				</Pressable>
			)}
			{chatEnabled && (
				<Pressable
					style={StyleSheet.flatten([styles.mobileMenuItem, themedStyles.mobileMenuItem])}
					onPress={() => handleNavigate('/(tabs)/chat')}
				>
					<Text style={[styles.mobileMenuText, themedStyles.mobileMenuText]}>Chat</Text>
				</Pressable>
			)}
			{isAuthenticated && isAdmin && (
				<Pressable
					style={StyleSheet.flatten([styles.mobileMenuItem, themedStyles.mobileMenuItem])}
					onPress={() => handleNavigate('/(tabs)/admin')}
				>
					<Text style={[styles.mobileMenuText, themedStyles.mobileMenuText]}>Admin</Text>
				</Pressable>
			)}
			{!isAuthenticated && (
				<Pressable
					style={StyleSheet.flatten([styles.mobileMenuItem, themedStyles.mobileMenuItem])}
					onPress={() => handleNavigate('/(auth)/login')}
				>
					<Text style={[styles.mobileMenuText, themedStyles.mobileMenuText]}>Sign In</Text>
				</Pressable>
			)}
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
				onRequestClose={() => onClose && onClose()}
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
}
