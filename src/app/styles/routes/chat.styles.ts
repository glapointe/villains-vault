/**
 * Chat Route Styles
 *
 * Theme-aware styles for the chat page.
 * Full-height layout that fills the available tab content area.
 */

import { StyleSheet, Platform } from 'react-native';
import { spacing, borderRadius, shadows } from '../../theme';
import type { ThemeColors } from '../../theme';

/**
 * Base chat page structure (theme-independent)
 */
export const styles = StyleSheet.create({
	container: {
		flex: 1,
		maxWidth: 900,
		width: '100%',
		alignSelf: 'center',
	},
	chatWrapper: {
		flex: 1,
		borderRadius: borderRadius.lg,
		overflow: 'hidden',
		marginHorizontal: spacing.sm,
		marginBottom: spacing.sm,
		...shadows.md,
	},
});

/**
 * Theme-aware styles
 */
export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	chatWrapper: {
		backgroundColor: colors.surface,
		borderWidth: Platform.OS === 'web' ? 1 : 0,
		borderColor: colors.border,
	},
});
