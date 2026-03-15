/**
 * Footer Component
 * 
 * Site-wide footer with copyright, contact info, and links
 * Appears on all pages at the bottom
 */

import { View, Text, Linking, Pressable, Platform } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { styles, getThemedStyles } from './AppFooter.styles';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

/**
 * Footer component that appears on all pages
 */
export function AppFooter(): React.ReactElement {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const router = useRouter();
	const currentYear = new Date().getFullYear();

	const openLink = (url: string) => {
		Linking.openURL(url).catch(err => console.error('Failed to open link:', err));
	};

	return (
		<View style={[styles.footer, themedStyles.footer]}>
			<View style={styles.footerContent}>
				<View style={styles.footerLeft}>
					<Text style={[styles.footerText, themedStyles.footerText]}>
						© {currentYear} Falchion Consulting, LLC. All rights reserved.
					</Text>
					<View style={styles.footerLinks}>
						{Platform.OS === 'web' ? (
							<>
								<a href="/privacy-policy" style={{ textDecoration: 'none' }}>
									<Text style={[styles.footerLink, themedStyles.footerLink]}>
										Privacy Policy
									</Text>
								</a>
								<Text style={[styles.footerSeparator, themedStyles.footerText]}>•</Text>
								<a href="/terms-of-service" style={{ textDecoration: 'none' }}>
									<Text style={[styles.footerLink, themedStyles.footerLink]}>
										Terms of Service
									</Text>
								</a>
							</>
						) : (
							<>
								<Pressable onPress={() => router.push('/privacy-policy')}>
									<Text style={[styles.footerLink, themedStyles.footerLink]}>
										Privacy Policy
									</Text>
								</Pressable>
								<Text style={[styles.footerSeparator, themedStyles.footerText]}>•</Text>
								<Pressable onPress={() => router.push('/terms-of-service')}>
									<Text style={[styles.footerLink, themedStyles.footerLink]}>
										Terms of Service
									</Text>
								</Pressable>
							</>
						)}
					</View>
					<Text style={[styles.footerSubtext, themedStyles.footerSubtext]}>
						Made with 💜 for the runDisney community
					</Text>
				</View>
				<View style={styles.footerRight}>
					<View style={styles.footerLinks}>
						<Pressable onPress={() => openLink('https://github.com/glapointe/villains-vault')}>
							<Ionicons
								name={'logo-github'}
								size={20}
								color={colors.textPrimary}
							/>
						</Pressable>
						<Pressable onPress={() => openLink('mailto:gary@falchionconsulting.com')}>
							<Ionicons
								name={'mail'}
								size={20}
								color={colors.textPrimary}
							/>
						</Pressable>
					</View>
				</View>
			</View>
		</View>
	);
}
