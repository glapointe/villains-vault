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

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useAuth, useChatEnabled } from '../../../hooks';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { useRouter } from 'expo-router';
import { styles, getThemedStyles } from './HeaderMenu.styles';
import { getDisabledCommunityEvents } from 'utils';

export interface HeaderMenuProps {
	/** Whether the header is currently in mobile layout */
	isMobile: boolean;
	/** (Mobile only) Whether the menu is open */
	menuOpen?: boolean;
	/** (Mobile only) Callback to close the menu */
	onClose?: () => void;
}

/**
 * Navigation links + mobile hamburger menu dropdown.
 *
 * On desktop this renders the nav links inline; on mobile it renders the
 * full-width dropdown whose visibility is controlled by the parent (AppHeader).
 */
export function HeaderMenu({ isMobile, menuOpen = false, onClose }: HeaderMenuProps) {
	const { isAuthenticated, isAdmin } = useAuth();
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const router = useRouter();
	const { enabled: chatEnabled } = useChatEnabled();

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

	return (
		<View style={[styles.mobileMenu, themedStyles.mobileMenu]}>
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
}
