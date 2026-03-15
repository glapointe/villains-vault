/**
 * Hero Images API - Public and Admin endpoints
 *
 * Manages hero carousel images: fetch recent for public display,
 * list all / upload / delete for admin management.
 */

import { Platform } from 'react-native';
import { apiClient } from './client';
import { apiConfig } from '../../features/auth/providers/config';
import type { HeroImage } from '../../models';

/**
 * Resolves relative image URLs from the API to fully qualified URLs.
 * The API returns paths like `/content/images/hero/full/file.jpg` which
 * must be prefixed with the API host for Image source URIs.
 */
const resolveImageUrl = (relativeUrl: string): string => {
	if (!relativeUrl) return relativeUrl;
	// Already absolute
	if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
		return relativeUrl;
	}
	// Strip trailing slash from baseUrl to avoid double-slash
	const base = apiConfig.baseUrl.replace(/\/+$/, '');
	return `${base}${relativeUrl}`;
};

/**
 * Maps API response images to have fully qualified URLs.
 */
const resolveImageUrls = (image: HeroImage): HeroImage => ({
	...image,
	fullUrl: resolveImageUrl(image.fullUrl),
	thumbnailUrl: resolveImageUrl(image.thumbnailUrl),
});

export const heroImagesApi = {
	// Public endpoints (no auth required)

	/**
	 * Get the most recent hero carousel images (public endpoint).
	 * Returns the newest 10 images sorted by upload date descending.
	 */
	getRecent: async (): Promise<HeroImage[]> => {
		const response = await apiClient.get<HeroImage[]>('/api/v1.0/hero-images');
		const images = response.data.map(resolveImageUrls);
		// Randomize the collection
		return images.sort(() => Math.random() - 0.5);
	},

	// Admin endpoints (require auth + admin role)

	/**
	 * Get all hero images (admin only).
	 * Returns all images with thumbnail URLs for admin grid.
	 */
	getAll: async (): Promise<HeroImage[]> => {
		const response = await apiClient.get<HeroImage[]>('/api/v1.0/admin/hero-images');
		return response.data.map(resolveImageUrls);
	},

	/**
	 * Upload a new hero image (admin only).
	 * Accepts JPEG, PNG, or WebP files up to 20 MB.
	 * Supports both web File objects and native image URIs.
	 * @param fileOrUri - A File object (web) or an object with uri/name/type (native)
	 */
	upload: async (fileOrUri: File | { uri: string; name: string; type: string }): Promise<HeroImage> => {
		const formData = new FormData();
		if (Platform.OS === 'web') {
			formData.append('image', fileOrUri as File);
		} else {
			// React Native: append the URI-based object — RN's FormData handles it
			formData.append('image', fileOrUri as unknown as Blob);
		}
		const response = await apiClient.post<HeroImage>(
			'/api/v1.0/admin/hero-images',
			formData,
			{
				headers: { 'Content-Type': 'multipart/form-data' },
			}
		);
		return resolveImageUrls(response.data);
	},

	/**
	 * Delete a hero image by filename (admin only).
	 * Removes both full-size and thumbnail versions.
	 * @param filename - The filename to delete
	 */
	delete: async (filename: string): Promise<void> => {
		await apiClient.delete(`/api/v1.0/admin/hero-images/${encodeURIComponent(filename)}`);
	},
};
