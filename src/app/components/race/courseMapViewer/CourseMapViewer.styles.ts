/**
 * CourseMapViewer Styles
 *
 * Styles for the course map thumbnail and full-screen lightbox modal.
 */

import { StyleSheet, Dimensions } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/** Height used for the inline thumbnail — width is computed from aspectRatio at runtime */
export const THUMBNAIL_HEIGHT = 75;

/**
 * Theme-independent structural styles
 */
export const styles = StyleSheet.create({
	thumbnailWrapper: {
		height: THUMBNAIL_HEIGHT,
		borderRadius: borderRadius.sm,
		borderWidth: 1,
		overflow: 'hidden',
		flexShrink: 0,
	},
	thumbnailPressed: {
		opacity: 0.75,
	},
	thumbnail: {
		width: '100%',
		height: '100%',
	},

	// Lightbox
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.8)',
		alignItems: 'center',
		justifyContent: 'center',
		padding: spacing.lg,
	},
	card: {
		borderRadius: borderRadius.lg,
		borderWidth: 1,
		overflow: 'hidden',
		width: Math.min(Dimensions.get('window').width * 0.92, 900),
		maxHeight: Math.min(Dimensions.get('window').height * 0.88, 900),
		flexDirection: 'column',
	},
	cardHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderBottomWidth: 1,
	},
	cardTitle: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.semibold,
	},
	cardControls: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
	},
	zoomButton: {
		width: 32,
		height: 32,
		borderRadius: borderRadius.sm,
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	zoomButtonText: {
		fontSize: typography.fontSize.lg,
		lineHeight: typography.fontSize.lg * typography.lineHeight.normal,
		fontWeight: typography.fontWeight.bold,
	},
	closeButton: {
		width: 32,
		height: 32,
		borderRadius: borderRadius.sm,
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: spacing.xs,
	},
	closeText: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.bold,
		lineHeight: typography.fontSize.base * typography.lineHeight.normal,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	fullImage: {
		width: Math.min(Dimensions.get('window').width * 0.92, 900),
		height: Math.min(Dimensions.get('window').width * 0.92, 900) / (16 / 9),
	},
});

/**
 * Theme-aware colour styles
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	thumbnailWrapper: {
		borderColor: colors.border,
	},
	card: {
		backgroundColor: colors.surface,
		borderColor: colors.border,
	},
	cardHeader: {
		backgroundColor: colors.surfaceElevated,
		borderBottomColor: colors.border,
	},
	cardTitle: {
		color: colors.textPrimary,
	},
	zoomButton: {
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	zoomButtonText: {
		color: colors.textPrimary,
	},
	closeButton: {
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	closeText: {
		color: colors.textPrimary,
	},
});
