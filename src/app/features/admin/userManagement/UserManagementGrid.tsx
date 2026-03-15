/**
 * UserManagementGrid Component
 * 
 * Admin page for managing users. Displays users in a sortable, searchable,
 * paginated grid. Supports row selection with a toolbar for edit/delete actions.
 */

import React, { useState, useMemo, useRef, Suspense } from 'react';
import { View, Text, ScrollView, TextInput, ActivityIndicator, TouchableOpacity, Pressable, useWindowDimensions, Platform } from 'react-native';
import type { ScrollView as ScrollViewType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Dropdown, SectionHeader } from '../../../components/ui';
import { Button, ConfirmationDialog } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { useUsers } from '../../../hooks';
import { api, setAuthToken } from '../../../services/api';
import { createStyles, getUserColumnWidth } from './UserManagementGrid.styles';
import type { UserProfile, UserSortField } from '../../../models';
import { EditUserPanel } from '../../../components/users';

/** Column definitions for the user grid */
const USER_COLUMNS: { key: UserSortField; label: string }[] = [
	{ key: 'email', label: 'Email' },
	{ key: 'displayName', label: 'Display Name' },
	{ key: 'subjectId', label: 'Provider' },
	{ key: 'isAdmin', label: 'Admin' },
	{ key: 'createdAt', label: 'Created' },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export interface UserManagementGridProps {
	/** Access token for API calls */
	accessToken: string;
	/** Current user's ID (to prevent self-deletion and disable own admin toggle) */
	currentUserId: number;
}

/**
 * UserManagementGrid Component
 * Full-featured admin user management grid with search, sort, page, select, edit, delete.
 */
export const UserManagementGrid: React.FC<UserManagementGridProps> = ({
	accessToken,
	currentUserId,
}) => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const { width, height } = useWindowDimensions();
	const styles = useMemo(() => createStyles(colors, isDark, width), [colors, isDark, width]);
	const headerScrollRef = useRef<ScrollViewType>(null);
	const router = useRouter();
	const isWeb = Platform.OS === 'web';

	// Data hook
	const {
		users,
		loading,
		error,
		page,
		pageSize,
		totalCount,
		totalPages,
		sortField,
		sortDirection,
		searchTerm,
		setPage,
		setPageSize,
		handleSort,
		setSearchTerm,
		refetch,
	} = useUsers({ accessToken, initialPageSize: 25 });

	// Selection state
	const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

	// Edit panel state
	const [isEditPanelOpen, setIsEditPanelOpen] = useState<boolean>(false);

	// Delete confirmation state
	const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
	const [deleting, setDeleting] = useState<boolean>(false);

	/** Handle row click - select/deselect */
	const handleRowPress = (user: UserProfile): void => {
		setSelectedUser(prev => prev?.id === user.id ? null : user);
	};

	/** Clear selection on sort/page changes */
	const handleSortWithClear = (field: UserSortField): void => {
		setSelectedUser(null);
		handleSort(field);
	};

	const handlePageChange = (newPage: number): void => {
		setSelectedUser(null);
		setPage(newPage);
	};

	const handlePageSizeChange = (newSize: number): void => {
		setSelectedUser(null);
		setPageSize(newSize);
	};

	/** Open edit panel for selected user */
	const handleEdit = (): void => {
		if (selectedUser) {
			setIsEditPanelOpen(true);
		}
	};

	/** Handle user saved from edit panel */
	const handleUserSaved = (_updatedUser: UserProfile): void => {
		refetch();
		setSelectedUser(null);
	};

	/** Open delete confirmation for selected user */
	const handleDeletePress = (): void => {
		if (selectedUser) {
			setDeleteTarget(selectedUser);
		}
	};

	/** Confirm delete */
	const handleConfirmDelete = async (): Promise<void> => {
		if (!deleteTarget) return;
		try {
			setDeleting(true);
			setAuthToken(accessToken);
			await api.users.deleteUser(deleteTarget.id);
			setSelectedUser(null);
			setDeleteTarget(null);
			refetch();
		} catch (err) {
			console.error('Failed to delete user:', err);
		} finally {
			setDeleting(false);
		}
	};

	/** Format date for display */
	const formatDate = (dateStr: string): string => {
		try {
			return new Date(dateStr).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
			});
		} catch {
			return dateStr;
		}
	};

	/** Get cell value for a column */
	const getCellContent = (user: UserProfile, column: UserSortField): React.ReactNode => {
		switch (column) {
			case 'email':
				return <Text style={styles.tableCellText} numberOfLines={1}>{user.email}</Text>;
			case 'displayName':
				return <Text style={styles.tableCellText} numberOfLines={1}>{user.displayName ?? '-'}</Text>;
			case 'subjectId':
				return <Text style={styles.tableCellText} numberOfLines={1}>{user.subjectId?.split('|')[0] ?? '-'}</Text>;
			case 'isAdmin':
				return user.isAdmin ? (
					<View style={styles.adminBadge}>
						<Text style={styles.adminBadgeText}>Admin</Text>
					</View>
				) : (
					<Text style={styles.nonAdminText}>—</Text>
				);
			case 'createdAt':
				return <Text style={styles.tableCellText} numberOfLines={1}>{formatDate(user.createdAt)}</Text>;
			default:
				return <Text style={styles.tableCellText}>-</Text>;
		}
	};

	const canDeleteSelected = selectedUser && selectedUser.id !== currentUserId;

	const leftHeader = (
		<View>
			<Pressable
				style={styles.backButton}
				onPress={() => router.push('/(tabs)/admin')}
			>
				<Ionicons name="arrow-back" size={18} color={colors.primary} />
				<Text style={styles.backButtonText}>Back to Admin</Text>
			</Pressable>

			{/* Header */}
			<View>
				<Text style={styles.title}>User Management</Text>
				<Text style={styles.subtitle}>
					Manage user accounts, roles, and permissions
				</Text>
			</View>
		</View>
	);
	return (
		<View style={styles.container}>
			<SectionHeader
				isPageHeader
				leftContent={leftHeader}
			/>
			<View style={styles.contentBody}>
				{/* Search */}
				<View style={styles.filterContainer}>
					<View style={styles.filterRow}>
						<View style={styles.searchGroup}>
							<Text style={styles.filterLabel}>Search (Email, Name)</Text>
							<TextInput
								style={styles.searchInput}
								value={searchTerm}
								onChangeText={setSearchTerm}
								placeholder="Search users..."
								placeholderTextColor={colors.textTertiary}
							/>
						</View>
					</View>
				</View>

				{/* Selection Toolbar */}
				{selectedUser && (
					<View style={styles.toolbar}>
						<View style={styles.toolbarLeft}>
							<Ionicons name="person-circle-outline" size={20} color={colors.primary} />
							<Text style={styles.toolbarText} numberOfLines={1}>
								{selectedUser.email}
							</Text>
						</View>
						<View style={styles.toolbarActions}>
							<Button
								title="Edit"
								variant="primary"
								onPress={handleEdit}
								icon={<Ionicons name="create-outline" size={16} color={colors.textInverse} />}
							/>
							{canDeleteSelected ? (
								<Button
									title="Delete"
									variant="danger"
									onPress={handleDeletePress}
									icon={<Ionicons name="trash-outline" size={16} color={colors.textInverse} />}
								/>
							) : null}
						</View>
					</View>
				)}

				{/* Error */}
				{error ? (
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyText}>{error}</Text>
					</View>
				) : loading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color={colors.primary} />
						<Text style={[styles.emptyText, { marginTop: 16 }]}>Loading users...</Text>
					</View>
				) : users.length === 0 ? (
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyText}>No users found</Text>
						{searchTerm && (
							<Text style={[styles.emptyText, { marginTop: 8, fontSize: 14 }]}>
								Try adjusting your search term
							</Text>
						)}
					</View>
				) : (
					/* Results Table */
					<View style={[styles.tableOuterContainer, { maxHeight: height * 0.65 }]}>
						{/* Header */}
						<View style={styles.headerContainer}>
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								scrollEnabled={false}
								ref={(ref) => { headerScrollRef.current = ref; }}
								style={styles.headerScrollContainer}
							>
								<View style={styles.tableHeader}>
									{USER_COLUMNS.map((col) => {
										const columnWidth = getUserColumnWidth(col.key);
										return (
											<TouchableOpacity
												key={col.key}
												style={[styles.headerCell, { width: columnWidth }]}
												onPress={() => handleSortWithClear(col.key)}
											>
												<Text style={styles.headerCellText}>{col.label}</Text>
												{sortField === col.key && (
													<Text style={styles.sortIndicator}>
														{sortDirection === 'asc' ? '▲' : '▼'}
													</Text>
												)}
											</TouchableOpacity>
										);
									})}
								</View>
							</ScrollView>
							<View style={styles.scrollbarSpacer} />
						</View>

						{/* Body */}
						<ScrollView
							showsVerticalScrollIndicator={true}
							scrollEventThrottle={16}
							onScroll={(e) => {
								if (Platform.OS !== 'web') return;
								headerScrollRef.current?.scrollTo({
									x: e.nativeEvent.contentOffset.x,
									animated: false,
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
										animated: false,
									});
								}}
								scrollEventThrottle={16}
								style={styles.bodyHorizontalScroll}
								nestedScrollEnabled={true}
							>
								<View>
									{users.map((user, index) => {
										const isSelected = selectedUser?.id === user.id;
										return (
											<Pressable
												key={user.id}
												style={({ hovered }) => [
													styles.tableRow,
													index % 2 === 1 && styles.tableRowAlternate,
													styles.tableRowClickable,
													isWeb && hovered && !isSelected && styles.tableRowHover,
													isSelected && styles.tableRowSelected,
												]}
												onPress={() => handleRowPress(user)}
											>
												{USER_COLUMNS.map((col) => {
													const columnWidth = getUserColumnWidth(col.key);
													return (
														<View
															key={col.key}
															style={[styles.tableCell, { width: columnWidth }]}
														>
															{getCellContent(user, col.key)}
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
				<View style={styles.statusBar}>
					<View style={styles.statusBarLeft}>
						<View style={styles.pageSizeContainer}>
							<Text style={styles.pageSizeLabel}>Size:</Text>
							<View style={styles.pageSizeDropdown}>
								<Dropdown
									value={pageSize}
									options={PAGE_SIZE_OPTIONS.map(size => ({ label: String(size), value: size }))}
									onChange={(value: number) => handlePageSizeChange(value)}
								/>
							</View>
						</View>

						<View style={styles.paginationControls}>
							<TouchableOpacity
								style={[
									styles.pageButton,
									page === 1 ? styles.pageButtonDisabled : styles.pageButtonActive,
								]}
								onPress={() => page > 1 && handlePageChange(page - 1)}
								disabled={page === 1}
							>
								<Text style={[
									styles.pageButtonText,
									page === 1 ? styles.pageButtonTextDisabled : styles.pageButtonTextActive,
								]}>
									{'<'}
								</Text>
							</TouchableOpacity>

							{width > 420 && (
								<Text style={styles.pageInfo}>
									{page}/{totalPages || 1}
								</Text>
							)}

							<TouchableOpacity
								style={[
									styles.pageButton,
									page >= totalPages ? styles.pageButtonDisabled : styles.pageButtonActive,
								]}
								onPress={() => page < totalPages && handlePageChange(page + 1)}
								disabled={page >= totalPages}
							>
								<Text style={[
									styles.pageButtonText,
									page >= totalPages ? styles.pageButtonTextDisabled : styles.pageButtonTextActive,
								]}>
									{'>'}
								</Text>
							</TouchableOpacity>
						</View>
					</View>

					{width >= 640 && (
						<Text style={styles.totalCountText}>
							{totalCount.toLocaleString()} user{totalCount !== 1 ? 's' : ''}
						</Text>
					)}
				</View>
			</View>
			{/* Edit User Panel */}
			<Suspense fallback={null}>
				<EditUserPanel
					isOpen={isEditPanelOpen}
					onClose={() => setIsEditPanelOpen(false)}
					accessToken={accessToken}
					user={selectedUser}
					currentUserId={currentUserId}
					mode="admin"
					onSaved={handleUserSaved}
				/>
			</Suspense>

			{/* Delete Confirmation */}
			<ConfirmationDialog
				isOpen={deleteTarget !== null}
				title="Delete User"
				message={`Are you sure you want to delete ${deleteTarget?.email ?? 'this user'}? This action cannot be undone.`}
				submitText={deleting ? 'Deleting...' : 'Delete'}
				cancelText="Cancel"
				onSubmit={handleConfirmDelete}
				onCancel={() => setDeleteTarget(null)}
			/>
		</View>
	);
};

export default UserManagementGrid;
