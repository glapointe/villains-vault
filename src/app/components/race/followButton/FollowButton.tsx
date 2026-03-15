/**
 * FollowButton Component
 * 
 * Allows authenticated users to follow or unfollow a race result.
 * Supports two follow types:
 * - Interested: tracking someone else's result (friend, family, etc.)
 * - Claimed: stating this is the user's own result
 * 
 * When claiming, prompts whether the user Dead Last Started (DLS) the race.
 * When unfollowing a claimed result, warns that the claim and DLS status will be released.
 */

import { useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useDialog } from '../../../contexts/DialogContext';
import { getThemedColors } from '../../../theme';
import { useAuth } from '../../../hooks/useAuth';
import { useFollows } from '../../../hooks/useFollows';
import { FollowType } from '../../../models';
import { ConfirmationDialog, InfoTooltip } from '../../ui';
import { styles, getThemedStyles } from './FollowButton.styles';

interface FollowButtonProps {
	/** The race result ID to follow/unfollow */
	raceResultId: number;
	mode?: 'button' | 'link'; // 'button' for full button, 'link' for text-only link style
	linkPrefixText?: string; // Optional text to show before the link when in 'link' mode
	linkSuffixText?: string; // Optional text to show after the link when in 'link' mode
}

/**
 * FollowButton Component
 * Displays a follow/unfollow button for a race result with dialog interactions.
 */
