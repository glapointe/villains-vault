/**
 * HeroImagePanel Component
 *
 * Admin panel for managing hero carousel images.
 * Displays a thumbnail grid of all uploaded images with upload and delete capabilities.
 * Uses platform-specific file selection: HTML file input on web, expo-image-picker on native.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, ScrollView, Pressable, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { Panel, Button, MessageBox, ConfirmationDialog } from '../../../components/ui';
import { api, setAuthToken } from '../../../services/api';
import type { HeroImage } from '../../../models';
import { styles, getThemedStyles } from './HeroImagePanel.styles';

/**
 * Props for HeroImagePanel
 */
export interface HeroImagePanelProps {
	/** Whether the panel is open */
	isOpen: boolean;
	/** Callback when panel is closed */
	onClose: () => void;
	/** Access token for API calls */
	accessToken: string;
}

/**
 * HeroImagePanel Component
 *
 * Provides admin interface for uploading, viewing, and deleting hero carousel images.
 */
export const HeroImagePanel: React.FC<HeroImagePanelProps> = ({
	isOpen,
	onClose,
	accessToken,
}): React.ReactElement => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);

	const [images, setImages] = useState<HeroImage[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [uploading, setUploading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<HeroImage | null>(null);
	const [deleting, setDeleting] = useState<boolean>(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	/**
	 * Fetches all hero images from the admin endpoint.
	 */
	const fetchImages = useCallback(async (): Promise<void> => {
		try {
			setError(null);
			setLoading(true);
			setAuthToken(accessToken);
			const result = await api.heroImages.getAll();
			setImages(result);
		} catch (err) {
			console.error('Failed to fetch hero images:', err);
			setError('Failed to load images. Please try again.');
		} finally {
			setLoading(false);
		}
	}, [accessToken]);

	useEffect(() => {
		if (isOpen) {
			fetchImages();
		}
	}, [isOpen, fetchImages]);

	/**
	 * Handles file selection and upload (web File or native URI-based object).
	 */
	const handleFileSelected = async (
		fileOrUri: File | { uri: string; name: string; type: string }
	): Promise<void> => {
		// Validate file type (web only — native validation happens in picker config)
		if (Platform.OS === 'web' && fileOrUri instanceof File) {
			const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
			if (!allowedTypes.includes(fileOrUri.type)) {
				setError('Invalid file type. Please select a JPEG, PNG, or WebP image.');
				return;
			}

			// Validate file size (20 MB max)
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
			const newImage = await api.heroImages.upload(fileOrUri);
			setImages((prev) => [newImage, ...prev]);
		} catch (err) {
			console.error('Failed to upload image:', err);
			setError('Failed to upload image. Please try again.');
		} finally {
			setUploading(false);
			// Reset file input (web only)
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
			if (fileInputRef.current) {
				fileInputRef.current.click();
			}
			return;
		}

		// Native: use expo-image-picker
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
		// Extract filename from URI or generate one
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
	 * Confirms and deletes a hero image.
	 */
	const handleConfirmDelete = async (): Promise<void> => {
		if (!deleteTarget) return;

		try {
			setDeleting(true);
			setError(null);
			setAuthToken(accessToken);
			await api.heroImages.delete(deleteTarget.filename);
			setImages((prev) => prev.filter((img) => img.filename !== deleteTarget.filename));
		} catch (err) {
			console.error('Failed to delete image:', err);
			setError('Failed to delete image. Please try again.');
		} finally {
			setDeleting(false);
			setDeleteTarget(null);
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
				headerTitle="Manage Hero Images"
				showCloseButton
				width="large"
			>
				<ScrollView contentContainerStyle={styles.scrollContent}>
					{/* Header section with description and upload */}
					<View style={styles.headerSection}>
						<Text style={[styles.description, themedStyles.description]}>
							Upload images for the home page hero carousel. The 10 most recent images
							will be displayed. Supported formats: JPEG, PNG, WebP (max 20 MB).
							Images are automatically resized for optimal display.
						</Text>

						<View style={styles.uploadRow}>
							<Button
								title={uploading ? 'Uploading...' : 'Upload Image'}
								onPress={handleUploadPress}
								disabled={uploading}
							/>
							<Text style={[styles.imageCount, themedStyles.imageCount]}>
								{images.length} image{images.length !== 1 ? 's' : ''} uploaded
							</Text>
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

					{/* Error message */}
					{error && (
						<MessageBox
							type="error"
							message={error}
							showIcon
							dismissible
							onDismiss={() => setError(null)}
						/>
					)}

					{/* Loading state */}
					{loading && (
						<View style={styles.emptyState}>
							<ActivityIndicator size="large" color={colors.primary} />
						</View>
					)}

					{/* Empty state */}
					{!loading && images.length === 0 && (
						<View style={styles.emptyState}>
							<Text style={[styles.emptyText, themedStyles.emptyText]}>
								No hero images uploaded yet
							</Text>
							<Text style={[styles.emptySubtext, themedStyles.emptySubtext]}>
								Upload images to customize the home page carousel
							</Text>
						</View>
					)}

					{/* Image grid */}
					{!loading && images.length > 0 && (
						<View style={styles.grid}>
							{images.map((image) => (
								<View
									key={image.filename}
									style={[styles.imageCard, themedStyles.imageCard]}
								>
									<Image
										source={{ uri: image.thumbnailUrl }}
										style={styles.thumbnail}
										resizeMode="cover"
									/>
									<View style={[styles.imageFooter, themedStyles.imageFooter]}>
										<Text style={[styles.imageDate, themedStyles.imageDate]}>
											{formatUploadDate(image.uploadedAt)}
										</Text>
										<Pressable
											style={({ hovered }) => [
												styles.deleteButton,
												themedStyles.deleteButton,
												hovered && { opacity: 0.8 },
											]}
											onPress={() => setDeleteTarget(image)}
										>
											<Text style={[styles.deleteButtonText, themedStyles.deleteButtonText]}>
												Delete
											</Text>
										</Pressable>
									</View>
								</View>
							))}
						</View>
					)}
				</ScrollView>
			</Panel>

			{/* Delete confirmation dialog */}
			<ConfirmationDialog
				isOpen={deleteTarget !== null}
				title="Delete Hero Image"
				message="Are you sure you want to delete this hero image? This action cannot be undone."
				submitText={deleting ? 'Deleting...' : 'Delete'}
				cancelText="Cancel"
				onSubmit={handleConfirmDelete}
				onCancel={() => setDeleteTarget(null)}
			/>
		</>
	);
};

export default HeroImagePanel;
