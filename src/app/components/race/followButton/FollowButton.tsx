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

import { useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useDialog } from '../../../contexts/DialogContext';
import { getThemedColors } from '../../../theme';
import { useAuth } from '../../../hooks/useAuth';
import { useFollows } from '../../../hooks/useFollows';
import { FollowType } from '../../../models';
import { InfoTooltip } from '../../ui';
import { styles, getThemedStyles } from './FollowButton.styles';

/**
 * Sub-component for selecting follow type inside the imperative dialog.
 * Manages its own visual selection state and reports changes via onChange.
 */
function FollowTypeSelector({ onChange }: { onChange: (type: FollowType) => void }): React.ReactElement {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const [selected, setSelected] = useState<FollowType>(FollowType.Interested);

	const select = (type: FollowType) => {
		setSelected(type);
		onChange(type);
	};

	return (
		<ScrollView style={styles.dialogContent}>
			<Text style={[styles.dialogDescription, themedStyles.dialogDescription]}>
				How would you like to follow this result?
			</Text>

			<Pressable
				style={[
					styles.typeOption,
					themedStyles.typeOption,
					selected === FollowType.Interested && themedStyles.typeOptionSelected,
				]}
				onPress={() => select(FollowType.Interested)}
			>
				<Ionicons
					name={selected === FollowType.Interested ? 'radio-button-on' : 'radio-button-off'}
					size={20}
					color={selected === FollowType.Interested ? colors.primary : colors.textSecondary}
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
					selected === FollowType.Claimed && themedStyles.typeOptionSelected,
				]}
				onPress={() => select(FollowType.Claimed)}
			>
				<Ionicons
					name={selected === FollowType.Claimed ? 'radio-button-on' : 'radio-button-off'}
					size={20}
					color={selected === FollowType.Claimed ? colors.primary : colors.textSecondary}
				/>
				<View style={styles.typeOptionContent}>
					<Text style={[styles.typeOptionLabel, themedStyles.typeOptionLabel]}>This Is Me</Text>
					<Text style={[styles.typeOptionDescription, themedStyles.typeOptionDescription]}>
						Claim this as your own race result
					</Text>
				</View>
			</Pressable>
		</ScrollView>
	);
}

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

	// Tracks follow type selection made inside the FollowTypeSelector sub-component.
	// Using a ref so the value is always current when the dialog resolves, without
	// needing to rebuild the confirm call on each render.
	const selectedTypeRef = useRef<FollowType>(FollowType.Interested);
	const [hovered, setHovered] = useState(false); // For web hover state

	// Don't show for unauthenticated users
	if (!isAuthenticated) {
		return null;
	}

	/**
	 * Shows the follow-type selection dialog via DialogContext (root-level Modal, safe inside ScrollViews).
	 * Uses a ref to capture the radio-button selection that FollowTypeSelector manages internally.
	 */
	const handleFollowPress = async (): Promise<void> => {
		selectedTypeRef.current = FollowType.Interested;

		const confirmed = await showConfirm({
			title: 'Follow This Result',
			submitText: 'Continue',
			cancelText: 'Cancel',
			children: <FollowTypeSelector onChange={(type) => { selectedTypeRef.current = type; }} />,
		});

		if (!confirmed) return;

		// Cast to break TypeScript's control-flow narrowing: TS tracks the literal assignment
		// `selectedTypeRef.current = FollowType.Interested` above and cannot see that the
		// onChange lambda may have mutated it during the awaited showConfirm. A type assertion
		// (unlike a type annotation) fully resets the inferred type to the full FollowType union.
		const selectedType = selectedTypeRef.current as FollowType;
		if (selectedType === FollowType.Claimed) {
			// Ask about DLS — both outcomes result in following, so we re-use showConfirm
			// and treat true → DLS'd, false → not DLS'd.
			const dls = await showConfirm({
				title: 'Dead Last Start (DLS)',
				message: "Did you Dead Last Start (DLS) this race? DLS means you intentionally started at the very back of the pack.",
				submitText: "Yes, I DLS'd!",
				cancelText: 'No',
			});
			await followResult({
				raceResultId,
				followType: FollowType.Claimed,
				deadLastStarted: dls,
			});
		} else {
			await followResult({
				raceResultId,
				followType: FollowType.Interested,
				deadLastStarted: null,
			});
		}
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
					{/* InfoTooltip is web-only in link mode.
					    On native, the Tooltip uses a Modal + measureInWindow() on a View ref.
					    When that ref is nested inside multiple <Text> nodes (markdown link rule),
					    measureInWindow returns (0,0) → tooltip renders at top-left. Additionally,
					    dismissing the tooltip Modal triggers an Android touch-ghost event on the
					    underlying FollowButton <Text>, which opens the follow dialog unexpectedly.
					    On web, InfoTooltip renders via a DOM portal so neither issue exists. */}
					{Platform.OS === 'web' && (
						<InfoTooltip
							tooltip={isFollowing ? (isClaimed ? 'You have claimed this result as your own - click to release your claim.' : 'You are following this result - click to unfollow.') : 'Follow this result to track updates and claim it as your own if it is yours'}
							placement="top"
						/>
					)}
				</>
			);
		} else {
			return <>{buttonLabel}</>;
		}
	};

	const getButton = () => {
		const innerContent = <>
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
		</>;

		const textEl = <Text
			style={[
				isLinkMode ? styles.followLink : styles.followButton,
				isLinkMode ? themedStyles.followLink : themedStyles.followButton,
				!isLinkMode && isFollowing && !isClaimed && themedStyles.followButtonFollowing,
				!isLinkMode && isClaimed && themedStyles.followButtonClaimed,
				hovered && (isLinkMode ? themedStyles.followLinkHover : themedStyles.followButtonHover),
			]}
			onPress={actionLoading ? undefined : (isFollowing ? handleUnfollow : handleFollowPress)}
			{...(!isLinkMode ? { disabled: actionLoading } : {})}
			{...(Platform.OS === 'web' ? {
				onMouseEnter: () => setHovered(true),
				onMouseLeave: () => setHovered(false)
			} : {})}
		>
			{innerContent}
		</Text>;

		// On web in link mode, RNW renders a root-level <Text> as <div> (no Text ancestor in tree).
		// Wrapping in TextAncestorContext.Provider value={true} adds no DOM node but tells RNW
		// the Text has a parent, so it renders as <span> — safe for inline use inside <p> tags.
		if (isLinkMode && Platform.OS === 'web') {
			const TextAncestorContext = require('react-native-web/dist/exports/Text/TextAncestorContext').default;
			return <TextAncestorContext.Provider value={true}>{textEl}</TextAncestorContext.Provider>;
		}

		return textEl;
	};

	return isLinkMode
		? getButton()
		: (
			<View style={styles.container}>
				{getButton()}
				{isFollowing && follow?.deadLastStarted && (
					<View style={styles.statusBadge}>
						<Ionicons name="flag" size={12} color={colors.warning} />
						<Text style={[styles.statusText, themedStyles.statusText]}>DLS</Text>
					</View>
				)}
			</View>
		);
}

