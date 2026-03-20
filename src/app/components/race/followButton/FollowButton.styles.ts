/**
 * FollowButton Component Styles
 * 
 * Theme-aware styles for the follow/unfollow button on race results.
 * Uses design tokens from theme for consistent styling.
 */

import { StyleSheet, Platform } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base styles (theme-independent structure)
 */
export const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
	},
	followButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderRadius: borderRadius.md,
		borderWidth: 1,
		...Platform.select({
			web: {
				display: 'flex',
				cursor: 'pointer',
			} as any,
			default: {},
		}),
	},
	followLink: {
		...Platform.select({
			web: { 
				cursor: 'pointer',
				display: 'inline',
			} as any,
			default: {},
		}),
	},
	followButtonText: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.semibold,
	},
	followLinkText: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.semibold,
	},
	dialogContent: {
		gap: spacing.md,
	},
	dialogDescription: {
		fontSize: typography.fontSize.base,
		lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
	},
	dialogSection: {
		gap: spacing.sm,
	},
	dialogSectionLabel: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.semibold,
	},
	typeOption: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
		borderRadius: borderRadius.md,
		borderWidth: 1,
		...Platform.select({
			web: { cursor: 'pointer' } as any,
			default: {},
		}),
	},
	typeOptionContent: {
		flex: 1,
	},
	typeOptionLabel: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.semibold,
	},
	typeOptionDescription: {
		fontSize: typography.fontSize.xs,
		lineHeight: typography.fontSize.xs * typography.lineHeight.relaxed,
		marginTop: 2,
	},
	dlsContainer: {
		paddingTop: spacing.xs,
	},
	statusBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
	},
	statusText: {
		fontSize: typography.fontSize.xs,
		fontWeight: typography.fontWeight.medium,
	},
});

/**
 * Theme-aware styles
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	followButton: {
		backgroundColor: colors.buttonGhost,
		borderColor: colors.border,
	},
	followLink: {
		color: colors.primary,
		backgroundColor: 'transparent',
		borderColor: 'transparent',
	},	
	followButtonFollowing: {
		backgroundColor: colors.primarySubtle ?? colors.infoSubtle,
		borderColor: colors.primary,
	},
	followButtonClaimed: {
		backgroundColor: colors.successSubtle,
		borderColor: colors.success,
	},
	followButtonHover: {
		opacity: 0.8,
	},
	followLinkHover: {
		color: colors.primaryHover,
		...Platform.select({
			web: {
				textDecorationLine: 'underline',
			} as any,
			default: {},
		}),
	},
	followButtonText: {
		color: colors.textPrimary,
	},
	followLinkText: {
		color: colors.primary,	
	},
	followButtonTextFollowing: {
		color: colors.primary,
	},
	followButtonTextClaimed: {
		color: colors.success,
	},
	dialogDescription: {
		color: colors.textSecondary,
	},
	dialogSectionLabel: {
		color: colors.textPrimary,
	},
	typeOption: {
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	typeOptionSelected: {
		borderColor: colors.primary,
		backgroundColor: colors.infoSubtle,
	},
	typeOptionLabel: {
		color: colors.textPrimary,
	},
	typeOptionDescription: {
		color: colors.textSecondary,
	},
	statusText: {
		color: colors.textSecondary,
	},
});
