/**
 * Course Map Viewer Component
 *
 * Renders a compact thumbnail for a race's course map image.
 * Tapping/clicking the thumbnail opens a full-screen lightbox with:
 *   - Web: +/− zoom controls and pointer drag-to-pan
 *   - Native: pinch-to-zoom via ScrollView
 *
 * Fetches its own data given a raceId — no parent state required.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { api } from '../../../services/api';
import type { CourseMapImage } from '../../../models';
import { styles, getThemedStyles, THUMBNAIL_HEIGHT } from './CourseMapViewer.styles';

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

    const [courseMap, setCourseMap] = useState<CourseMapImage | null>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxZoom, setLightboxZoom] = useState(1);

    /** Tracks pointer position for drag-to-pan on web */
    const panRef = useRef<{
        scrollLeft: number;
        scrollTop: number;
        startX: number;
        startY: number;
    } | null>(null);

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
                onRequestClose={() => setLightboxOpen(false)}
                statusBarTranslucent
            >
                {/* Backdrop — tap outside card to dismiss */}
                <Pressable
                    style={styles.overlay}
                    onPress={() => setLightboxOpen(false)}
                >
                    {/* Card — stop propagation so tapping inside doesn't close */}
                    <Pressable
                        style={[styles.card, themedStyles.card]}
                        onPress={e => e.stopPropagation()}
                    >
                        {/* Card Header */}
                        <View style={[styles.cardHeader, themedStyles.cardHeader]}>
                            <Text style={[styles.cardTitle, themedStyles.cardTitle]}>
                                Course Map
                            </Text>
                            <View style={styles.cardControls}>
                                {/* Zoom controls — web only; native uses pinch */}
                                {Platform.OS === 'web' && (
                                    <>
                                        <Pressable
                                            style={[styles.zoomButton, themedStyles.zoomButton]}
                                            onPress={() => setLightboxZoom(z => Math.max(0.5, z - 0.5))}
                                            accessibilityLabel="Zoom out"
                                        >
                                            <Text style={[styles.zoomButtonText, themedStyles.zoomButtonText]}>−</Text>
                                        </Pressable>
                                        <Pressable
                                            style={[styles.zoomButton, themedStyles.zoomButton]}
                                            onPress={() => setLightboxZoom(z => Math.min(8, z + 0.5))}
                                            accessibilityLabel="Zoom in"
                                        >
                                            <Text style={[styles.zoomButtonText, themedStyles.zoomButtonText]}>+</Text>
                                        </Pressable>
                                    </>
                                )}
                                <Pressable
                                    style={[styles.closeButton, themedStyles.closeButton]}
                                    onPress={() => setLightboxOpen(false)}
                                    accessibilityLabel="Close course map"
                                    accessibilityRole="button"
                                >
                                    <Text style={[styles.closeText, themedStyles.closeText]}>✕</Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Image body */}
                        {Platform.OS === 'web' ? (
                            // Web: overflow-scroll container with pointer drag-to-pan
                            <div
                                style={{
                                    overflow: 'auto',
                                    flex: 1,
                                    cursor: lightboxZoom > 1 ? 'grab' : 'default',
                                }}
                                onMouseDown={(e: any) => {
                                    const div = e.currentTarget;
                                    panRef.current = {
                                        scrollLeft: div.scrollLeft,
                                        scrollTop: div.scrollTop,
                                        startX: e.clientX,
                                        startY: e.clientY,
                                    };
                                    div.style.cursor = 'grabbing';
                                    e.preventDefault();
                                }}
                                onMouseMove={(e: any) => {
                                    if (!panRef.current) return;
                                    const div = e.currentTarget;
                                    div.scrollLeft = panRef.current.scrollLeft - (e.clientX - panRef.current.startX);
                                    div.scrollTop = panRef.current.scrollTop - (e.clientY - panRef.current.startY);
                                }}
                                onMouseUp={(e: any) => {
                                    panRef.current = null;
                                    e.currentTarget.style.cursor = lightboxZoom > 1 ? 'grab' : 'default';
                                }}
                                onMouseLeave={(e: any) => {
                                    panRef.current = null;
                                    e.currentTarget.style.cursor = lightboxZoom > 1 ? 'grab' : 'default';
                                }}
                            >
                                <img
                                    src={courseMap.fullUrl}
                                    alt="Course map"
                                    style={{
                                        display: 'block',
                                        width: `${lightboxZoom * 100}%`,
                                        height: 'auto',
                                        userSelect: 'none',
                                        pointerEvents: 'none',
                                    }}
                                    draggable={false}
                                />
                            </div>
                        ) : (
                            // Native: pinch-to-zoom + scroll-to-pan via ScrollView
                            <ScrollView
                                style={styles.scrollView}
                                contentContainerStyle={styles.scrollContent}
                                minimumZoomScale={1}
                                maximumZoomScale={5}
                                showsHorizontalScrollIndicator={false}
                                showsVerticalScrollIndicator={false}
                                centerContent
                            >
                                <Image
                                    source={{ uri: courseMap.fullUrl }}
                                    style={styles.fullImage}
                                    resizeMode="contain"
                                />
                            </ScrollView>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}
