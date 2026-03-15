import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TextInput, ActivityIndicator, TouchableOpacity, Pressable, useWindowDimensions, Platform } from 'react-native';
import type { ScrollView as ScrollViewType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Dropdown } from '../../ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { useDialog } from '../../../contexts/DialogContext';
import { getThemedColors } from '../../../theme';
import { createStyles, getColumnWidth } from './RaceResultsGrid.styles';
import type {
    Race,
    RaceResult,
    RaceResultColumn,
    SortDirection,
    Division,
    RaceResultWithProximity,
    Gender
} from '../../../models';
import { Gender as GenderEnum } from '../../../models';
import { api } from '../../../services/api';

/**
 * Props for RaceResultsGrid component
 */
interface RaceResultsGridProps {
	/**
	 * Race object containing ID and metadata
	 */
    race: Race;

	/**
	 * Optional divisions array
	 * If not provided, will be loaded from the server
	 */
    divisions?: Division[];

	/**
	 * Optional pre-loaded results for client-side mode
	 * If provided, all paging/sorting/filtering happens in memory
	 * If not provided, data is fetched from server with server-side operations
	 */
    results?: RaceResult[] | RaceResultWithProximity[];

	/**
	 * Initial page size (default: 50)
	 */
    initialPageSize?: number;

	/**
	 * Available page size options (default: [25, 50, 100])
	 */
    pageSizeOptions?: number[];

    /**
     * Optional default sort field (default: OverallPlace)
     */
    defaultSortField?: RaceResultColumn;

    /**
     * Whether to hide filters and search bar (default: false)
     */
    hideFilters?: boolean;

    /**
     * Whether to hide pagination controls and results count (default: false)
     */
    hideStatusBar?: boolean;

    /**
     * Optional flag to disable sorting functionality (default: false)
     */
    disableSorting?: boolean;

    onResultPress?: (result: RaceResult | RaceResultWithProximity) => void;

	/**
	 * Optional result to compare against (enables compare mode)
	 * When provided, shows proximity information to this result
	 */
    compareResult?: RaceResult;

	/**
	 * Type of comparison (start times or finish times)
	 * Only used when compareResult is provided
	 */
    compareType?: 'start' | 'finish';
}

/**
 * Race Results Grid Component
 * 
 * Displays race results in a sortable, filterable, paginated grid.
 * Supports three modes:
 * - Client-side: Pass results array for in-memory operations
 * - Server-side: Omit results to fetch and process data server-side
 * - Compare mode: Pass compareResult and compareResults to show proximity information
 */
