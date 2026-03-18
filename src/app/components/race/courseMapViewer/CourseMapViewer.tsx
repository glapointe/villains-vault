/**
 * Course Map Viewer Component
 *
 * Renders a compact thumbnail for a race's course map image.
 * Tapping/clicking the thumbnail opens a fixed-size lightbox with:
 *   - Web: +/− zoom buttons + mouse drag-to-pan via CSS transform
 *   - Native: pinch-to-zoom + drag-to-pan via RNGH + Reanimated; double-tap to reset
 *
 * The dialog has a fixed size on both platforms — it never resizes when zooming.
 * Fetches its own data given a raceId — no parent state required.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { Image, Modal, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

/** Typed wrapper to fix Animated.View children type issue with reanimated v4 */
const AnimatedView = Animated.View as React.ComponentType<any>;

import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { api } from '../../../services/api';
import type { CourseMapImage } from '../../../models';
import {
    styles,
    getThemedStyles,
    THUMBNAIL_HEIGHT,
    getCardDimensions,
} from './CourseMapViewer.styles';

export interface CourseMapViewerProps {
    /** Numeric race ID used to fetch the course map */
    raceId: number;
}

/**
 * Course Map Viewer
 *
 * Renders the course map thumbnail inline and manages its own lightbox state.
 * Returns null when no course map image exists for the race.
 */
