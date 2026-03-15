/**
 * DistanceBadge Component
 * 
 * A color-coded pill badge displaying a race distance label.
 * Each distance enum value maps to a distinct semantic color for quick visual scanning.
 * Optionally pressable for navigation.
 */

import React from 'react';
import { Text, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { getRaceDistanceLabel, getDistanceColor } from '../../../models';
import type { RaceDistance } from '../../../models';
import { styles } from './DistanceBadge.styles';

interface DistanceBadgeProps {
	/** Race distance enum value */
	distance: RaceDistance;
	/** Optional press handler (e.g., navigate to race) */
	onPress?: () => void;
	/** Use compact size (smaller text and padding) */
	compact?: boolean;
}

/**
 * DistanceBadge Component
 * 
 * Renders a rounded pill badge with the distance label (e.g., "5K", "Half Marathon")
 * colored according to the distance type.
 */
export function DistanceBadge({ distance, onPress, compact = false }: DistanceBadgeProps): React.ReactElement {
	const { isDark } = useTheme();
	const badgeColors = getDistanceColor(distance, isDark);
	const label = getRaceDistanceLabel(distance);

	const badgeStyle = [
		compact ? styles.badgeCompact : styles.badge,
		{ backgroundColor: badgeColors.background },
	];
	const labelStyle = [
		compact ? styles.labelCompact : styles.label,
		{ color: badgeColors.text },
	];

	if (onPress) {
		const iconSize = compact ? 10 : 16;
		return (
			<Pressable
				onPress={onPress}
				style={({ hovered }) => [
					...badgeStyle,
					styles.pressable,
					styles.pressableRow,
					hovered && styles.pressableHover,
				]}
			>
				<Ionicons name="link" size={iconSize} color={badgeColors.text} />
				<Text style={labelStyle}>{label}</Text>
			</Pressable>
		);
	}

	return (
		<View style={badgeStyle}>
			<Text style={labelStyle}>{label}</Text>
		</View>
	);
}
