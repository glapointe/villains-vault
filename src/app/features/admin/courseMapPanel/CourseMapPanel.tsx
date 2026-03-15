/**
 * CourseMapPanel Component
 *
 * Admin panel for managing the course map image for a specific race.
 * Displays the current course map (if any) with the ability to delete or upload a new one.
 * Uses platform-specific file selection: HTML file input on web, expo-image-picker on native.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useDialog } from '../../../contexts/DialogContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { Panel, Button, MessageBox } from '../../../components/ui';
import { api, setAuthToken } from '../../../services/api';
import type { CourseMapImage } from '../../../models';
import { styles, getThemedStyles } from './CourseMapPanel.styles';

/**
 * Props for CourseMapPanel
 */
export interface CourseMapPanelProps {
	/** Whether the panel is open */
	isOpen: boolean;
	/** Callback when panel is closed */
	onClose: () => void;
	/** The race ID to manage the course map for */
	raceId: number;
	/** The race name, shown in the panel title */
	raceName: string;
	/** Access token for API calls */
	accessToken: string;
}

/**
 * CourseMapPanel Component
 *
 * Provides an admin interface for uploading and deleting a race's course map image.
 */
export const CourseMapPanel: React.FC<CourseMapPanelProps> = ({
	isOpen,
	onClose,
	raceId,
	raceName,
	accessToken,
}): React.ReactElement => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const { showConfirm } = useDialog();

	const [courseMap, setCourseMap] = useState<CourseMapImage | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [uploading, setUploading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [deleting, setDeleting] = useState<boolean>(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	/**
	 * Fetches the current course map image for the race.
	 */
	const fetchCourseMap = useCallback(async (): Promise<void> => {
		try {
			setError(null);
			setLoading(true);
			setAuthToken(accessToken);
			const result = await api.races.getCourseMap(raceId);
			setCourseMap(result);
		} catch (err) {
			console.error('Failed to fetch course map:', err);
			setError('Failed to load course map. Please try again.');
		} finally {
			setLoading(false);
		}
	}, [accessToken, raceId]);

	useEffect(() => {
		if (isOpen) {
			fetchCourseMap();
		}
	}, [isOpen, fetchCourseMap]);

	/**
	 * Handles file selection and upload (web File or native URI-based object).
	 */
	const handleFileSelected = async (
		fileOrUri: File | { uri: string; name: string; type: string }
	): Promise<void> => {
		if (Platform.OS === 'web' && fileOrUri instanceof File) {
			const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
			if (!allowedTypes.includes(fileOrUri.type)) {
				setError('Invalid file type. Please select a JPEG, PNG, or WebP image.');
				return;
			}
			const maxSize = 20 * 1024 * 1024;
			if (fileOrUri.size > maxSize) {
				setError('File is too large. Maximum size is 20 MB.');
				return;
			}
		}

		try {
			setError(null);
			setUploading(true);
			setAuthToken(accessToken);
			const newImage = await api.races.uploadCourseMap(raceId, fileOrUri);
			setCourseMap(newImage);
		} catch (err) {
			console.error('Failed to upload course map:', err);
			setError('Failed to upload course map. Please try again.');
		} finally {
			setUploading(false);
			if (Platform.OS === 'web' && fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		}
	};

	/**
	 * Opens the file/image picker.
	 * Web: triggers hidden HTML file input.
	 * Native: launches expo-image-picker media library.
	 */
	const handleUploadPress = async (): Promise<void> => {
		if (Platform.OS === 'web') {
			fileInputRef.current?.click();
			return;
		}

		const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permissionResult.granted) {
			setError('Permission to access the photo library is required to upload images.');
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images'],
			allowsEditing: false,
			quality: 0.9,
		});

		if (result.canceled || !result.assets || result.assets.length === 0) {
			return;
		}

		const asset = result.assets[0];
		const uri = asset.uri;
		const uriParts = uri.split('/');
		const name = asset.fileName || uriParts[uriParts.length - 1] || `upload_${Date.now()}.jpg`;
		const type = asset.mimeType || 'image/jpeg';

		await handleFileSelected({ uri, name, type });
	};

	/**
	 * Handles file input change event (web only).
	 */
	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
		const file = event.target.files?.[0];
		if (file) {
			handleFileSelected(file);
		}
	};

	/**
	 * Prompts for confirmation then deletes the course map image.
	 */
	const handleDeletePress = async (): Promise<void> => {
		const confirmed = await showConfirm({
			title: 'Delete Course Map',
			message: 'Are you sure you want to delete this course map image? This action cannot be undone.',
			submitText: 'Delete',
			cancelText: 'Cancel',
		});

		if (!confirmed) return;

		try {
			setDeleting(true);
			setError(null);
			setAuthToken(accessToken);
			await api.races.deleteCourseMap(raceId);
			setCourseMap(null);
		} catch (err) {
			console.error('Failed to delete course map:', err);
			setError('Failed to delete course map. Please try again.');
		} finally {
			setDeleting(false);
		}
	};

	/**
	 * Formats a UTC date string for display.
	 */
	const formatUploadDate = (dateStr: string): string => {
		try {
			const date = new Date(dateStr);
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
				hour: 'numeric',
				minute: '2-digit',
			});
		} catch {
			return 'Unknown date';
		}
	};

	return (
		<>
			<Panel
				isOpen={isOpen}
				onClose={onClose}
				headerTitle={`Course Map — ${raceName}`}
				showCloseButton
				width="medium"
			>
				<ScrollView contentContainerStyle={styles.scrollContent}>
					{/* Description + upload button */}
					<View style={styles.headerSection}>
						<Text style={[styles.description, themedStyles.description]}>
							Upload a course map image for this race. Supported formats: JPEG, PNG,
							WebP (max 20 MB). The image is automatically resized for optimal display.
							Uploading a new image will replace the existing one.
						</Text>

						<View style={styles.uploadRow}>
							<Button
								title={uploading ? 'Uploading...' : courseMap ? 'Replace Image' : 'Upload Image'}
								onPress={handleUploadPress}
								disabled={uploading || loading}
							/>
						</View>

						{uploading && (
							<View style={styles.uploadingRow}>
								<ActivityIndicator size="small" color={colors.primary} />
								<Text style={[styles.uploadingText, themedStyles.uploadingText]}>
									Processing image...
								</Text>
							</View>
						)}

						{/* Hidden file input for web */}
						{Platform.OS === 'web' && (
							<input
								ref={fileInputRef as React.RefObject<HTMLInputElement>}
								type="file"
								accept="image/jpeg,image/png,image/webp"
								onChange={handleInputChange as unknown as React.ChangeEventHandler<HTMLInputElement>}
								style={{ display: 'none' }}
							/>
						)}
					</View>

					{/* Error display */}
					{error && (
						<MessageBox
							type="error"
							title="Error"
							message={error}
							showIcon
						/>
					)}

					{/* Current map display */}
					{loading ? (
						<View style={styles.emptyState}>
							<ActivityIndicator size="large" color={colors.primary} />
						</View>
					) : courseMap ? (
						<View style={styles.currentMapSection}>
							<Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>
								Current Course Map
							</Text>
							<View style={[styles.imageCard, themedStyles.imageCard]}>
								<Image
									source={{ uri: courseMap.thumbnailUrl }}
									style={styles.thumbnail}
									accessibilityLabel="Course map image"
								/>
								<Text style={[styles.uploadedAt, themedStyles.uploadedAt]}>
									Uploaded {formatUploadDate(courseMap.uploadedAt)}
								</Text>
								<View style={[styles.imageActions, themedStyles.imageActions]}>
									<Button
										title={deleting ? 'Deleting...' : 'Delete Image'}
										variant="danger"
										onPress={handleDeletePress}
										disabled={deleting || uploading}
									/>
								</View>
							</View>
						</View>
					) : (
						<View style={styles.emptyState}>
							<Text style={[styles.emptyText, themedStyles.emptyText]}>
								No course map uploaded yet
							</Text>
							<Text style={[styles.emptySubtext, themedStyles.emptySubtext]}>
								Use the button above to upload a course map image.
							</Text>
						</View>
					)}
				</ScrollView>
			</Panel>
		</>
	);
};

export default CourseMapPanel;
