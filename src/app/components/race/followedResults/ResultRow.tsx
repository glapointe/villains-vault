/**
 * ResultRow Component
 *
 * A single race result row showing race name, date, distance badge,
 * chip time, pace, kills, and action buttons. Used in claimed,
 * interested, and search contexts.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { DistanceBadge } from '../../ui';
import { useDialog } from '../../../contexts/DialogContext';
import { formatTime, formatDate } from './helpers';
import type { ResultRowProps } from './FollowedResultsList.types';
import { styles } from './FollowedResultsList.styles';

export function ResultRow({
	follow,
	mode,
	onViewResult,
	onUnfollow,
	onUpdateFollow,
	colors,
	themedStyles,
	actionLoading,
}: ResultRowProps): React.ReactElement {
	const { showConfirm } = useDialog();

	const handleEditDls = async () => {
		const currentDls = follow.deadLastStarted ?? false;
		const confirmed = await showConfirm({
			title: currentDls ? 'Disable Dead Last Start?' : 'Enable Dead Last Start?',
			message: currentDls
				? 'Remove the Dead Last Start marker from this result.'
				: 'Mark this result as a Dead Last Start corral entry.',
			submitText: currentDls ? 'Disable DLS' : 'Enable DLS',
			cancelText: 'Cancel',
		});
		if (confirmed) {
			await onUpdateFollow(follow.raceResultId, !currentDls);
		}
	};

	const handleUnfollow = async () => {
		if (mode === 'claimed') {
			const confirmed = await showConfirm({
				title: 'Remove Result?',
				message: "This will remove this result from your claimed list. You can add it back at any time using the 'Find My Results' button.",
				submitText: 'Remove',
				cancelText: 'Keep',
			});
			if (!confirmed) return;
		}
		onUnfollow(follow.raceResultId);
	};

	return (
		<View style={[styles.resultCard, themedStyles.resultCard]}>
			<View style={styles.resultContent}>
				<Pressable onPress={() => onViewResult(follow.raceResultId)}>
					<Text style={[styles.resultRaceName, themedStyles.resultRaceName]} numberOfLines={1}>
						{follow.raceName}
					</Text>
				</Pressable>
				<View style={styles.resultMeta}>
					<Text style={[styles.resultMetaText, themedStyles.resultMetaText]}>
						{formatDate(follow.raceDate)}
					</Text>
					<DistanceBadge distance={follow.distance} compact />
					{mode === 'claimed' && follow.deadLastStarted && (
						<View style={[styles.dlsBadge, themedStyles.dlsBadge]}>
							<Ionicons name="flag" size={10} color={colors.warning} />
							<Text style={[styles.dlsBadgeText, themedStyles.dlsBadgeText]}>DLS</Text>
						</View>
					)}
				</View>
			</View>

			<View style={styles.resultRightGroup}>
				<View style={styles.resultStats}>
					{follow.netTime && (
						<View style={styles.statItem}>
							<Text style={[styles.statValue, themedStyles.statValue]}>
								{formatTime(follow.netTime)}
							</Text>
							<Text style={[styles.statLabel, themedStyles.statLabel]}>Chip</Text>
						</View>
					)}
					{follow.overallPace && (
						<View style={styles.statItem}>
							<Text style={[styles.statValue, themedStyles.statValue]}>
								{formatTime(follow.overallPace)}
							</Text>
							<Text style={[styles.statLabel, themedStyles.statLabel]}>Pace</Text>
						</View>
					)}
					{follow.passes != null && (
						<View style={styles.statItem}>
							<Text style={[styles.statValue, themedStyles.statValue]}>
								{follow.passes}
							</Text>
							<Text style={[styles.statLabel, themedStyles.statLabel]}>Kills</Text>
						</View>
					)}
				</View>

				<View style={styles.resultActions}>
					<Pressable
						style={styles.actionButton}
						onPress={() => onViewResult(follow.raceResultId)}
					>
						<Ionicons name="open-outline" size={18} color={colors.primary} />
					</Pressable>
					{mode === 'claimed' && (
						<Pressable
							style={styles.actionButton}
							onPress={handleEditDls}
							disabled={actionLoading}
						>
							<Feather name="edit" size={18} color={colors.textSecondary} />
						</Pressable>
					)}
					<Pressable
						style={styles.actionButton}
						onPress={handleUnfollow}
						disabled={actionLoading}
					>
						<Ionicons name="close-circle-outline" size={18} color={colors.error} />
					</Pressable>
				</View>
			</View>
		</View>
	);
}