export const RaceResultsGrid: React.FC<RaceResultsGridProps> = ({
    race,
    divisions: providedDivisions,
    results: providedResults,
    initialPageSize = 50,
    pageSizeOptions = [25, 50, 100],
    defaultSortField = 'OverallPlace' as RaceResultColumn,
    hideFilters = false,
    hideStatusBar = false,
    disableSorting = false,
    onResultPress,
    compareResult,
    compareType = 'finish'
}) => {
    const { isDark } = useTheme();
    const colors = getThemedColors(isDark);
    const { width, height } = useWindowDimensions();
    const styles = useMemo(() => createStyles(colors, isDark, width), [colors, isDark, width]);
    const headerScrollRef = useRef<ScrollViewType>(null);
    const { showWorking, hideWorking, showAlert } = useDialog();

    // Mode detection
    const isCompareMode = compareResult !== undefined;
    const isClientSide = providedResults !== undefined || isCompareMode;

    // State for divisions
    const [divisions, setDivisions] = useState<Division[]>(providedDivisions || []);
    const [loadingDivisions, setLoadingDivisions] = useState(!providedDivisions);

    // State for server-side mode
    const [serverResults, setServerResults] = useState<RaceResult[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Shared state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [divisionFilter, setDivisionFilter] = useState<number | null>(null);
    const [genderFilter, setGenderFilter] = useState<Gender | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [sortField, setSortField] = useState<RaceResultColumn>(defaultSortField);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('detailed');

    const isRowClickable = Boolean(onResultPress);
    const isWeb = Platform.OS === 'web';

    // Load divisions if not provided
    useEffect(() => {
        if (providedDivisions) {
            setDivisions(providedDivisions);
            setLoadingDivisions(false);
            return;
        }

        const fetchDivisions = async () => {
            setLoadingDivisions(true);
            try {
                const divs = await api.raceResults.getDivisions(race.id);
                setDivisions(divs);
            } catch (error) {
                console.error('Error fetching divisions:', error);
            } finally {
                setLoadingDivisions(false);
            }
        };

        fetchDivisions();
    }, [race.id, providedDivisions]);

    // Debounce search term to avoid excessive API calls while typing
    // Only triggers after 500ms of inactivity
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        // Cleanup function: cancel the timer if searchTerm changes before 500ms
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Reset to page 1 when results change (client-side or compare mode)
    useEffect(() => {
        if (isClientSide) {
            setPage(1);
        }
    }, [providedResults, isClientSide]);

    // Map RaceResultColumn enum values to RaceResult property keys
    const columnToPropertyKey = (column: RaceResultColumn): keyof RaceResult | keyof RaceResultWithProximity => {
        const mapping: Record<RaceResultColumn, keyof RaceResult | keyof RaceResultWithProximity> = {
            'BibNumber': 'bibNumber',
            'Name': 'name',
            'Age': 'age',
            'Gender': 'gender',
            'OverallPlace': 'overallPlace',
            'DivisionPlace': 'divisionPlace',
            'GenderPlace': 'genderPlace',
            'NetTime': 'netTime',
            'ClockTime': 'clockTime',
            'StartTime': 'startTime',
            'OverallPace': 'overallPace',
            'Hometown': 'hometown',
            'Split1': 'split1',
            'Split2': 'split2',
            'Split3': 'split3',
            'Split4': 'split4',
            'Split5': 'split5',
            'Split6': 'split6',
            'Split7': 'split7',
            'Split8': 'split8',
            'Split9': 'split9',
            'Split10': 'split10',
            'Passes': 'passes',
            'Passers': 'passers',
            'TimeDifference': 'timeDifference' // Only for compare mode
        };
        return mapping[column];
    };

    // Get active columns based on race metadata and view mode
    const activeColumns = useMemo(() => {
        // Compare mode: Show specific columns for proximity comparison
        if (isCompareMode) {
            const compareColumns: RaceResultColumn[] = [
                'OverallPlace' as RaceResultColumn,
                'BibNumber' as RaceResultColumn,
                'Name' as RaceResultColumn,
            ];

            // Add time column based on compare type
            if (compareType === 'start') {
                compareColumns.push('StartTime' as RaceResultColumn);
            } else {
                compareColumns.push('NetTime' as RaceResultColumn);
            }

            compareColumns.push(
                'TimeDifference' as RaceResultColumn,
                'OverallPace' as RaceResultColumn,
                'Hometown' as RaceResultColumn
            );

            return compareColumns;
        }

        if (viewMode === 'simple') {
            // Simple view: Bib, Name, DivisionPlace (if filtered), OverallPlace (if not filtered), NetTime
            const simpleColumns: RaceResultColumn[] = [
                'BibNumber' as RaceResultColumn,
                'Name' as RaceResultColumn,
            ];

            // Add division place if filtering by division
            if (divisionFilter !== null) {
                simpleColumns.push('DivisionPlace' as RaceResultColumn);
            }

            // Add overall place if showing all results
            if (divisionFilter === null) {
                simpleColumns.push('OverallPlace' as RaceResultColumn);
            }

            simpleColumns.push('NetTime' as RaceResultColumn);
            return simpleColumns;
        }

        // Detailed view: All columns with splits between Gender and Net Time
        const columns: RaceResultColumn[] = [
            'OverallPlace' as RaceResultColumn,
            'BibNumber' as RaceResultColumn,
            'Name' as RaceResultColumn,
            'Age' as RaceResultColumn,
            'DivisionPlace' as RaceResultColumn,
            'GenderPlace' as RaceResultColumn,
        ];

        // Add split columns based on metadata (between Gender and Net Time)
        if (race.metadata?.splitTimes) {
            race.metadata.splitTimes.forEach((split, index) => {
                const splitColumn = `Split${index + 1}` as RaceResultColumn;
                columns.push(splitColumn);
            });
        }

        // Add remaining columns after splits
        columns.push(
            'StartTime' as RaceResultColumn,
            'NetTime' as RaceResultColumn,
            'ClockTime' as RaceResultColumn,
            'OverallPace' as RaceResultColumn,
            'Passes' as RaceResultColumn,
            'Passers' as RaceResultColumn,
            'Hometown' as RaceResultColumn
        );

        return columns;
    }, [race.metadata, viewMode, divisionFilter, isCompareMode, compareType]);

    // Fetch data in server-side mode
    useEffect(() => {
        if (isClientSide) return;

        const fetchResults = async () => {
            setLoading(true);
            try {
                const response = await api.raceResults.getPagedResults(race.id, {
                    divisionId: divisionFilter ?? undefined,
                    gender: genderFilter ?? undefined,
                    search: searchTerm || undefined,
                    sortBy: sortField,
                    sortDirection,
                    page,
                    pageSize
                });
                setServerResults(response.items);
                setTotalCount(response.totalCount);
            } catch (error) {
                console.error('Error fetching race results:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [isClientSide, race.id, divisionFilter, genderFilter, debouncedSearchTerm, sortField, sortDirection, page, pageSize]);

    // Client-side filtering, sorting, and paging
    const clientSideData = useMemo(() => {
        // Normal client-side mode
        if (!isClientSide || !providedResults) return { items: [], totalCount: 0, totalPages: 0 };

        let filtered = [...providedResults];

        // Apply division filter
        if (divisionFilter !== null) {
            filtered = filtered.filter(r => r.divisionId === divisionFilter);
        }

        // Apply search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(r =>
                r.bibNumber.toString().includes(search) ||
                r.name.toLowerCase().includes(search) ||
                (r.hometown?.toLowerCase().includes(search) ?? false)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            const propertyKey = columnToPropertyKey(sortField);
            let aVal: any = (a as any)[propertyKey];
            let bVal: any = (b as any)[propertyKey];

            // Handle nulls
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            // Compare values
            let comparison = 0;
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                comparison = aVal.localeCompare(bVal);
            } else if (typeof aVal === 'number' && typeof bVal === 'number') {
                comparison = aVal - bVal;
            } else {
                comparison = String(aVal).localeCompare(String(bVal));
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });

        // Calculate pagination
        const totalCount = filtered.length;
        const totalPages = Math.ceil(totalCount / pageSize);
        const startIndex = (page - 1) * pageSize;
        const items = filtered.slice(startIndex, startIndex + pageSize);

        return { items, totalCount, totalPages };
    }, [isClientSide, isCompareMode, providedResults, divisionFilter, searchTerm, sortField, sortDirection, page, pageSize]);

    // Get current data based on mode
    const displayResults = isClientSide ? clientSideData.items : serverResults;
    const displayTotalCount = isClientSide ? clientSideData.totalCount : totalCount;
    const totalPages = isClientSide
        ? clientSideData.totalPages
        : Math.ceil(totalCount / pageSize);

    // Format time span
    const formatTime = (timeSpan?: string | null): string => {
        if (!timeSpan) return '-';
        // Handle TimeSpan format (HH:MM:SS or H:MM:SS.mmm)
        const parts = timeSpan.split(':');
        if (parts.length === 3) {
            const hours = parseInt(parts[0]);
            const minutes = parts[1];
            const seconds = parts[2].split('.')[0];
            return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
        }
        return timeSpan;
    };

    // Get column header label
    const getColumnLabel = (column: RaceResultColumn): string => {
        const labels: Record<string, string> = {
            OverallPlace: 'Overall',
            BibNumber: 'Bib',
            Name: 'Name',
            Age: 'Age',
            DivisionPlace: 'Div Place',
            GenderPlace: 'Gender Place',
            NetTime: 'Net Time',
            ClockTime: 'Gun Time',
            StartTime: 'Start Time',
            OverallPace: 'Pace',
            Hometown: 'Hometown',
            Passes: 'Kills',
            Passers: 'Assassins',
            TimeDifference: 'Difference',
        };

        // Handle split columns
        if (column.startsWith('Split')) {
            const splitIndex = parseInt(column.replace('Split', '')) - 1;
            if (race.metadata?.splitTimes?.[splitIndex]) {
                const split = race.metadata.splitTimes[splitIndex];
                return split.label;
            }
        }

        return labels[column] || column;
    };

    // Handle sort column click
    // Handle division/gender filter change
    const handleDivisionChange = (value: number | string) => {
        if (value === 0 || value === 'all') {
            setDivisionFilter(null);
            setGenderFilter(null);
        } else if (value === 'men') {
            setDivisionFilter(null);
            setGenderFilter(GenderEnum.Male);
        } else if (value === 'women') {
            setDivisionFilter(null);
            setGenderFilter(GenderEnum.Female);
        } else {
            setDivisionFilter(Number(value));
            setGenderFilter(null);
        }
        setPage(1);
    };

    // Get selected division/gender value for dropdown
    const selectedDivisionValue = useMemo(() => {
        if (genderFilter === GenderEnum.Male) return 'men';
        if (genderFilter === GenderEnum.Female) return 'women';
        if (divisionFilter) return divisionFilter;
        return 0;
    }, [divisionFilter, genderFilter]);

    const handleSort = (column: RaceResultColumn) => {
        if (disableSorting) return;
        if (sortField === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(column);
            setSortDirection('asc');
        }
        setPage(1); // Reset to first page
    };

    // Handle CSV export
    const handleExport = async () => {
        try {
            showWorking({ title: 'Exporting Results', message: 'Generating CSV file...' });
            
            const blob = await api.raceResults.exportResults(race.id, {
                divisionId: divisionFilter ?? undefined,
                gender: genderFilter ?? undefined,
                search: debouncedSearchTerm || undefined,
                sortBy: sortField,
                sortDirection,
            });

            const filename = `race_${race.id}_results_${new Date().toISOString().replace('T','_').replace(/:/g, '-').slice(0, 19)}.csv`;

            if (Platform.OS === 'web') {
                // Web: Use browser download API
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else {
                // Mobile: Use FileSystem + Sharing
                // Convert blob to base64
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                await new Promise((resolve, reject) => {
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                });
                
                // Extract base64 content (remove data:text/csv;base64, prefix)
                const base64 = (reader.result as string).split(',')[1];
                
                // Write to file using new File API
                const file = new File(Paths.cache, filename);
                file.create({ overwrite: true });
                file.write(base64, { encoding: 'base64' });
                
                // Share the file (allows saving to Files, sharing via messaging, etc.)
                await Sharing.shareAsync(file.uri, {
                    mimeType: 'text/csv',
                    dialogTitle: 'Export Race Results',
                    UTI: 'public.comma-separated-values-text',
                });
            }
            
            hideWorking();
        } catch (error) {
            hideWorking();
            console.error('Error exporting results:', error);
            showAlert({
                title: 'Export Failed',
                message: 'Failed to export results. Please try again.',
            });
        }
    };

    return (
        <View style={styles.container}>
            {/* Filters - hidden in compare mode */}
            {!hideFilters && !isCompareMode && <View style={styles.filterContainer}>
                <View style={styles.filterWrapper}>
                    {/* Division, View Mode, and Search - responsive layout */}
                    <View style={styles.filterRow}>
                        <View style={styles.filterGroup}>
                            <Text style={styles.filterLabel}>Division</Text>
                            <Dropdown
                                value={selectedDivisionValue}
                                options={[
                                    { label: 'All Divisions', value: 0 },
                                    { label: 'All Male', value: 'men' },
                                    { label: 'All Female', value: 'women' },
                                    ...divisions.map(div => ({ label: div.name, value: div.id }))
                                ]}
                                onChange={handleDivisionChange}
                                disabled={loadingDivisions}
                            />
                        </View>

                        <View style={styles.filterGroup}>
                            <Text style={styles.filterLabel}>View</Text>
                            <Dropdown
                                value={viewMode}
                                options={[
                                    { label: 'Simple', value: 'simple' },
                                    { label: 'Detailed', value: 'detailed' }
                                ]}
                                onChange={(value: 'simple' | 'detailed') => setViewMode(value)}
                            />
                        </View>

                        <View style={[styles.filterGroup, styles.searchGroup]}>
                            <Text style={styles.filterLabel}>Search (Bib, Name, Hometown)</Text>
                            <View style={styles.searchContainer}>
                                <TextInput
                                    style={styles.searchInput}
                                    value={searchTerm}
                                    onChangeText={(text) => {
                                        setSearchTerm(text);
                                        setPage(1);
                                    }}
                                    placeholder="Search..."
                                    placeholderTextColor={colors.textTertiary}
                                />
                                <TouchableOpacity
                                    style={styles.exportButton}
                                    onPress={handleExport}
                                    disabled={loading || displayResults.length === 0}
                                >
                                    <Ionicons 
                                        name="download-outline" 
                                        size={22} 
                                        color={loading || displayResults.length === 0 ? colors.textDisabled : colors.textPrimary} 
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    {isRowClickable && (
                        <Text style={styles.filterNote}>
                            Click a row to view result details and insights.
                        </Text>
                    )}
                </View>
            </View>}

            {/* Results Table */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.emptyText, { marginTop: 16 }]}>Loading results...</Text>
                </View>
            ) : displayResults.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No results found</Text>
                    {Boolean(divisionFilter || searchTerm) && (
                        <Text style={[styles.emptyText, { marginTop: 8, fontSize: 14 }]}>
                            Try adjusting your filters
                        </Text>
                    )}
                </View>
            ) : (
                <View style={[styles.tableOuterContainer, { maxHeight: height * 0.65 }]}>
                    {/* Header - scrolls horizontally, synced with body */}
                    <View style={styles.headerContainer}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            scrollEnabled={false}
                            ref={(ref) => { headerScrollRef.current = ref; }}
                            style={styles.headerScrollContainer}
                        >
                            <View style={styles.tableHeader}>
                                {activeColumns.map((column) => {
                                    const columnWidth = getColumnWidth(column);
                                    return (
                                        <TouchableOpacity
                                            key={column}
                                            style={[styles.headerCell, { width: columnWidth }]}
                                            onPress={() => handleSort(column)}
                                        >
                                            <Text style={styles.headerCellText}>
                                                {getColumnLabel(column)}
                                            </Text>
                                            {sortField === column && !disableSorting && (
                                                <Text style={styles.sortIndicator}>
                                                    {sortDirection === 'asc' ? '▲' : '▼'}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                        {/* Spacer for vertical scrollbar */}
                        <View style={styles.scrollbarSpacer} />
                    </View>

                    {/* Body - vertical scroll contains horizontal scroll */}
                    <ScrollView
                        showsVerticalScrollIndicator={true}
						scrollEventThrottle={16}
						onScroll={(e) => {
							if (Platform.OS !== 'web') { return; }
							headerScrollRef.current?.scrollTo({
								x: e.nativeEvent.contentOffset.x,
								animated: false
							});
						}}
                        style={styles.bodyVerticalScroll}
                        nestedScrollEnabled={true}
                    >
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={true}
                            onScroll={(e) => {
                                headerScrollRef.current?.scrollTo({
                                    x: e.nativeEvent.contentOffset.x,
                                    animated: false
                                });
                            }}
                            scrollEventThrottle={16}
                            style={styles.bodyHorizontalScroll}
                            nestedScrollEnabled={true}
                        >
                            <View>
                                {displayResults.map((result, index) => {
                                    const isProximityResult = isCompareMode && 'timeDifference' in result;
                                    const compareResultItem = isProximityResult ? result as RaceResultWithProximity : null;

                                    return (
                                        <Pressable
                                            key={result.id}
                                            style={({ hovered }) => [
                                                styles.tableRow,
                                                index % 2 === 1 && styles.tableRowAlternate,
                                                isRowClickable && styles.tableRowClickable,
                                                isRowClickable && isWeb && hovered && styles.tableRowHover
                                            ]}
                                            onPress={() => onResultPress && onResultPress(result)}
                                        >
                                            {activeColumns.map((column) => {
                                                const columnWidth = getColumnWidth(column);
                                                let value: any = '-';
                                                const propertyKey = columnToPropertyKey(column);

                                                if (column === 'TimeDifference' && isCompareMode && compareResultItem && compareResult) {
                                                    let isAhead = false;
                                                    if (compareType === 'start' && result.startTime && compareResult.startTime) {
                                                        isAhead = result.startTime < compareResult.startTime;
                                                    } else if (compareType === 'finish' && result.netTime && compareResult.netTime) {
                                                        isAhead = result.netTime < compareResult.netTime;
                                                    }
                                                    return (
                                                        <View key={column}
                                                            style={[styles.tableCell, styles.tableCellTextRow, { width: columnWidth }]}>
                                                            <Text style={[
                                                                styles.tableCellText,
                                                                {
                                                                    color: isAhead ? colors.success : colors.warning
                                                                }
                                                            ]}>
                                                                {isAhead ? '▼' : '▲'}
                                                            </Text>
                                                            <Text style={[styles.tableCellText, { marginLeft: 4 }]} numberOfLines={1}>
                                                                {formatTime(compareResultItem.timeDifference)}
                                                            </Text>
                                                        </View>
                                                    );
                                                } else if (column === 'NetTime' || column === 'ClockTime' || column === 'StartTime' || column === 'OverallPace' || column.startsWith('Split')) {
                                                    value = formatTime((result as any)[propertyKey] as string);
                                                } else {
                                                    value = (result as any)[propertyKey] ?? '-';
                                                    // Add "PR", "HC", "D" for push rim, hand cycle, and duo runner types to the overall place
                                                    if (column === 'OverallPlace' && result.overallPlace !== null) {
                                                        if (value === 0) {
                                                            value = 'DNF';
                                                        } else {
                                                            if (result.runnerType === 1) {
                                                                value = `${value} PR`;
                                                            } else if (result.runnerType === 2) {
                                                                value = `${value} HC`;
                                                            } else if (result.runnerType === 3) {
                                                                value = `${value} D`;
                                                            }
                                                        }
                                                    } else if ((column === 'DivisionPlace' && result.divisionPlace !== null) || (column === 'GenderPlace' && result.genderPlace !== null)) {
                                                        if (value === 0) {
                                                            value = 'DNF';
                                                        }
                                                    }
                                                }

                                                return (
                                                    <View
                                                        key={column}
                                                        style={[styles.tableCell, { width: columnWidth }]}
                                                    >
                                                        <Text style={styles.tableCellText} numberOfLines={1}>
                                                            {String(value)}
                                                        </Text>
                                                    </View>
                                                );
                                            })}
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </ScrollView>
                </View>
            )}

            {/* Status Bar with Pagination */}
            {!hideStatusBar && <View style={styles.statusBar}>
                <View style={styles.statusBarLeft}>
                    <View style={styles.pageSizeContainer}>
                        <Text style={styles.pageSizeLabel}>Size:</Text>
                        <View style={styles.pageSizeDropdown}>
                            <Dropdown
                                value={pageSize}
                                options={pageSizeOptions.map(size => ({ label: String(size), value: size }))}
                                onChange={(value: number) => {
                                    setPageSize(value);
                                    setPage(1);
                                }}
                            />
                        </View>
                    </View>

                    <View style={styles.paginationControls}>
                        <TouchableOpacity
                            style={[
                                styles.pageButton,
                                page === 1 ? styles.pageButtonDisabled : styles.pageButtonActive
                            ]}
                            onPress={() => page > 1 && setPage(page - 1)}
                            disabled={page === 1}
                        >
                            <Text style={[
                                styles.pageButtonText,
                                page === 1 ? styles.pageButtonTextDisabled : styles.pageButtonTextActive
                            ]}>
                                {'<'}
                            </Text>
                        </TouchableOpacity>

                        {width > 420 && <Text style={styles.pageInfo}>
                            {page}/{totalPages || 1}
                        </Text>}

                        <TouchableOpacity
                            style={[
                                styles.pageButton,
                                page >= totalPages ? styles.pageButtonDisabled : styles.pageButtonActive
                            ]}
                            onPress={() => page < totalPages && setPage(page + 1)}
                            disabled={page >= totalPages}
                        >
                            <Text style={[
                                styles.pageButtonText,
                                page >= totalPages ? styles.pageButtonTextDisabled : styles.pageButtonTextActive
                            ]}>
                                {'>'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Only show result count on wider screens */}
                {width >= 640 && (
                    <Text style={styles.totalCountText}>
                        {displayTotalCount.toLocaleString()} results
                    </Text>
                )}
            </View>}
        </View>
    );
};
