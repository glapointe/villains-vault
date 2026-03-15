/**
 * App Header Component
 *
 * Layout shell for the navigation bar. Composes HeaderMenu (nav links +
 * mobile dropdown) and UserMenu (avatar + user dropdown + edit panel).
 * Keeps its own state only for the hamburger menu open/close toggle.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MainLogoWhite from '../../../assets/images/VillainsClub_White.svg';
import MainLogoBlack from '../../../assets/images/VillainsClub.svg';
import { HeaderMenu } from '../headerMenu';
import { UserMenu } from '../../users/userMenu';
import { styles, getThemedStyles } from './AppHeader.styles';

const MOBILE_BREAKPOINT = 768;

export function AppHeader() {
    const { isDark, toggleTheme } = useTheme();
    const colors = getThemedColors(isDark);
    const themedStyles = getThemedStyles(colors);
    const router = useRouter();
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const isMobile = width < MOBILE_BREAKPOINT;
    const headerRef = useRef<View>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    // Close mobile menu when resizing to desktop
    useEffect(() => {
        if (!isMobile && menuOpen) setMenuOpen(false);
    }, [isMobile]);

    return (
        <View ref={headerRef as any} style={[styles.header, themedStyles.header, { paddingTop: insets.top }]}>
            <View style={styles.container}>
                {/* Logo/Brand */}
                <View style={styles.brandRow}>
                    <Pressable onPress={() => router.push('/(tabs)')}>
                        {isDark ? <MainLogoWhite style={styles.brandLogo} /> : <MainLogoBlack style={styles.brandLogo} />}
                    </Pressable>
                    <Pressable onPress={() => router.push('/(tabs)')} style={styles.brandTextContainer}>
                        <Text style={[styles.brandText, themedStyles.brandText]}>Villains Vault</Text>
                    </Pressable>
                </View>

                {/* Desktop Navigation */}
                {!isMobile && (
                    <View style={styles.desktopNav}>
                        <Pressable onPress={toggleTheme} style={styles.iconButton}>
                            <Ionicons
                                name={isDark ? 'sunny' : 'moon'}
                                size={20}
                                color={colors.textPrimary}
                            />
                        </Pressable>

                        <HeaderMenu isMobile={false} />
                        <UserMenu isMobile={false} headerRef={headerRef} />
                    </View>
                )}

                {/* Mobile Actions */}
                {isMobile && (
                    <View style={styles.mobileActions}>
                        <Pressable onPress={toggleTheme} style={styles.themeToggle}>
                            <Ionicons
                                name={isDark ? 'sunny' : 'moon'}
                                size={22}
                                color={colors.textPrimary}
                            />
                        </Pressable>
                        <UserMenu isMobile={true} headerRef={headerRef} onOpenMenu={() => setMenuOpen(false)} />
                        <Pressable onPress={() => setMenuOpen(p => !p)} style={styles.menuButton}>
                            <Ionicons
                                name={menuOpen ? 'close' : 'menu'}
                                size={28}
                                color={colors.textPrimary}
                            />
                        </Pressable>
                    </View>
                )}
            </View>

            {/* Mobile nav menu — rendered here (outside the flex row) so it expands full-width */}
            <HeaderMenu isMobile={true} menuOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        </View>
    );
}

