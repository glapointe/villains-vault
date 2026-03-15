/**
 * 404 Not Found Page
 * 
 * Displayed when users navigate to a route that doesn't exist.
 * Provides navigation back to home or login.
 */

import { View, Text } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Card, Button } from '../components/ui';
import { useAuth } from '../hooks';
import { styles, getThemedStyles } from '../styles/routes/not-found.styles';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { getThemedColors } from '../theme';
import { useMemo } from 'react';

/**
 * Not Found Screen Component
 * Shows 404 error with navigation options
 */
export default function NotFoundScreen() {
	const { isAuthenticated } = useAuth();
	const router = useRouter();
    const { isDark } = useTheme();
    const colors = getThemedColors(isDark);
    const themedStyles = useMemo(() => getThemedStyles(colors, isDark), [colors, isDark]);

	return (
		<>
			<Stack.Screen options={{ title: 'Page Not Found' }} />
			<View style={styles.container}>
				<Card style={styles.card}>
					<Text style={[styles.icon, themedStyles.icon]}>404</Text>
					
					<Text style={[styles.title, themedStyles.title]}>
						Page Not Found
					</Text>
					
					<Text style={[styles.message, themedStyles.message]}>
						Sorry, the page you're looking for doesn't exist.
					</Text>

					<View style={{flex: 1, width: '100%'}}>
						<Button
							title={'Go to Home'}
							variant="primary"
							fullWidth
							onPress={() => router.push('/(tabs)')}
						/>
					</View>
				</Card>
			</View>
		</>
	);
}
