/**
 * HeroCarousel Component
 * 
 * Full-width hero carousel with Ken Burns animation (slow zoom/pan),
 * crossfade transitions between slides, dark gradient scrim for text
 * readability, and the Villains Club logo as a watermark overlay.
 * 
 * Supports both bundled images and gradient-only slides as placeholders.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Platform, Image, Text, StyleSheet } from 'react-native';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	withSequence,
	Easing,
	cancelAnimation,
	withRepeat,
	interpolate,
	Extrapolate,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors, palette } from '../../../theme';
import { useScrollOffset } from '../../../contexts/ScrollOffsetContext';
import type { HeroSlide } from '.';
import { styles, getThemedStyles, HERO_HEIGHT_WEB, HERO_HEIGHT_MOBILE } from './HeroCarousel.styles';
import VillainsLogo from '../../../assets/images/VillainsClub.svg';

// Typed wrappers to work around reanimated v4 TypeScript children issue
const AnimView = Animated.View as React.ComponentType<any>;
const AnimText = Animated.Text as React.ComponentType<any>;

const Gradient = LinearGradient as React.ComponentType<
	React.ComponentProps<typeof LinearGradient> & {
		style?: React.ComponentProps<typeof View>['style'];
	}
>;

/**
 * Prefetch a slide's image so it's in the image cache before it's needed.
 * Silently ignores gradient-only or bundled-image slides.
 */
const prefetchSlideImage = (slide: HeroSlide | undefined): void => {
	if (slide?.uri) {
		Image.prefetch(slide.uri).catch(() => {
			// Prefetch is best-effort; don't block on failure
		});
	}
};

/** Duration of each slide in milliseconds */
const SLIDE_DURATION = 8000;
/** Duration of crossfade transition in milliseconds */
const CROSSFADE_DURATION = 1500;
/** Ken Burns zoom scale range */
const KB_SCALE_FROM = 1.0;
const KB_SCALE_TO = 1.15;

interface HeroCarouselProps {
	/** Array of hero slides to display */
	slides: HeroSlide[];
	/** Title text overlaid on the hero */
	title: string;
	/** Subtitle text overlaid on the hero */
	subtitle: string;
}

/**
 * Renders a single slide layer with Ken Burns animation.
 * Two of these are stacked - one fading in while the other fades out.
 */
function SlideLayer({
	slide,
	opacity,
	scale,
	translateX,
	translateY,
}: {
	slide: HeroSlide;
	opacity: SharedValue<number>;
	scale: SharedValue<number>;
	translateX: SharedValue<number>;
	translateY: SharedValue<number>;
}) {
	const animatedContainerStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	const animatedTransformStyle = useAnimatedStyle(() => ({
		transform: [
			{ scale: scale.value },
			{ translateX: translateX.value },
			{ translateY: translateY.value },
		],
	}));

	return (
		<AnimView style={[styles.slideLayer, animatedContainerStyle]}>
			<AnimView style={[styles.slideLayer, animatedTransformStyle]}>
				{slide.uri ? (
					<Image
						source={{ uri: slide.uri }}
						style={styles.slideImage}
						resizeMode="cover"
					/>
				) : slide.image ? (
					<Image
						source={slide.image}
						style={styles.slideImage}
						resizeMode="cover"
					/>
				) : (
					<Gradient
						colors={slide.gradientColors}
						start={slide.gradientStart ?? { x: 0, y: 0 }}
						end={slide.gradientEnd ?? { x: 1, y: 1 }}
						style={styles.slideGradient}
					/>
				)}
			</AnimView>
		</AnimView>
	);
}

/**
 * HeroCarousel Component
 * 
 * Displays a full-width hero section with cycling background slides,
 * Ken Burns zoom/pan animation, crossfade transitions, and overlay content.
 */
