/**
 * EmptyState Component
 *
 * Placeholder shown when a column has no results.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { EmptyStateProps } from './FollowedResultsList.types';
import { styles } from './FollowedResultsList.styles';

export function EmptyState({
	title,
	subtitle,
	themedStyles,
}: EmptyStateProps): React.ReactElement {
	return (
		<View style={styles.emptyState}>
			<Ionicons name="bookmark-outline" size={32} color="gray" />
			<Text style={[styles.emptyTitle, themedStyles.emptyTitle]}>{title}</Text>
			<Text style={[styles.emptySubtitle, themedStyles.emptySubtitle]}>{subtitle}</Text>
		</View>
	);
}
