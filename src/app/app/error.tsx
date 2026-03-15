/**
 * Error Boundary Page
 * 
 * Catches unhandled errors in the app and displays a friendly error message.
 * Provides options to retry or return home.
 */

import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card, Button } from '../components/ui';
import { useAuth } from '../hooks';
import { styles, getThemedStyles } from '../styles/routes/error.styles';
import { useTheme } from '../contexts/ThemeContext';
import { getThemedColors } from '../theme';

/**
 * Error Screen Component
 * Displays when an unhandled error occurs
 */
export default function ErrorScreen() {
	const router = useRouter();
	const { isAuthenticated } = useAuth();
	const params = useLocalSearchParams();
    const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = useMemo(() => getThemedStyles(colors, isDark), [colors, isDark]);

	// Error message from navigation params (if provided)
	const errorMessage = typeof params.message === 'string' 
		? params.message 
		: 'An unexpected error occurred';

	/**
	 * Reload the current page
	 */
	const handleRetry = () => {
		router.back();
	};

	/**
	 * Navigate to home or login
	 */
	const handleGoHome = () => {
		if (isAuthenticated) {
			router.replace('/(tabs)');
		} else {
			router.replace('/login');
		}
	};

	return (
		<View style={styles.container}>
			<Card style={styles.card}>
				<Text style={[styles.icon, themedStyles.icon]}>⚠️</Text>
				
				<Text style={[styles.title, themedStyles.title]}>
					Something Went Wrong
				</Text>
				
				<Text style={[styles.message, themedStyles.message]}>
					{errorMessage}
				</Text>

				{/* Development mode: show stack trace */}
				{__DEV__ && params.stack && (
					<View style={[styles.stackTrace, themedStyles.stackTrace]}>
						<Text style={[styles.stackTraceText, themedStyles.stackTraceText]}>
							{String(params.stack)}
						</Text>
					</View>
				)}

				<View style={styles.buttonContainer}>
					<Button
						title="Try Again"
						variant="primary"
						onPress={handleRetry}
						fullWidth
					/>

					<Button
						title="Go to Home"
						variant="ghost"
						onPress={handleGoHome}
						fullWidth
					/>
				</View>
			</Card>
		</View>
	);
}