export function FollowButton({ raceResultId, mode = 'button', linkPrefixText, linkSuffixText }: FollowButtonProps): React.ReactElement | null {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const { isAuthenticated, accessToken } = useAuth();
	const { showConfirm } = useDialog();
	const { follow, loading, actionLoading, isFollowing, followResult, unfollowResult } = useFollows({
		raceResultId,
		accessToken,
	});

	// Follow dialog state
	const [followDialogOpen, setFollowDialogOpen] = useState(false);
	const [selectedType, setSelectedType] = useState<FollowType>(FollowType.Interested);

	// DLS dialog state
	const [dlsDialogOpen, setDlsDialogOpen] = useState(false);

	// Don't show for unauthenticated users
	if (!isAuthenticated) {
		return null;
	}

	const handleFollowPress = (): void => {
		setSelectedType(FollowType.Interested);
		setFollowDialogOpen(true);
	};

	const handleFollowDialogSubmit = async (): Promise<void> => {
		setFollowDialogOpen(false);

		if (selectedType === FollowType.Claimed) {
			// Ask about DLS
			setDlsDialogOpen(true);
		} else {
			// Follow as Interested
			await followResult({
				raceResultId,
				followType: FollowType.Interested,
				deadLastStarted: null,
			});
		}
	};

	const handleDlsYes = async (): Promise<void> => {
		setDlsDialogOpen(false);
		await followResult({
			raceResultId,
			followType: FollowType.Claimed,
			deadLastStarted: true,
		});
	};

	const handleDlsNo = async (): Promise<void> => {
		setDlsDialogOpen(false);
		await followResult({
			raceResultId,
			followType: FollowType.Claimed,
			deadLastStarted: false,
		});
	};

	const handleUnfollow = useCallback(async () => {
		const isClaimed = follow?.followType === FollowType.Claimed;
		const hasDls = follow?.deadLastStarted === true;

		let message = 'Are you sure you want to unfollow this result? You can always re-follow at any time.';
		if (isClaimed) {
			message = 'This will release your claim on this result';
			if (hasDls) {
				message += ' and clear your DLS status';
			}
			message += '. You can always re-follow and re-claim at any time.';
		}

		const confirmed = await showConfirm({
			title: 'Unfollow Result',
			message,
			submitText: 'Unfollow',
			cancelText: 'Keep Following',
		});

		if (confirmed) {
			await unfollowResult();
		}
	}, [follow, showConfirm, unfollowResult]);

	if (loading) {
		return null;
	}

	const isClaimed = follow?.followType === FollowType.Claimed;
	const isLinkMode = mode === 'link';
	let buttonLabel = isFollowing
		? (isClaimed ? 'My Result' : 'Following')
		: 'Follow';
	if (isLinkMode) {
		buttonLabel = isFollowing
			? (isClaimed ? 'Unclaim' : 'Unfollow')
			: 'Follow';
	}
	const iconName = isFollowing
		? (isClaimed ? 'person-circle' : 'heart')
		: 'heart-outline';
	const iconColor = isClaimed
		? colors.success
		: isFollowing
			? colors.primary
			: colors.textSecondary;
	
	const getButtonLabel = () => {
		if (isLinkMode) {
			return (
				<>
					{buttonLabel}
					<InfoTooltip 
						tooltip={isFollowing ? (isClaimed ? 'You have claimed this result as your own - click to release your claim.' : 'You are following this result - click to unfollow.') : 'Follow this result to track updates and claim it as your own if it is yours'}
						placement="top"
					/>
				</>);
		} else {
			return <>{buttonLabel}</>;
		}
	};

	const getButton = () => {
		return (<Pressable
			style={({ hovered }: { hovered: boolean }) => [
				isLinkMode ? styles.followLink : styles.followButton,
				isLinkMode ? themedStyles.followLink : themedStyles.followButton,
				!isLinkMode && isFollowing && !isClaimed && themedStyles.followButtonFollowing,
				!isLinkMode && isClaimed && themedStyles.followButtonClaimed,
				hovered && (isLinkMode ? themedStyles.followLinkHover : themedStyles.followButtonHover),
			]}
			onPress={isFollowing ? handleUnfollow : handleFollowPress}
			disabled={actionLoading}
		>
			{!isLinkMode && <Ionicons name={iconName as any} size={16} color={iconColor} />}
			<Text style={[
				isLinkMode ? styles.followLinkText : styles.followButtonText,
				isLinkMode ? themedStyles.followLinkText : themedStyles.followButtonText,
				!isLinkMode && isFollowing && !isClaimed && themedStyles.followButtonTextFollowing,
				!isLinkMode && isClaimed && themedStyles.followButtonTextClaimed,
			]}>
				{linkPrefixText && isLinkMode && <Text>{linkPrefixText}</Text>}
				{actionLoading ? '...' : getButtonLabel()}
				{linkSuffixText && isLinkMode && <Text>{linkSuffixText}</Text>}
			</Text>
		</Pressable>);
	};

	return (
		<View style={styles.container}>
			{getButton()}
			{!isLinkMode && isFollowing && follow?.deadLastStarted && (
				<View style={styles.statusBadge}>
					<Ionicons name="flag" size={12} color={colors.warning} />
					<Text style={[styles.statusText, themedStyles.statusText]}>DLS</Text>
				</View>
			)}

			{/* Follow Type Selection Dialog */}
			<ConfirmationDialog
				isOpen={followDialogOpen}
				title="Follow This Result"
				submitText="Continue"
				cancelText="Cancel"
				onSubmit={handleFollowDialogSubmit}
				onCancel={() => setFollowDialogOpen(false)}
			>
				<View style={styles.dialogContent}>
					<Text style={[styles.dialogDescription, themedStyles.dialogDescription]}>
						How would you like to follow this result?
					</Text>

					<Pressable
						style={[
							styles.typeOption,
							themedStyles.typeOption,
							selectedType === FollowType.Interested && themedStyles.typeOptionSelected,
						]}
						onPress={() => setSelectedType(FollowType.Interested)}
					>
						<Ionicons
							name={selectedType === FollowType.Interested ? 'radio-button-on' : 'radio-button-off'}
							size={20}
							color={selectedType === FollowType.Interested ? colors.primary : colors.textSecondary}
						/>
						<View style={styles.typeOptionContent}>
							<Text style={[styles.typeOptionLabel, themedStyles.typeOptionLabel]}>Follow</Text>
							<Text style={[styles.typeOptionDescription, themedStyles.typeOptionDescription]}>
								Track this runner's results (friend, family, or just curious)
							</Text>
						</View>
					</Pressable>

					<Pressable
						style={[
							styles.typeOption,
							themedStyles.typeOption,
							selectedType === FollowType.Claimed && themedStyles.typeOptionSelected,
						]}
						onPress={() => setSelectedType(FollowType.Claimed)}
					>
						<Ionicons
							name={selectedType === FollowType.Claimed ? 'radio-button-on' : 'radio-button-off'}
							size={20}
							color={selectedType === FollowType.Claimed ? colors.primary : colors.textSecondary}
						/>
						<View style={styles.typeOptionContent}>
							<Text style={[styles.typeOptionLabel, themedStyles.typeOptionLabel]}>This Is Me</Text>
							<Text style={[styles.typeOptionDescription, themedStyles.typeOptionDescription]}>
								Claim this as your own race result
							</Text>
						</View>
					</Pressable>
				</View>
			</ConfirmationDialog>

			{/* DLS Question Dialog */}
			<ConfirmationDialog
				isOpen={dlsDialogOpen}
				title="Dead Last Start (DLS)"
				message="Did you Dead Last Start (DLS) this race? DLS means you intentionally started at the very back of the pack."
				submitText="Yes, I DLS'd!"
				cancelText="No"
				onSubmit={handleDlsYes}
				onCancel={handleDlsNo}
			/>
		</View>
	);
}

