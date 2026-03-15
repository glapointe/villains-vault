/**
 * EventSubmissionPanel Component Styles
 * 
 * Theme-aware styles for event submission panel component
 * Uses design tokens from theme for consistent styling
 */

import { StyleSheet } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base event submission panel structure (theme-independent)
 */
export const styles = StyleSheet.create({
	centerContent: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	stepContainer: {
		paddingBottom: spacing.md,
	},
	stepTitle: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.semibold,
		marginBottom: spacing.xs,
	},
	stepDescription: {
		fontSize: typography.fontSize.sm,
		marginBottom: spacing.md,
		lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
	},
	label: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.semibold,
		marginBottom: spacing.xs,
	},
	input: {
		borderWidth: 1,
		borderRadius: borderRadius.sm,
		padding: spacing.sm,
		marginBottom: spacing.sm,
		fontSize: typography.fontSize.sm,
	},
	urlSection: {
		flexDirection: 'row',
		borderWidth: 1,
		borderRadius: borderRadius.sm,
		padding: spacing.sm,
		gap: spacing.xs,
		alignItems: 'center',
	},
	urlInput: {
		flex: 1,
		fontSize: typography.fontSize.sm - 1,
		padding: 0,
	},
	reparseButton: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.xs,
		borderRadius: borderRadius.sm,
		justifyContent: 'center',
		alignItems: 'center',
	},
	racesSection: {
		marginTop: spacing.md,
		marginBottom: spacing.md,
	},
	raceCard: {
		borderWidth: 1,
		borderRadius: borderRadius.md,
		padding: spacing.md,
		marginBottom: spacing.sm,
		position: 'relative',
	},
	existingBadge: {
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs / 1.5,
		borderRadius: borderRadius.sm,
		marginBottom: spacing.sm,
		alignSelf: 'flex-start',
	},
	existingBadgeText: {
		fontSize: typography.fontSize.xs,
		fontWeight: typography.fontWeight.semibold,
	},
	dateButton: {
		borderWidth: 1,
		borderRadius: borderRadius.sm,
		padding: spacing.sm,
		marginBottom: spacing.sm,
		justifyContent: 'center',
	},
	pickerContainer: {
		borderWidth: 1,
		borderRadius: borderRadius.sm,
		marginBottom: spacing.sm,
		overflow: 'hidden',
	},
	picker: {
		height: 50,
	},
	raceActions: {
		flexDirection: 'row',
		gap: spacing.xs,
		marginTop: spacing.sm,
		alignItems: 'center',
        justifyContent: 'space-between',
	},
	notesButton: {
		flex: 1,
		borderRadius: borderRadius.sm,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
		justifyContent: 'center',
		alignItems: 'center',
	},
	removeButton: {
		borderRadius: borderRadius.sm,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
		minWidth: 80,
	},
	addRaceButton: {
		marginBottom: spacing.sm,
	},
	distanceScrollView: {
		marginBottom: spacing.sm,
	},
	distanceContainer: {
		flexDirection: 'row',
		gap: spacing.xs,
		paddingVertical: spacing.xs,
	},
	distanceButton: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderRadius: borderRadius.md / 1.5,
		borderWidth: 1,
		minWidth: 100,
		alignItems: 'center',
		justifyContent: 'center',
	},
	footerActions: {
		flexDirection: 'row',
		gap: spacing.sm,
		width: '100%',
	},
	backButton: {
		flex: 0.4,
	},
	submitButton: {
		flex: 0.6,
	},
});

/**
 * Theme-aware styles for EventSubmissionPanel
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	stepTitle: {
		color: colors.textPrimary,
	},
	stepDescription: {
		color: colors.textSecondary,
	},
	label: {
		color: colors.textPrimary,
	},
	input: {
		borderColor: colors.border,
		backgroundColor: colors.surface,
		color: colors.textPrimary,
	},
	urlSection: {
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	urlInput: {
		color: colors.textPrimary,
	},
	reparseButton: {
		backgroundColor: colors.buttonSecondary,
	},
	raceCard: {
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	existingBadge: {
		backgroundColor: colors.warning,
	},
	existingBadgeText: {
		color: colors.textInverse,
	},
	dateButton: {
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	pickerContainer: {
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	notesButton: {
		backgroundColor: colors.buttonSecondary,
	},
	distanceButton: {
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	distanceButtonSelected: {
		borderColor: colors.primary,
		backgroundColor: colors.primarySubtle,
	},
});
