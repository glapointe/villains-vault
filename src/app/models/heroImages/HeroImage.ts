/**
 * Hero Image Model
 *
 * Represents a hero carousel image managed through the admin panel.
 * Images are stored on disk and served as static files.
 */

/** A hero carousel image with full-size and thumbnail URLs */
export interface HeroImage {
	/** Filename on disk (e.g., "20260224153045123.jpg") */
	filename: string;
	/** URL to the full-size image (max 1920px wide) */
	fullUrl: string;
	/** URL to the thumbnail image (300px wide) */
	thumbnailUrl: string;
	/** UTC timestamp of when the image was uploaded */
	uploadedAt: string;
}