export function HeroCarousel({ slides, title, subtitle }: HeroCarouselProps): React.ReactElement {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const isWeb = Platform.OS === 'web';
	const scrollY = useScrollOffset();
	const heroHeight = isWeb ? HERO_HEIGHT_WEB : HERO_HEIGHT_MOBILE;

	// Scroll-driven parallax: image moves at 0.3x scroll speed
	const parallaxStyle = useAnimatedStyle(() => {
		if (!scrollY) return {};
		const translateY = interpolate(
			scrollY.value,
			[0, heroHeight],
			[0, heroHeight * 0.3],
			Extrapolate.CLAMP,
		);
		const opacity = interpolate(
			scrollY.value,
			[0, heroHeight * 0.8],
			[1, 0],
			Extrapolate.CLAMP,
		);
		return {
			transform: [{ translateY }],
			opacity,
		};
	});

	// Each layer tracks its own slide index independently.
	// Only the hidden layer's index is updated before a crossfade starts,
	// so the visible layer's image never changes mid-transition.
	const [slideIndexA, setSlideIndexA] = useState(0);
	const [slideIndexB, setSlideIndexB] = useState(1 % slides.length);
	const [activeSlideIndex, setActiveSlideIndex] = useState(0);
	const isLayerAActiveRef = useRef(true);
	const currentSlideRef = useRef(0);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Layer A animation values
	const opacityA = useSharedValue(1);
	const scaleA = useSharedValue(KB_SCALE_FROM);
	const translateXA = useSharedValue(0);
	const translateYA = useSharedValue(0);

	// Layer B animation values
	const opacityB = useSharedValue(0);
	const scaleB = useSharedValue(KB_SCALE_FROM);
	const translateXB = useSharedValue(0);
	const translateYB = useSharedValue(0);

	// Logo watermark pulse animation
	const logoScale = useSharedValue(1);

	const logoAnimatedStyle = useAnimatedStyle(() => ({
		transform: [
			{ scale: logoScale.value },
		],
	}));

	/** Generate random Ken Burns movement parameters */
	const getRandomKBMovement = useCallback(() => ({
		translateX: (Math.random() - 0.5) * 20,
		translateY: (Math.random() - 0.5) * 10,
	}), []);

	/** Start Ken Burns animation on a layer */
	const startKenBurns = useCallback((
		scaleVal: SharedValue<number>,
		txVal: SharedValue<number>,
		tyVal: SharedValue<number>,
	) => {
		const movement = getRandomKBMovement();

		scaleVal.value = KB_SCALE_FROM;
		txVal.value = 0;
		tyVal.value = 0;

		scaleVal.value = withTiming(KB_SCALE_TO, {
			duration: SLIDE_DURATION + CROSSFADE_DURATION,
			easing: Easing.inOut(Easing.ease),
		});
		txVal.value = withTiming(movement.translateX, {
			duration: SLIDE_DURATION + CROSSFADE_DURATION,
			easing: Easing.inOut(Easing.ease),
		});
		tyVal.value = withTiming(movement.translateY, {
			duration: SLIDE_DURATION + CROSSFADE_DURATION,
			easing: Easing.inOut(Easing.ease),
		});
	}, [getRandomKBMovement]);

	/** Transition to the next slide */
	const transitionToNext = useCallback(() => {
		if (slides.length <= 1) return;

		const nextSlide = (currentSlideRef.current + 1) % slides.length;
		currentSlideRef.current = nextSlide;

		if (isLayerAActiveRef.current) {
			// Layer A is visible — set hidden Layer B's content, then crossfade to B
			setSlideIndexB(nextSlide);
			startKenBurns(scaleB, translateXB, translateYB);
			opacityA.value = withTiming(0, { duration: CROSSFADE_DURATION });
			opacityB.value = withTiming(1, { duration: CROSSFADE_DURATION });
		} else {
			// Layer B is visible — set hidden Layer A's content, then crossfade to A
			setSlideIndexA(nextSlide);
			startKenBurns(scaleA, translateXA, translateYA);
			opacityB.value = withTiming(0, { duration: CROSSFADE_DURATION });
			opacityA.value = withTiming(1, { duration: CROSSFADE_DURATION });
		}

		isLayerAActiveRef.current = !isLayerAActiveRef.current;
		setActiveSlideIndex(nextSlide);

		// Prefetch the slide after the one we just transitioned to,
		// so its image is in cache before the next crossfade starts.
		const upcomingSlide = (nextSlide + 1) % slides.length;
		prefetchSlideImage(slides[upcomingSlide]);
	}, [slides, startKenBurns, opacityA, opacityB, scaleA, translateXA, translateYA, scaleB, translateXB, translateYB]);

	// Initialize Ken Burns on first layer and prefetch the second slide
	useEffect(() => {
		startKenBurns(scaleA, translateXA, translateYA);

		// Prefetch the B-layer slide so it's ready for the first crossfade
		if (slides.length > 1) {
			prefetchSlideImage(slides[1 % slides.length]);
		}
	}, [slides]);

	// Start logo pulse animation
	useEffect(() => {
		logoScale.value = withRepeat(
			withSequence(
				withTiming(1.03, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
				withTiming(1.0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
			),
			-1, // infinite
			true,
		);

		return () => {
			cancelAnimation(logoScale);
		};
	}, []);

	// Auto-advance timer
	useEffect(() => {
		if (slides.length <= 1) return;

		timerRef.current = setInterval(() => {
			transitionToNext();
		}, SLIDE_DURATION);

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		};
	}, [transitionToNext, slides.length]);

	// Slides are assigned per-layer via independent state
	const slideA = slides[slideIndexA] ?? slides[0];
	const slideB = slides[slideIndexB] ?? slides[0];

	return (
		<View style={[styles.container, isWeb ? styles.containerWeb : styles.containerMobile]}>
			{/* Parallax wrapper — moves slower than scroll and fades */}
			<AnimView style={[StyleSheet.absoluteFillObject, parallaxStyle]}>
				{/* Layer A */}
				<SlideLayer
					slide={slideA}
					opacity={opacityA}
					scale={scaleA}
					translateX={translateXA}
					translateY={translateYA}
				/>

				{/* Layer B */}
				<SlideLayer
					slide={slideB}
					opacity={opacityB}
					scale={scaleB}
					translateX={translateXB}
					translateY={translateYB}
				/>

				{/* Dark gradient scrim for text readability */}
				<Gradient
					colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.65)']}
					locations={[0, 0.4, 1]}
					style={styles.scrimOverlay}
				/>

				{/* Villains logo watermark */}
				<AnimView
					style={[
						styles.logoWatermark,
						isWeb ? styles.logoWatermarkWeb : styles.logoWatermarkMobile,
						logoAnimatedStyle,
					]}
				>
					<VillainsLogo
						width="100%"
						height="100%"
					/>
				</AnimView>

				{/* Title and subtitle content */}
				<View style={styles.contentOverlay}>
					<Text style={[styles.title, themedStyles.title]}>
						{title}
					</Text>
					<Text style={[styles.subtitle, themedStyles.subtitle]}>
						{subtitle}
					</Text>
				</View>

				{/* Slide indicator dots */}
				{slides.length > 1 && (
					<View style={styles.dotsContainer}>
						{slides.map((_, index) => (
							<View
								key={index}
								style={[
									styles.dot,
									index === activeSlideIndex
										? themedStyles.dotActive
										: themedStyles.dotInactive,
								]}
							/>
						))}
					</View>
				)}
			</AnimView>

			{/* Gradient accent bar — stays fixed, not affected by parallax */}
			<Gradient
				colors={[palette.villains.purple, palette.villains.green]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 0 }}
				style={styles.accentBar}
			/>
		</View>
	);
}
