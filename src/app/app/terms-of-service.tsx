import React, { useState, useEffect } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { getThemedColors } from '../theme';
import { Button, MarkdownViewer } from '../components/ui';
import { styles, getThemedStyles } from '../styles/routes/terms-of-service.styles';

/**
 * Terms of Service Page
 * 
 * Displays terms of service from markdown file.
 * Required for Auth0 social authentication providers.
 */
export default function TermsOfServiceScreen() {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const router = useRouter();
	const [content, setContent] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(true);

	useEffect(() => {
		const loadMarkdown = async () => {
			try {
				// Load markdown file as a text asset
				const termsUrl = require('../assets/content/terms-of-service.md');
				const response = await fetch(termsUrl);
				const text = await response.text();
				setContent(text);
			} catch (error) {
				console.error('Failed to load terms of service:', error);
				setContent('# Terms of Service\n\nFailed to load content. Please try again later.');
			} finally {
				setLoading(false);
			}
		};

		loadMarkdown();
	}, []);

	if (loading) {
		return (
			<View style={[styles.container, themedStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	return (
		<View style={[styles.container, themedStyles.container]}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={true}
			>
				<MarkdownViewer>{content}</MarkdownViewer>

				<View style={styles.footer}>
					<Button
						title="Back to App"
						variant="primary"
						fullWidth={false}
						style={styles.backButton}
						onPress={() => router.push('/')}
					/>
				</View>
			</ScrollView>
		</View>
	);
}
