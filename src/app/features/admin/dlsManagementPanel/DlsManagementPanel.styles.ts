/**
 * DlsManagementPanel Component Styles
 * 
 * Theme-aware styles for DLS race management panel component.
 * Uses design tokens from theme for consistent styling.
 */

import { StyleSheet, Platform } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Base DLS management panel structure (theme-independent)
 */
export const styles = StyleSheet.create({
	container: {
		paddingHorizontal: spacing.md,
	},
	sectionHeader: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.sm,
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: spacing.md,
	},
	sectionTitle: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.semibold,
	},
	raceCard: {
		padding: spacing.md,
		borderRadius: borderRadius.md,
		marginBottom: spacing.sm,
	},
	raceHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: spacing.xs,
	},
	raceName: {
		fontSize: typography.fontSize.md,
		fontWeight: typography.fontWeight.semibold,
		flex: 1,
	},
	raceDate: {
		fontSize: typography.fontSize.sm,
		marginBottom: spacing.sm,
	},
	declarationCount: {
		fontSize: typography.fontSize.sm,
		marginBottom: spacing.sm,
	},
	formGroup: {
		marginBottom: spacing.md,
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
		fontSize: typography.fontSize.md,
		minHeight: 40,
		minWidth: 120,
	},
	dateButton: {
		borderWidth: 1,
		borderRadius: borderRadius.sm,
		padding: spacing.sm,
		marginBottom: spacing.sm,
		justifyContent: 'center',
	},
	textArea: {
		borderWidth: 1,
		borderRadius: borderRadius.sm,
		padding: spacing.sm,
		fontSize: typography.fontSize.md,
		minHeight: 80,
		textAlignVertical: 'top',
	},
	buttonRow: {
		flexDirection: 'row',
		gap: spacing.sm,
		marginTop: spacing.md,
	},
	declarationRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: spacing.xs,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	declarationInfo: {
		flex: 1,
	},
	declarationBib: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.semibold,
	},
	declarationUser: {
		fontSize: typography.fontSize.xs,
	},
	declarationBadges: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.xxs,
		marginTop: spacing.xxs,
	},
	declarationBadge: {
		fontSize: typography.fontSize.xxs,
		fontWeight: typography.fontWeight.medium,
		paddingHorizontal: spacing.xs,
		paddingVertical: 2,
		borderRadius: borderRadius.sm,
		overflow: 'hidden',
	},
	declarationComment: {
		fontSize: typography.fontSize.xs,
		fontStyle: 'italic',
		marginTop: spacing.xxs,
	},
	emptyText: {
		fontSize: typography.fontSize.sm,
		textAlign: 'center',
		paddingVertical: spacing.lg,
	},
	processSection: {
		marginTop: spacing.md,
		padding: spacing.md,
		borderRadius: borderRadius.md,
		borderWidth: 1,
	},
	yearFilterRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.xs,
		marginBottom: spacing.md,
	},
	yearChip: {
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xxs,
		borderRadius: borderRadius.full,
		borderWidth: 1,
	},
	yearChipText: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.medium,
	},
	// ── Import modal ─────────────────────────────────────────────────
	importOverlay: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0,0,0,0.5)',
	},
	importDialog: {
		// width: Platform.OS === 'web' ? 480 : '90%',
		minWidth: 300,
		maxWidth: 500,
		marginHorizontal: spacing.md,
		borderRadius: borderRadius.lg,
		padding: spacing.lg,
		gap: spacing.md,
	},
	importTitle: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.semibold,
		marginBottom: spacing.xs,
	},
	importHint: {
		fontSize: typography.fontSize.sm,
		lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
	},
	importTag: {
		fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier New',
		fontSize: typography.fontSize.xs,
	},
	importFileRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		marginTop: spacing.xs,
	},
	importFileName: {
		flex: 1,
		fontSize: typography.fontSize.sm,
	},
	importPreview: {
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
		borderRadius: borderRadius.sm,
		borderWidth: 1,
		maxHeight: 100,
	},
	importPreviewText: {
		fontSize: typography.fontSize.sm,
	},
	importWarning: {
		fontSize: typography.fontSize.xs,
		fontStyle: 'italic',
	},
	importButtonRow: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: spacing.sm,
		marginTop: spacing.xs,
	},
	// ── Declaration highlight (left border after import) ─────────────
	declarationRowNew: {
		borderLeftWidth: 3,
		paddingLeft: spacing.sm,
	},
	declarationRowUpdated: {
		borderLeftWidth: 3,
		paddingLeft: spacing.sm,
	},
});

/**
 * Themed DLS management panel styles (color-dependent)
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	raceCard: {
		backgroundColor: colors.surface,
		borderColor: colors.border,
		borderWidth: 1,
	},
	raceName: {
		color: colors.textPrimary,
	},
	raceDate: {
		color: colors.textSecondary,
	},
	declarationCount: {
		color: colors.textTertiary,
	},
	sectionTitle: {
		color: colors.textPrimary,
	},
	label: {
		color: colors.textSecondary,
	},
	input: {
		borderColor: colors.border,
		color: colors.textPrimary,
		backgroundColor: colors.background,
	},
	textArea: {
		borderColor: colors.border,
		color: colors.textPrimary,
		backgroundColor: colors.background,
	},
	declarationRow: {
		borderBottomColor: colors.borderLight,
	},
	declarationBib: {
		color: colors.textPrimary,
	},
	declarationUser: {
		color: colors.textSecondary,
	},
	declarationBadgeFirst: {
		color: colors.info,
		backgroundColor: colors.infoSubtle,
	},
	declarationBadgeKills: {
		color: colors.warning,
		backgroundColor: colors.warningSubtle,
	},
	declarationComment: {
		color: colors.textTertiary,
	},
	emptyText: {
		color: colors.textTertiary,
	},
	processSection: {
		borderColor: colors.border,
		backgroundColor: colors.surfaceElevated,
	},
	yearChip: {
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	yearChipActive: {
		borderColor: colors.primary,
		backgroundColor: colors.primary,
	},
	yearChipText: {
		color: colors.textSecondary,
	},
	yearChipTextActive: {
		color: colors.textInverse,
	},
	// ── Import modal ─────────────────────────────────────────────────
	importDialog: {
		backgroundColor: colors.surfaceElevated,
		shadowColor: colors.textPrimary,
	},
	importTitle: {
		color: colors.textPrimary,
	},
	importHint: {
		color: colors.textSecondary,
	},
	importTag: {
		color: colors.primary,
	},
	importFileName: {
		color: colors.textSecondary,
	},
	importPreview: {
		backgroundColor: colors.surface,
		borderColor: colors.border,
	},
	importPreviewText: {
		color: colors.textPrimary,
	},
	importWarning: {
		color: colors.warning,
	},
	// ── Declaration highlight ─────────────────────────────────────────
	declarationRowNew: {
		borderLeftColor: colors.success,
	},
	declarationRowUpdated: {
		borderLeftColor: colors.warning,
	},
});
