/**
 * RaceResultsGrid Styles
 * 
 * Styles for the race results grid component with theme support.
 */

import { StyleSheet, Platform } from 'react-native';
import { spacing, typography, borderRadius } from '../../../theme';
import type { ThemeColors } from '../../../theme';

export const createStyles = (colors: ThemeColors, isDark: boolean, windowWidth: number = 1024) => StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'transparent',
	},

	// Filter Section Styles
	filterContainer: {
		padding: spacing.md,
		backgroundColor: colors.surface,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
        marginBottom: spacing.md,
	},

	filterWrapper: {
		width: '100%',
	},

	filterRow: {
		flexDirection: 'row',
		gap: spacing.md,
		flexWrap: 'wrap',
		alignItems: 'flex-end',
	},

	filterNote: {
		marginTop: spacing.sm,
		fontSize: typography.fontSize.sm,
		color: colors.textSecondary,
	},

	filterGroup: {
		minWidth: 150,
		maxWidth: 200,
		flex: 1,
	},

	searchGroup: {
		minWidth: 250,
		flex: 2,
	},

	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
	},

	filterLabel: {
		fontSize: typography.fontSize.sm,
		fontWeight: '500',
		color: colors.textPrimary,
		marginBottom: spacing.sm,
	},

	searchInput: {
		maxWidth: windowWidth < 400 ? 150 : undefined,
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

	exportButton: {
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: borderRadius.md,
		paddingHorizontal: spacing.sm + 4,
		paddingVertical: spacing.sm + 2,
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 38,
		minWidth: 42,
		backgroundColor: colors.surface,
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
				// Web: grow only to content size, no forced min height
				minHeight: 110,
			},
			default: {
				// Mobile: maintain flex behavior for proper fill
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
		width: 17, // Approximate scrollbar width
		backgroundColor: colors.surface,
	},

	bodyVerticalScroll: {
		flex: 1,
		minHeight: 45, // Ensure minimum scrollable height
		...Platform.select({
			web: {
				// Web: Force the horizontal and vertical scrollbar to be visible
				overflowX: 'auto',
			},
		}),
	},

	bodyHorizontalScroll: {
		flexGrow: 0,
		...Platform.select({
			web: {
				// Web: Hide the inner scrollbar so we only see the two on the outer scroll container.
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
		minWidth: 80,
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

	tableRowClickable: {
		...Platform.select({
			web: {
				cursor: 'pointer',
			},
			default: {},
		}),
	},

	tableRowAlternate: {
		backgroundColor: colors.surface,
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

	tableCell: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm + 4,
		borderRightWidth: 1,
		borderRightColor: colors.border,
		minWidth: 80,
		justifyContent: 'center',
	},

	tableCellText: {
		fontSize: typography.fontSize.sm,
		color: colors.textPrimary,
	},
    tableCellTextRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center'
    },

	// Column Width Variants

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

	// Hide on very small screens
	pageInfoHideMobile: {
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
 * Column width configuration based on column type
 */
export const getColumnWidth = (column: string): number => {
	// Narrow columns
	if (['OverallPlace', 'DivisionPlace', 'GenderPlace', 'Age', 'BibNumber', 'Passes', 'Passers'].includes(column)) {
		return 80;
	}
	
	// Wide columns
	if (['Name', 'Hometown'].includes(column)) {
		return 200;
	}
	
	// Time columns
	if (['TimeDifference', 'StartTime', 'NetTime', 'ClockTime', 'OverallPace'].includes(column) || column.startsWith('Split')) {
		return 100;
	}
	
	// Default
	return 120;
};
