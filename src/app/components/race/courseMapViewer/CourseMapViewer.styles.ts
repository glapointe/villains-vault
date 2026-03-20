/**
 * CourseMapViewer Styles
 *
 * Styles for the course map thumbnail and full-screen lightbox modal.
 */

import { StyleSheet } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';
import { EdgeInsets } from 'react-native-safe-area-context';

/** Height used for the inline thumbnail — width is computed from aspectRatio at runtime */
export const THUMBNAIL_HEIGHT = 75;

/** Height of the lightbox card header row. */
export const HEADER_HEIGHT = 52;

/**
 * Computes fixed lightbox card dimensions from the current window size.
 * Call this inside the component with values from useWindowDimensions() so
 * the dialog resizes correctly on device rotation.
 */
export function getCardDimensions(winWidth: number, winHeight: number, insets: EdgeInsets) {
	const cardWidth = Math.min((winWidth - insets.left - insets.right) * 0.92, 720);
	const cardHeight = Math.min((winHeight - insets.top - insets.bottom) * 0.85, 600);
	const bodyHeight = cardHeight - HEADER_HEIGHT;
	return { cardWidth, cardHeight, bodyHeight };
}

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
	},
	overlayBackdrop: {
		...StyleSheet.absoluteFillObject,
	},
	card: {
		// width/height applied as live inline styles via useWindowDimensions() in the component.
		borderRadius: borderRadius.lg,
		borderWidth: 1,
		overflow: 'hidden',
		flexDirection: 'column',
	},
	cardHeader: {
		height: HEADER_HEIGHT,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderBottomWidth: 1,
	},
	/** Clips zoomed/panned content - width/height injected inline at render time. */
	imageBody: {
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
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

