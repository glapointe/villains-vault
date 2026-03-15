/**
 * CourseMapImage Model
 *
 * Represents a course map image associated with a specific race.
 * Images are stored on disk and served as static files.
 */

/** A course map image with full-size and thumbnail URLs */
export interface CourseMapImage {
	/** Filename on disk (e.g., "1.jpg") */
	filename: string;
	/** URL to the full-size image (max 1920px wide) */
	fullUrl: string;
	/** URL to the thumbnail image (300px wide) */
	thumbnailUrl: string;
	/** UTC timestamp of when the image was uploaded */
	uploadedAt: string;
	/** Width / height ratio of the image (e.g. 1.78 for 16:9) */
	aspectRatio: number;
}
