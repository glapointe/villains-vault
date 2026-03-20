/**
 * App Layout
 * 
 * This layout wraps all app routes and provides the navigation header.
 * Anonymous access is allowed - individual pages handle their own auth requirements.
 * Uses Animated.ScrollView to provide scroll offset for parallax hero effects.
 */

import { Slot, usePathname } from 'expo-router';
import { View } from 'react-native';
import Animated, { useAnimatedScrollHandler } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, ThemeBackground } from '../../components/ui';
import { Footer } from '../../components/layout';
import { ScrollOffsetProvider, useScrollOffset } from '../../contexts/ScrollOffsetContext';
import { styles } from '../../styles/routes/_layout.styles';

/** Typed wrapper for Animated.ScrollView */
const AnimScrollView = Animated.ScrollView as React.ComponentType<any>;

/** Routes that manage their own scroll and should not be wrapped in the outer AnimScrollView */
const FULL_HEIGHT_ROUTES = ['/chat'];

/**
 * Inner layout that consumes ScrollOffsetContext to wire up the scroll handler
 */
function AppLayoutInner() {
	const scrollY = useScrollOffset();
	const pathname = usePathname();
	const insets = useSafeAreaInsets();

	/** True for routes like /chat that fill the viewport and handle their own scrolling */
	const isFullHeight = FULL_HEIGHT_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event: any) => {
			if (scrollY) {
				scrollY.value = event.contentOffset.y;
			}
		},
	});

	return (
		<View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }}>
			<ThemeBackground>
				<View style={[styles.container]}>
					<AppHeader />
					{isFullHeight ? (
						<View style={styles.scrollView}>
							<View style={styles.content}>
								<Slot />
							</View>
						</View>
					) : (
						<AnimScrollView
							style={styles.scrollView}
							contentContainerStyle={styles.scrollContent}
							onScroll={scrollHandler}
							scrollEventThrottle={16}
							keyboardShouldPersistTaps="always"
						>
							<View style={styles.content}>
								<Slot />
							</View>
							<Footer />
						</AnimScrollView>
					)}
				</View>
			</ThemeBackground>
		</View>
	);
}

/**
 * Layout for app routes
 * Includes header with navigation, sign-in, and scroll offset provider
 */
export default function AppLayout() {
	return (
		<ScrollOffsetProvider>
			<AppLayoutInner />
		</ScrollOffsetProvider>
	);
}
