/**
 * Rich Text Dialog Component Styles (Web)
 *
 * Theme-aware styles for web rich text dialog component
 */

import type { CSSProperties } from 'react';
import type { ThemeColors } from '../../../theme';

export type WebRichTextStyles = Record<string, CSSProperties>;

/**
 * Base rich text dialog structure (theme-independent)
 */
export const baseStyles: WebRichTextStyles = {
	container: {
		marginTop: 16,
	},
	toolbar: {
		display: 'flex',
		gap: 8,
		flexWrap: 'wrap',
		marginBottom: 12,
		paddingBottom: 12,
	},
	button: {
		padding: '6px 12px',
		borderRadius: '4px',
		cursor: 'pointer',
		fontSize: '12px',
		fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
	},
	buttonBold: {
		fontWeight: 'bold',
	},
	buttonItalic: {
		fontStyle: 'italic',
	},
	buttonUnderline: {
		textDecoration: 'underline',
	},
	editor: {
		minHeight: 150,
		maxHeight: 250,
		padding: 12,
		borderRadius: 6,
		fontSize: 14,
		overflow: 'auto',
		fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
		outline: 'none',
	},
	charCountContainer: {
		marginTop: 8,
		textAlign: 'right',
	},
	charCount: {
		fontSize: 12,
	},
};

/**
 * Theme-aware styles for RichTextDialog
 */
export const getThemedStyles = (colors: ThemeColors): WebRichTextStyles => ({
	toolbar: {
		borderBottom: `1px solid ${colors.border}`,
	},
	button: {
		border: `1px solid ${colors.border}`,
		backgroundColor: colors.surface,
		color: colors.textPrimary,
	},
	editor: {
		backgroundColor: colors.surfaceElevated,
		color: colors.textPrimary,
		border: `1px solid ${colors.border}`,
	},
	charCount: {
		color: colors.textSecondary,
	},
});
