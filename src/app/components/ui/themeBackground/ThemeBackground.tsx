/**
 * Theme Background Component
 * 
 * Renders gradient background based on current theme
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../contexts/ThemeContext';
	
interface ThemeBackgroundProps {
	children: React.ReactNode;
}

const Gradient = LinearGradient as React.ComponentType<
	React.ComponentProps<typeof LinearGradient> & {
		style?: React.ComponentProps<typeof View>['style'];
	}
>;

// Gradient definitions
const GRADIENTS = {
	dark: {
		web: 'radial-gradient(53.89% 99.37% at 39.45% -6.02%, rgba(4, 110, 212, 0.8) 0%, rgba(4, 110, 212, 0) 100%), radial-gradient(47.01% 82.21% at 104.3% 15.51%, rgba(118, 5, 180, 0.5) 0%, rgba(118, 5, 180, 0) 100%), radial-gradient(56.12% 58.33% at 50% 131.71%, rgb(118, 5, 180) 34.7%, rgba(118, 5, 180, 0) 100%), linear-gradient(0deg, rgb(17, 7, 57), rgb(17, 7, 57))',
		native: ['#1a0a2e', '#16213e', '#0f0e17'] as const,
	},
	light: {
		web: 'linear-gradient(72.44deg, rgb(230, 251, 254) 0%, rgb(237, 221, 251) 100%)',
		native: ['#e6fbfe', '#edddfe'] as const,
	},
} as const;

const webStyles = {
	container: {
		flex: 1,
		display: 'flex',
		flexDirection: 'column' as const,
        height: '100%',
	},
};

const renderWeb = (gradient: string, children: React.ReactNode) => (
	<div style={{ ...webStyles.container, background: gradient }}>
		{children}
	</div>
);

const renderNative = (
	colors: readonly [string, string, ...string[]],
	children: React.ReactNode,
	isDark: boolean
) => (
	<View style={styles.container}>
		<View style={{...StyleSheet.absoluteFillObject, pointerEvents: 'none' }}>
			<Gradient
				colors={colors}
				style={styles.gradient}
				start={{ x: isDark ? 0.5 : 0.35, y: 0 }}
				end={{ x: isDark ? 0.5 : 0.65, y: 1 }}
			/>
		</View>
		{children}
	</View>
);

export function ThemeBackground({ children }: ThemeBackgroundProps) {
	const { isDark } = useTheme();
	const theme = isDark ? GRADIENTS.dark : GRADIENTS.light;

	if (Platform.OS === 'web') {
		return renderWeb(theme.web, children);
	}

	return renderNative(theme.native, children, isDark);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	gradient: {
		flex: 1,
	},
});
