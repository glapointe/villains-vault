/**
 * User Management Screen
 * 
 * Admin-only page for managing user accounts.
 * Accessible from the admin dashboard.
 * Requires authentication and admin privileges.
 */

import { View, ScrollView } from 'react-native';
import { useAuth } from '../../hooks';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemedColors } from '../../theme';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState, Suspense } from 'react';
import { api, setAuthToken } from '../../services/api';
import { LoadingSpinner } from '../../components/ui';
import { UserManagementGrid } from '../../features/admin';
import { styles, getThemedStyles } from '../../styles/routes/users.styles';

/**
 * User Management Route
 * Route guard ensures only administrators can access this screen
 */
export default function UserManagementScreen(): React.ReactElement {
	const { isAuthenticated, accessToken } = useAuth();
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const router = useRouter();
	const [isAdmin, setIsAdmin] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(true);
	const [currentUserId, setCurrentUserId] = useState<number>(0);

	/**
	 * Verifies administrative access and fetches current user ID
	 */
	useEffect((): void => {
		if (!isAuthenticated) {
			setLoading(false);
			return;
		}

		if (!accessToken) {
			setLoading(true);
			return;
		}

		setAuthToken(accessToken);
		api.users.getCurrentUser()
			.then((profile): void => {
				setIsAdmin(profile.isAdmin);
				setCurrentUserId(profile.id);
				if (!profile.isAdmin) {
					router.replace('/(tabs)');
				}
			})
			.catch((err: unknown): void => {
				console.error('Failed to fetch user profile:', err);
			})
			.finally((): void => {
				setLoading(false);
			});
	}, [accessToken, isAuthenticated]);

	if (loading) {
		return <LoadingSpinner />;
	}

	if (!isAuthenticated) {
		return <Redirect href="/login" />;
	}

	if (!isAdmin) {
		return <Redirect href="/(tabs)" />;
	}

	return (
		<ScrollView style={[styles.container, themedStyles.container]} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="always">
			<View style={[styles.content, themedStyles.content]}>
				{accessToken && (
					<Suspense fallback={<LoadingSpinner />}>
						<UserManagementGrid
							accessToken={accessToken}
							currentUserId={currentUserId}
						/>
					</Suspense>
				)}
			</View>
		</ScrollView>
	);
}
