/**
 * Hero Carousel Image Configuration
 * 
 * Defines slides for the home page hero carousel.
 * Each slide has gradient colors for the background, and optionally
 * an image source (bundled or remote URI).
 * 
 * Dynamic images are fetched from the API and converted to HeroSlide
 * with a `uri` field. The HERO_SLIDES array below provides gradient-only
 * fallback slides used when no API images are available.
 */

import type { ImageSourcePropType } from 'react-native';
export { HeroCarousel } from './HeroCarousel';

export interface HeroSlide {
	/** Optional bundled image source */
	image?: ImageSourcePropType;
	/** Optional remote image URI (from API) */
	uri?: string;
	/** Gradient colors for background (used as fallback or overlay base) */
	gradientColors: readonly [string, string, ...string[]];
	/** Gradient start point */
	gradientStart?: { x: number; y: number };
	/** Gradient end point */
	gradientEnd?: { x: number; y: number };
}

/**
 * Gradient palette for fallback slides and dynamic image overlays.
 * Cycled through when converting API images to HeroSlide objects.
 */
export const HERO_GRADIENT_PALETTE: HeroSlide['gradientColors'][] = [
	['#2d1b69', '#1a0a2e', '#0f3460'],
	['#1a3a2a', '#0d4a3a', '#064e3b'],
	['#4a1a6b', '#6b1d5e', '#3b0764'],
	['#0c1445', '#1e1b4b', '#172554'],
	['#064e3b', '#1a3a2a', '#14532d'],
	['#2d1b69', '#3b0764', '#1a0a2e'],
	['#1a3a2a', '#064e3b', '#14532d'],
	['#4a1a6b', '#1e1b4b', '#0f3460'],
	['#0c1445', '#172554', '#1a0a2e'],
	['#3b0764', '#2d1b69', '#0f3460'],
];

/**
 * Gradient-only fallback slides used when the API returns no images
 * or when the fetch fails. Provides visual interest without photos.
 */
export const HERO_SLIDES: HeroSlide[] = [
	{
		gradientColors: ['#2d1b69', '#1a0a2e', '#0f3460'],
		gradientStart: { x: 0, y: 0 },
		gradientEnd: { x: 1, y: 1 },
	},
	{
		gradientColors: ['#1a3a2a', '#0d4a3a', '#064e3b'],
		gradientStart: { x: 0.2, y: 0 },
		gradientEnd: { x: 0.8, y: 1 },
	},
	{
		gradientColors: ['#4a1a6b', '#6b1d5e', '#3b0764'],
		gradientStart: { x: 1, y: 0 },
		gradientEnd: { x: 0, y: 1 },
	},
	{
		gradientColors: ['#0c1445', '#1e1b4b', '#172554'],
		gradientStart: { x: 0.5, y: 0 },
		gradientEnd: { x: 0.5, y: 1 },
	},
	{
		gradientColors: ['#064e3b', '#1a3a2a', '#14532d'],
		gradientStart: { x: 0, y: 0.5 },
		gradientEnd: { x: 1, y: 0.5 },
	},
];
