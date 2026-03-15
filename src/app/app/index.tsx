/**
 * Root Index - Landing Page
 * 
 * Entry point that redirects all users to the main app.
 * Anonymous access is allowed - authentication is only required
 * for specific protected pages.
 */

import '../polyfills/reactNativePlatformConstants'; // Ensure PlatformConstants is defined for web tooltip support
import { Redirect } from 'expo-router';

/**
 * Root landing page component
 * Redirects to main app (anonymous access allowed)
 */
export default function Index() {
	return <Redirect href="/(tabs)" />;
}
