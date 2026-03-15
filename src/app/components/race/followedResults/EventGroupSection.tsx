/**
 * EventGroupSection Component
 *
 * Renders an event heading followed by its result rows.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ResultRow } from './ResultRow';
import type { EventGroupSectionProps } from './FollowedResultsList.types';
import { styles } from './FollowedResultsList.styles';

export function EventGroupSection({
	group,
	mode,
	onViewResult,
	onUnfollow,
	onUpdateFollow,
	colors,
	themedStyles,
	actionLoading,
}: EventGroupSectionProps): React.ReactElement {
	return (
		<View style={styles.eventGroupContainer}>
			<View style={[styles.eventGroupHeader, themedStyles.eventGroupHeader]}>
				<Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
				<Text style={[styles.eventGroupName, themedStyles.eventGroupName]} numberOfLines={1}>
					{group.eventName}
				</Text>
			</View>
			{group.results.map((follow) => (
				<ResultRow
					key={follow.raceResultId}
					follow={follow}
					mode={mode}
					onViewResult={onViewResult}
					onUnfollow={onUnfollow}
					onUpdateFollow={onUpdateFollow}
					colors={colors}
					themedStyles={themedStyles}
					actionLoading={actionLoading}
				/>
			))}
		</View>
	);
}
