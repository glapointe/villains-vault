/**
 * Loading Spinner Component
 * 
 * Centered loading indicator for page-level loading states
 */

import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { styles } from './LoadingSpinner.styles';

interface LoadingSpinnerProps {
	size?: 'small' | 'large';
	color?: string;
}

export function LoadingSpinner({ size = 'large', color }: LoadingSpinnerProps) {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const defaultColor = color || colors.primary;
	return (
		<View style={styles.container}>
			<ActivityIndicator size={size} color={defaultColor} />
		</View>
	);
}
