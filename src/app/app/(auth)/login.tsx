/**
 * Login Screen
 * 
 * Entry point for the application. Displays social login buttons for
 * Google, Apple, and Microsoft authentication via Auth0.
 * Automatically redirects authenticated users to the app.
 */

import { View, Text } from 'react-native';
import { useAuth } from '../../hooks';
import { useTheme } from '../../contexts/ThemeContext';
import { Redirect, useRouter } from 'expo-router';
import { LoadingSpinner, Button, Card, ThemeBackground } from '../../components/ui';
import { socialConnections } from '../../features/auth/providers/config';
import { FontAwesome, AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { getThemedColors } from '../../theme';
import { styles, getThemedStyles } from '../../styles/routes/login.styles';

/**
 * Login Screen Component
 * Provides social authentication via Google, Apple, and Microsoft
 */
export default function LoginScreen() {
    const { isLoading, isAuthenticated, login } = useAuth();
    const { isDark } = useTheme();
    const colors = getThemedColors(isDark);
    const themedStyles = getThemedStyles(colors);
    const router = useRouter();
    
    // Icon color for social buttons (should match text color)
    const iconColor = colors.textPrimary;

    // Show loading state while checking auth status
    if (isLoading) {
        return <LoadingSpinner />;
    }

    // Redirect if already authenticated
    if (isAuthenticated) {
        return <Redirect href="/(tabs)" />;
    }

    return (
        <ThemeBackground>
            <View style={styles.container}>
                <Card style={styles.card}>
                    <Text style={[styles.title, themedStyles.title]}>
						Villains Vault
					</Text>
                    <Text style={[styles.subtitle, themedStyles.subtitle]}>
                        Track your race results and analyze your performance
					</Text>

                    {/* Google Sign In */}
                    <Button
                        title="Continue with Google"
                        variant="ghost"
                        onPress={() => login(socialConnections.google)}
                        fullWidth
                        style={styles.button}
                        icon={<AntDesign name="google" size={20} color={iconColor} />}
                    />

                    {/* Apple Sign In */}
                    {/* <Button
                        title="Continue with Apple"
                        variant="ghost"
                        onPress={() => login(socialConnections.apple)}
                        fullWidth
                        style={styles.button}
                        icon={<AntDesign name="apple" size={20} color={iconColor} />}
                    /> */}

                    {/* Facebook Sign In */}
                    <Button
                        title="Continue with Facebook"
                        variant="ghost"
                        onPress={() => login(socialConnections.facebook)}
                        fullWidth
                        style={styles.button}
                        icon={<FontAwesome name="facebook" size={20} color={iconColor} />}
                    />

                    {/* Microsoft Sign In */}
                    <Button
                        title="Continue with Microsoft"
                        variant="ghost"
                        onPress={() => login(socialConnections.microsoft)}
                        fullWidth
                        style={styles.button}
                        icon={<MaterialCommunityIcons name="microsoft" size={20} color={iconColor} />}
                    />

                    <Text style={[styles.footer, themedStyles.footer]}>
                        Sign in securely using your existing account
					</Text>

					{/* Cancel Button */}
					<Button
						title="Browse as Guest"
						variant="ghost"
						onPress={() => router.push('/(tabs)')}
						fullWidth
						style={[styles.button, { marginTop: 8 }]}
					/>
                </Card>
            </View>
        </ThemeBackground>
    );
}
