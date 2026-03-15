/**
 * CourseMapPanel Component Styles
 *
 * Theme-aware styles for the course map image management panel.
 * Uses design tokens from theme for consistent styling.
 */

import { StyleSheet } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base course map panel structure (theme-independent)
 */
export const styles = StyleSheet.create({
	scrollContent: {
		paddingBottom: spacing.xl,
	},
	headerSection: {
		marginBottom: spacing.lg,
	},
	description: {
		fontSize: typography.fontSize.sm,
		lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
		marginBottom: spacing.md,
	},
	uploadRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.md,
		marginBottom: spacing.sm,
	},
	uploadingRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		marginTop: spacing.sm,
	},
	uploadingText: {
		fontSize: typography.fontSize.sm,
		fontStyle: 'italic',
	},

	// Current image section
	currentMapSection: {
		marginBottom: spacing.lg,
	},
	sectionTitle: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.semibold,
		marginBottom: spacing.sm,
	},
	imageCard: {
		borderRadius: borderRadius.md,
		overflow: 'hidden',
		borderWidth: 1,
	},
	thumbnail: {
		width: '100%',
		aspectRatio: 16 / 9,
		resizeMode: 'contain',
	},
	imageActions: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		padding: spacing.sm,
		gap: spacing.sm,
	},
	uploadedAt: {
		fontSize: typography.fontSize.xs,
		paddingHorizontal: spacing.sm,
		paddingBottom: spacing.sm,
	},

	// Empty state
	emptyState: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: spacing.xl,
	},
	emptyText: {
		fontSize: typography.fontSize.base,
		textAlign: 'center',
	},
	emptySubtext: {
		fontSize: typography.fontSize.sm,
		textAlign: 'center',
		marginTop: spacing.xs,
	},
});

/**
 * Theme-dependent styles for CourseMapPanel
 */
export const getThemedStyles = (colors: ThemeColors) =>
	StyleSheet.create({
		description: {
			color: colors.textSecondary,
		},
		sectionTitle: {
			color: colors.textPrimary,
		},
		imageCard: {
			borderColor: colors.border,
			backgroundColor: colors.surface,
		},
		imageActions: {
			borderTopColor: colors.border,
			borderTopWidth: 1,
		},
		uploadedAt: {
			color: colors.textTertiary,
		},
		emptyText: {
			color: colors.textSecondary,
		},
		emptySubtext: {
			color: colors.textTertiary,
		},
		uploadingText: {
			color: colors.textSecondary,
		},
	});