export function CourseMapViewer({ raceId }: CourseMapViewerProps): React.ReactElement | null {
    const { isDark } = useTheme();
    const colors = getThemedColors(isDark);
    const themedStyles = useMemo(() => getThemedStyles(colors), [colors]);

    // Live dimensions — updates automatically on rotation.
    const { width: winWidth, height: winHeight } = useWindowDimensions();
    const { cardWidth, cardHeight, bodyHeight } = useMemo(
        () => getCardDimensions(winWidth, winHeight),
        [winWidth, winHeight],
    );

    const [courseMap, setCourseMap] = useState<CourseMapImage | null>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    // ── Web zoom + pan state ──────────────────────────────────────────────────
    const [webZoom, setWebZoom] = useState(1);
    const [webPanX, setWebPanX] = useState(0);
    const [webPanY, setWebPanY] = useState(0);
    const webDragRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
    const isDraggingRef = useRef(false);

    // Clamp pan whenever zoom decreases so the image never ends up stranded
    // outside the visible area. At zoom=1 the max is 0, which recenters the image.
    useEffect(() => {
        const maxX = cardWidth * (webZoom - 1) / 2;
        const maxY = bodyHeight * (webZoom - 1) / 2;
        setWebPanX(px => Math.max(-maxX, Math.min(maxX, px)));
        setWebPanY(py => Math.max(-maxY, Math.min(maxY, py)));
    }, [webZoom, cardWidth, bodyHeight]);

    // ── Native pinch + pan (RNGH + Reanimated) ───────────────────────────────
    // Hooks must be called unconditionally — they're no-ops on web.
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedX = useSharedValue(0);
    const savedY = useSharedValue(0);

    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            scale.value = Math.max(1, Math.min(5, savedScale.value * e.scale));
        })
        .onEnd(() => {
            savedScale.value = scale.value;
        });

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            const maxX = cardWidth * (scale.value - 1) / 2;
            const maxY = bodyHeight * (scale.value - 1) / 2;
            translateX.value = Math.max(-maxX, Math.min(maxX, savedX.value + e.translationX));
            translateY.value = Math.max(-maxY, Math.min(maxY, savedY.value + e.translationY));
        })
        .onEnd(() => {
            savedX.value = translateX.value;
            savedY.value = translateY.value;
        });

    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            scale.value = withTiming(1);
            savedScale.value = 1;
            translateX.value = withTiming(0);
            translateY.value = withTiming(0);
            savedX.value = 0;
            savedY.value = 0;
        });

    // Simultaneous so pinch and pan work at the same time;
    // Race with doubleTap so a two-finger tap doesn't trigger double-tap reset.
    const composedGesture = Gesture.Race(
        Gesture.Simultaneous(pinchGesture, panGesture),
        doubleTapGesture,
    );

    const nativeAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    /** Closes the lightbox and resets all zoom/pan state */
    const closeLightbox = () => {
        setLightboxOpen(false);
        // Web
        setWebZoom(1);
        setWebPanX(0);
        setWebPanY(0);
        // Native (run on JS thread — values reset before next open)
        scale.value = 1;
        savedScale.value = 1;
        translateX.value = 0;
        translateY.value = 0;
        savedX.value = 0;
        savedY.value = 0;
    };

    /** Card header — identical on web and native */
    const renderCardHeader = () => (
        <View style={[styles.cardHeader, themedStyles.cardHeader]}>
            <Text style={[styles.cardTitle, themedStyles.cardTitle]}>
                Course Map
            </Text>
            <View style={styles.cardControls}>
                {Platform.OS === 'web' && (
                    <>
                        <Pressable
                            style={[styles.zoomButton, themedStyles.zoomButton]}
                            onPress={() => setWebZoom(z => Math.max(1, z - 0.5))}
                            accessibilityLabel="Zoom out"
                        >
                            <Text style={[styles.zoomButtonText, themedStyles.zoomButtonText]}>−</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.zoomButton, themedStyles.zoomButton]}
                            onPress={() => setWebZoom(z => Math.min(8, z + 0.5))}
                            accessibilityLabel="Zoom in"
                        >
                            <Text style={[styles.zoomButtonText, themedStyles.zoomButtonText]}>+</Text>
                        </Pressable>
                    </>
                )}
                <Pressable
                    style={[styles.closeButton, themedStyles.closeButton]}
                    onPress={closeLightbox}
                    accessibilityLabel="Close course map"
                    accessibilityRole="button"
                >
                    <Text style={[styles.closeText, themedStyles.closeText]}>✕</Text>
                </Pressable>
            </View>
        </View>
    );

    useEffect(() => {
        const fetchCourseMap = async () => {
            try {
                const map = await api.races.getCourseMap(raceId);
                setCourseMap(map);
            } catch {
                // Course map is optional — silently ignore errors
            }
        };

        fetchCourseMap();
    }, [raceId]);

    if (!courseMap) return null;

    const thumbnailWidth = Math.round(THUMBNAIL_HEIGHT * (courseMap.aspectRatio || 4 / 3));

    // Clamp web pan so the image edge can't be dragged past the container edge.
    const clampWebPan = (px: number, py: number, zoom: number) => ({
        x: Math.max(-(cardWidth * (zoom - 1) / 2), Math.min(cardWidth * (zoom - 1) / 2, px)),
        y: Math.max(-(bodyHeight * (zoom - 1) / 2), Math.min(bodyHeight * (zoom - 1) / 2, py)),
    });

    const imageSize = { width: cardWidth, height: bodyHeight };
    const cardSize = { width: cardWidth, height: cardHeight };

    return (
        <>
            {/* ── Inline thumbnail ─────────────────────────────────────────── */}
            <Pressable
                onPress={() => setLightboxOpen(true)}
                style={({ pressed }) => [
                    styles.thumbnailWrapper,
                    themedStyles.thumbnailWrapper,
                    { width: thumbnailWidth },
                    pressed && styles.thumbnailPressed,
                ]}
                accessibilityLabel="View course map"
                accessibilityRole="button"
            >
                <Image
                    source={{ uri: courseMap.thumbnailUrl }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                />
            </Pressable>

            {/* ── Full-screen lightbox ──────────────────────────────────────── */}
            <Modal
                visible={lightboxOpen}
                transparent
                animationType="fade"
                onRequestClose={closeLightbox}
                statusBarTranslucent
            >
                {Platform.OS === 'web' ? (
                    // ── Web lightbox ──────────────────────────────────────────
                    // Card is fixed size. Image uses CSS transform: translate + scale
                    // so zoom buttons never shift the header position.
                    <Pressable style={styles.overlay} onPress={closeLightbox}>
                        <Pressable style={[styles.card, themedStyles.card, cardSize]} onPress={e => e.stopPropagation()}>
                            {renderCardHeader()}
                            {/* Fixed-size clip container — overflow hidden keeps zoomed image inside */}
                            <div
                                style={{
                                    width: cardWidth,
                                    height: bodyHeight,
                                    overflow: 'hidden',
                                    cursor: webZoom > 1
                                        ? (isDraggingRef.current ? 'grabbing' : 'grab')
                                        : 'default',
                                    userSelect: 'none',
                                }}
                                onMouseDown={(e: any) => {
                                    if (webZoom <= 1) return;
                                    isDraggingRef.current = true;
                                    webDragRef.current = {
                                        startX: e.clientX,
                                        startY: e.clientY,
                                        panX: webPanX,
                                        panY: webPanY,
                                    };
                                    e.preventDefault();
                                }}
                                onMouseMove={(e: any) => {
                                    if (!webDragRef.current) return;
                                    const dx = e.clientX - webDragRef.current.startX;
                                    const dy = e.clientY - webDragRef.current.startY;
                                    const clamped = clampWebPan(
                                        webDragRef.current.panX + dx,
                                        webDragRef.current.panY + dy,
                                        webZoom,
                                    );
                                    setWebPanX(clamped.x);
                                    setWebPanY(clamped.y);
                                }}
                                onMouseUp={() => {
                                    webDragRef.current = null;
                                    isDraggingRef.current = false;
                                }}
                                onMouseLeave={() => {
                                    webDragRef.current = null;
                                    isDraggingRef.current = false;
                                }}
                            >
                                <img
                                    src={courseMap.fullUrl}
                                    alt="Course map"
                                    style={{
                                        width: cardWidth,
                                        height: bodyHeight,
                                        objectFit: 'contain',
                                        display: 'block',
                                        // translate then scale: pan coords are in screen pixels
                                        transform: `translate(${webPanX}px, ${webPanY}px) scale(${webZoom})`,
                                        transformOrigin: 'center center',
                                        pointerEvents: 'none',
                                    } as any}
                                    draggable={false}
                                />
                            </div>
                        </Pressable>
                    </Pressable>
                ) : (
                    // ── Native lightbox ───────────────────────────────────────
                    // The outer View is full-screen with flex centering.
                    // GestureHandlerRootView is wrapped in a fixed-size View so it
                    // can't expand to fill the screen (its default is flex:1), which
                    // would push the card to the top instead of centering it.
                    <View style={styles.overlay}>
                        <Pressable style={styles.overlayBackdrop} onPress={closeLightbox} />
                        <View style={cardSize}>
                            <GestureHandlerRootView>
                                <View
                                    style={[styles.card, themedStyles.card, cardSize]}
                                    onStartShouldSetResponder={() => true}
                                >
                                    {renderCardHeader()}
                                    {/* imageBody clips the zoomed/panned content */}
                                    <View style={[styles.imageBody, imageSize]}>
                                        <GestureDetector gesture={composedGesture}>
                                            <AnimatedView style={[imageSize, nativeAnimatedStyle]}>
                                                <Image
                                                    source={{ uri: courseMap.fullUrl }}
                                                    style={imageSize}
                                                    resizeMode="contain"
                                                />
                                            </AnimatedView>
                                        </GestureDetector>
                                    </View>
                                </View>
                            </GestureHandlerRootView>
                        </View>
                    </View>
                )}
            </Modal>
        </>
    );
}
