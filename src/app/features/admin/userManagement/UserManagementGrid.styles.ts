/**
 * UserManagementGrid Styles
 * 
 * Styles for the user management grid component.
 * Uses createStyles factory pattern (like RaceResultsGrid) since it needs
 * window width for responsive behavior along with theme colors.
 */

import { StyleSheet, Platform } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

/**
 * Create styles with theme colors and responsive width
 */
export const createStyles = (colors: ThemeColors, isDark: boolean, windowWidth: number = 1024) => StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'transparent',
	},

	// Back navigation
	backButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
		paddingVertical: spacing.sm,
		alignSelf: 'flex-start',
	},
	backButtonText: {
		fontSize: typography.fontSize.sm,
		color: colors.primary,
		fontWeight: typography.fontWeight.medium,
	},

	// Header section
	title: {
		fontSize: typography.fontSize['2xl'],
		fontWeight: typography.fontWeight.bold,
		color: colors.textPrimary,
		marginBottom: spacing.xs,
	},
	subtitle: {
		fontSize: typography.fontSize.sm,
		color: colors.textSecondary,
	},
	contentBody: {
		paddingHorizontal: spacing.md,
		flex: 1,
	},
	// Filter / Search Section
	filterContainer: {
		padding: spacing.md,
		backgroundColor: colors.surface,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
		marginBottom: spacing.md,
	},
	filterRow: {
		flexDirection: 'row',
		gap: spacing.md,
		flexWrap: 'wrap',
		alignItems: 'flex-end',
	},
	searchGroup: {
		minWidth: 250,
		flex: 2,
	},
	filterLabel: {
		fontSize: typography.fontSize.sm,
		fontWeight: '500',
		color: colors.textPrimary,
		marginBottom: spacing.sm,
	},
	searchInput: {
		maxWidth: windowWidth < 400 ? 200 : undefined,
		flex: 1,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: borderRadius.md,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm + 2,
		fontSize: typography.fontSize.sm,
		color: colors.textPrimary,
		backgroundColor: colors.surface,
	},

	// Selection Toolbar
	toolbar: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.sm,
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		backgroundColor: colors.primarySubtle ?? colors.surfaceElevated,
		borderWidth: 1,
		borderColor: colors.primary,
		borderRadius: borderRadius.md,
		marginBottom: spacing.sm,
	},
	toolbarLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
	},
	toolbarText: {
		fontSize: typography.fontSize.sm,
		fontWeight: typography.fontWeight.medium,
		color: colors.textPrimary,
	},
	toolbarActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
	},

	// Loading State
	loadingContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: spacing['2xl'],
	},

	// Table Styles
	tableOuterContainer: {
		...Platform.select({
			web: {
				minHeight: 110,
			},
			default: {
				flex: 1,
				minHeight: 400,
			},
		}),
		borderWidth: 1,
		borderColor: colors.border,
		borderTopLeftRadius: borderRadius.md,
		borderTopRightRadius: borderRadius.md,
		overflow: 'hidden',
	},
	headerContainer: {
		flexDirection: 'row',
		backgroundColor: colors.surface,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	headerScrollContainer: {
		flex: 1,
	},
	scrollbarSpacer: {
		width: 17,
		backgroundColor: colors.surface,
	},
	bodyVerticalScroll: {
		flex: 1,
		minHeight: 45,
		...Platform.select({
			web: {
				overflowX: 'auto',
			},
		}),
	},
	bodyHorizontalScroll: {
		flexGrow: 0,
		...Platform.select({
			web: {
				overflowX: 'visible',
				overflowY: 'visible',
			},
		}),
	},

	// Header Styles
	tableHeader: {
		flexDirection: 'row',
		backgroundColor: colors.surfaceElevated,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	headerCell: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm + 4,
		borderRightWidth: 1,
		borderRightColor: colors.border,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	headerCellText: {
		fontSize: typography.fontSize.sm,
		fontWeight: '600',
		color: colors.textPrimary,
		flex: 1,
	},
	sortIndicator: {
		fontSize: typography.fontSize.xs,
		color: colors.primary,
		marginLeft: spacing.xs,
	},

	// Row Styles
	tableRow: {
		flexDirection: 'row',
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
		backgroundColor: colors.background,
	},
	tableRowAlternate: {
		backgroundColor: colors.surface,
	},
	tableRowClickable: {
		...Platform.select({
			web: {
				cursor: 'pointer',
			},
			default: {},
		}),
	},
	tableRowHover: {
		backgroundColor: colors.surfaceElevated,
		...Platform.select({
			web: {
				boxShadow: `0 0px 12px ${colors.rowHighlightOverlay}`,
				zIndex: 1,
			},
			default: {},
		}),
	},
	tableRowSelected: {
		backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
		borderLeftWidth: 3,
		borderLeftColor: colors.primary,
	},
	tableCell: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm + 4,
		borderRightWidth: 1,
		borderRightColor: colors.border,
		justifyContent: 'center',
	},
	tableCellText: {
		fontSize: typography.fontSize.sm,
		color: colors.textPrimary,
	},

	// Admin badge
	adminBadge: {
		backgroundColor: colors.primarySubtle ?? colors.surfaceElevated,
		paddingHorizontal: spacing.sm,
		paddingVertical: 2,
		borderRadius: borderRadius.sm,
		alignSelf: 'flex-start',
	},
	adminBadgeText: {
		fontSize: typography.fontSize.xs,
		fontWeight: typography.fontWeight.semibold,
		color: colors.primary,
	},
	nonAdminText: {
		fontSize: typography.fontSize.xs,
		color: colors.textTertiary,
	},

	// Empty State
	emptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: spacing['2xl'],
	},
	emptyText: {
		fontSize: typography.fontSize.base,
		color: colors.textSecondary,
		textAlign: 'center',
	},

	// Status Bar (Bottom Pagination)
	statusBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: spacing.sm + 4,
		backgroundColor: colors.surfaceElevated,
		borderTopWidth: 1,
		borderTopColor: colors.border,
		gap: spacing.sm,
		borderBottomLeftRadius: borderRadius.md,
		borderBottomRightRadius: borderRadius.md,
	},
	statusBarLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		flexShrink: 1,
	},
	pageSizeContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
	},
	pageSizeLabel: {
		fontSize: typography.fontSize.sm,
		color: colors.textPrimary,
		fontWeight: '500',
	},
	pageSizeDropdown: {
		minWidth: 70,
		maxWidth: 80,
	},
	paginationControls: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
	},
	pageButton: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderRadius: borderRadius.sm,
		minWidth: 40,
		alignItems: 'center',
		backgroundColor: colors.surface,
	},
	pageButtonActive: {
		backgroundColor: colors.primary,
	},
	pageButtonDisabled: {
		backgroundColor: colors.surfaceElevated,
	},
	pageButtonText: {
		fontSize: typography.fontSize.sm,
		fontWeight: '600',
	},
	pageButtonTextActive: {
		color: colors.textInverse,
	},
	pageButtonTextDisabled: {
		color: colors.textDisabled,
	},
	pageInfo: {
		fontSize: typography.fontSize.sm,
		color: colors.textPrimary,
		fontWeight: '500',
		minWidth: 50,
		textAlign: 'center',
	},
	totalCountText: {
		fontSize: typography.fontSize.sm,
		color: colors.textSecondary,
		fontWeight: '500',
		flexShrink: 0,
	},
});

/**
 * Column width configuration for user grid
 */
export const getUserColumnWidth = (column: string): number => {
	switch (column) {
		case 'email':
			return 260;
		case 'displayName':
			return 200;
		case 'isAdmin':
			return 100;
		case 'createdAt':
			return 160;
		default:
			return 150;
	}
};
