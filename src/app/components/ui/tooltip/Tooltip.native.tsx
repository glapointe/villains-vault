/**
 * Tooltip - React Native (iOS/Android) Implementation
 *
 * Uses a Modal-based approach with coordinate-corrected positioning:
 * - Measures trigger position before Modal opens using measureInWindow()
 * - Measures a marker View inside the Modal to compute the coordinate offset
 *   between screen space and Modal space (accounts for status bar, etc.)
 * - Arrow rendered using RN border triangle technique with padding approach
 *   (Android clips overflow: 'visible', so padding reserves arrow space)
 * - Hover is not supported on native (hoverEnabled prop is ignored)
 */

import React, { useState, useRef, useCallback } from 'react';
import {
	View,
	Text,
	Pressable,
	ScrollView,
	Modal,
	LayoutChangeEvent,
	StatusBar,
	Platform,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { styles, getThemedStyles, ARROW_SIZE } from './Tooltip.styles';
import type { TooltipProps, InfoTooltipProps, TooltipPlacement, TooltipPosition } from './Tooltip.types';

interface TriggerMeasurement {
	x: number;
	y: number;
	width: number;
	height: number;
}


export const Tooltip: React.FC<TooltipProps> = ({
	children,
	content,
	width = 200,
	maxHeight = 400,
	placement = 'top',
	showArrow = true,
	contentStyle,
	visible: controlledVisible,
	onVisibilityChange,
}) => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);

	const [internalVisible, setInternalVisible] = useState(false);
	const visible = controlledVisible !== undefined ? controlledVisible : internalVisible;

	const [position, setPosition] = useState<TooltipPosition | null>(null);
	const [tooltipHeight, setTooltipHeight] = useState(0);
	const triggerRef = useRef<View>(null);
	const triggerMeasurementRef = useRef<TriggerMeasurement | null>(null);
	const tooltipHeightRef = useRef(0);
	const positionRef = useRef<TooltipPosition | null>(null);

	// Modal coordinate offset tracking — the difference between screen coords
	// (from measureInWindow on the trigger) and Modal-local coords
	const overlayRef = useRef<View>(null);
	const modalOffsetRef = useRef({ x: 0, y: 0 });
	const modalSizeRef = useRef({ width: 0, height: 0 });
	const overlayMeasuredRef = useRef(false);

	/**
	 * Measure the trigger element's position on screen using measureInWindow.
	 * This returns screen-absolute coordinates.
	 */
	const measureTrigger = useCallback((): Promise<TriggerMeasurement | null> => {
		return new Promise((resolve) => {
			if (!triggerRef.current) {
				resolve(null);
				return;
			}
			triggerRef.current.measureInWindow((x, y, w, h) => {
				// On Android, measureInWindow returns coords relative to the app root
				// (below the status bar), but the Modal starts at screen y=0 (behind
				// the status bar). Add StatusBar.currentHeight to convert to screen coords.
				const statusBarOffset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
				const adjustedY = y + statusBarOffset;
				if (typeof x === 'number' && typeof y === 'number') {
					resolve({ x, y: adjustedY, width: w, height: h });
				} else {
					resolve(null);
				}
			});
		});
	}, []);

	/**
	 * Calculate the tooltip position and best placement.
	 * Trigger coordinates must be Modal-relative (already adjusted for offset).
	 * modalW/modalH are the Modal overlay dimensions used for clamping.
	 */
	const calculatePosition = useCallback(
		(trigger: TriggerMeasurement, tipHeight: number, modalW: number, modalH: number) => {
			const margin = 8;
			const arrowGap = showArrow ? ARROW_SIZE : 0;
			const tooltipW = width;
			const tooltipH = tipHeight || maxHeight;

			const candidates: Record<TooltipPlacement, { top: number; left: number }> = {
				top: {
					top: trigger.y - tooltipH - arrowGap,
					left: trigger.x + trigger.width / 2 - tooltipW / 2,
				},
				bottom: {
					top: trigger.y + trigger.height + arrowGap,
					left: trigger.x + trigger.width / 2 - tooltipW / 2,
				},
				left: {
					top: trigger.y + trigger.height / 2 - tooltipH / 2,
					left: trigger.x - tooltipW - arrowGap,
				},
				right: {
					top: trigger.y + trigger.height / 2 - tooltipH / 2,
					left: trigger.x + trigger.width + arrowGap,
				},
			};

			const order: TooltipPlacement[] = [
				placement,
				...(placement === 'top' || placement === 'bottom'
					? (['bottom', 'top', 'right', 'left'] as TooltipPlacement[])
					: (['left', 'right', 'bottom', 'top'] as TooltipPlacement[])
				).filter((p) => p !== placement),
			];

			const fits = (p: TooltipPlacement) => {
				const c = candidates[p];
				return (
					c.top >= margin &&
					c.top + tooltipH <= modalH - margin &&
					c.left >= margin &&
					c.left + tooltipW <= modalW - margin
				);
			};

			let chosen = placement;
			for (const p of order) {
				if (fits(p)) {
					chosen = p;
					break;
				}
			}

			let { top, left } = candidates[chosen];

			// Clamp to modal content bounds
			left = Math.max(margin, Math.min(left, modalW - tooltipW - margin));
			top = Math.max(margin, Math.min(top, modalH - tooltipH - margin));

			// Arrow offset relative to tooltip
			let arrowLeft: number | undefined;
			let arrowTop: number | undefined;
			if (chosen === 'top' || chosen === 'bottom') {
				arrowLeft = trigger.x + trigger.width / 2 - left;
				arrowLeft = Math.max(ARROW_SIZE + 4, Math.min(arrowLeft, tooltipW - ARROW_SIZE - 4));
			} else {
				arrowTop = trigger.y + trigger.height / 2 - top;
				arrowTop = Math.max(ARROW_SIZE + 4, Math.min(arrowTop, tooltipH - ARROW_SIZE - 4));
			}

			// Round to integers to prevent sub-pixel oscillation
			top = Math.round(top);
			left = Math.round(left);
			if (arrowLeft !== undefined) arrowLeft = Math.round(arrowLeft);
			if (arrowTop !== undefined) arrowTop = Math.round(arrowTop);

			// Skip if position hasn't meaningfully changed to prevent re-render oscillation
			// Allow a tolerance of 2px to absorb sub-pixel jitter from layout recalculations
			const prev = positionRef.current;
			const TOLERANCE = 2;
			if (prev &&
				Math.abs(prev.top - top) <= TOLERANCE &&
				Math.abs(prev.left - left) <= TOLERANCE &&
				prev.placement === chosen &&
				Math.abs((prev.arrowLeft ?? 0) - (arrowLeft ?? 0)) <= TOLERANCE &&
				Math.abs((prev.arrowTop ?? 0) - (arrowTop ?? 0)) <= TOLERANCE) {
				return;
			}

			const newPos: TooltipPosition = { top, left, placement: chosen, arrowLeft, arrowTop };
			positionRef.current = newPos;
			setPosition(newPos);
		},
		[placement, showArrow, width, maxHeight],
	);

	/**
	 * Recalculate position using stored measurements.
	 * Only runs when all required data is available (trigger measured,
	 * overlay measured, tooltip content laid out).
	 */
	const recalculate = useCallback(() => {
		const trigger = triggerMeasurementRef.current;
		const h = tooltipHeightRef.current;
		if (!trigger || !overlayMeasuredRef.current || h <= 0) {
			return;
		}

		const offset = modalOffsetRef.current;
		const size = modalSizeRef.current;

		// Convert trigger screen-coordinates to Modal-relative coordinates
		const adjusted: TriggerMeasurement = {
			...trigger,
			x: trigger.x - offset.x,
			y: trigger.y - offset.y,
		};

		calculatePosition(adjusted, h, size.width, size.height);
	}, [calculatePosition]);

	/**
	 * Show tooltip: measure trigger position, then open Modal.
	 * Actual positioning happens after the Modal renders and we can
	 * measure the coordinate offset.
	 */
	const show = useCallback(async () => {
		const trigger = await measureTrigger();
		if (!trigger) return;

		triggerMeasurementRef.current = trigger;
		overlayMeasuredRef.current = false;

		if (controlledVisible === undefined) setInternalVisible(true);
		onVisibilityChange?.(true);
	}, [measureTrigger, controlledVisible, onVisibilityChange]);

	const hide = useCallback(() => {
		if (controlledVisible === undefined) setInternalVisible(false);
		onVisibilityChange?.(false);
		positionRef.current = null;
		tooltipHeightRef.current = 0;
		setPosition(null);
		setTooltipHeight(0);
		overlayMeasuredRef.current = false;
	}, [controlledVisible, onVisibilityChange]);

	const toggle = useCallback(() => {
		if (visible) hide();
		else show();
	}, [visible, show, hide]);

	/**
	 * Called when the inner measurement View in the Modal renders.
	 * Measures its window position to determine the coordinate offset
	 * between screen space and Modal space (e.g., status bar height).
	 */
	const handleOverlayLayout = useCallback(
		(e: LayoutChangeEvent) => {
			// Skip re-measurement if already positioned to prevent oscillation
			if (overlayMeasuredRef.current && positionRef.current) return;

			const { width: w, height: h, x: lx, y: ly } = e.nativeEvent.layout;
			modalSizeRef.current = { width: w, height: h };

			overlayRef.current?.measureInWindow((x, y, mw, mh) => {
				if (typeof x === 'number' && typeof y === 'number') {
					modalOffsetRef.current = { x, y };
					overlayMeasuredRef.current = true;
					recalculate();
				}
			});
		},
		[recalculate],
	);

	/**
	 * Callback for onLayout of the tooltip content, to measure its real height.
	 */
	const handleTooltipLayout = useCallback(
		(event: { nativeEvent: { layout: { height: number; width: number } } }) => {
			const h = event.nativeEvent.layout.height;
			const w = event.nativeEvent.layout.width;
			// Round to nearest integer to prevent infinite oscillation from sub-pixel differences
			const rounded = Math.round(h);
			const prevRounded = tooltipHeightRef.current;
			if (rounded !== prevRounded && rounded > 0) {
				tooltipHeightRef.current = rounded;
				setTooltipHeight(rounded);
				recalculate();
			}
		},
		[recalculate],
	);

	/**
	 * Render arrow using a rotated square technique.
	 * Rendered as an independent View in the overlay (not inside the wrapper)
	 * to avoid Android overflow clipping and zIndex issues.
	 * Positioned to slightly overlap the container edge for a seamless look.
	 */
	const renderArrow = () => {
		if (!showArrow || !position) return null;

		const p = position.placement;
		const size = ARROW_SIZE * 1.85; // visual arrow size (rotated square)
		const overlap = 0; // pixels of overlap with container to prevent gap

		let arrowTop = 0;
		let arrowLeft = 0;

		if (p === 'top') {
			// Arrow below the tooltip, pointing down — center pushed inside container bottom
			arrowTop = position.top + tooltipHeight - size / 2 - overlap;
			arrowLeft = position.left + (position.arrowLeft ?? width / 2) - size / 2;
		} else if (p === 'bottom') {
			// Arrow above the tooltip, pointing up — center pushed inside container top
			arrowTop = position.top - size / 2 + overlap;
			arrowLeft = position.left + (position.arrowLeft ?? width / 2) - size / 2;
		} else if (p === 'left') {
			// Arrow to the right of tooltip, pointing right
			arrowTop = position.top + (position.arrowTop ?? 0) - size / 2;
			arrowLeft = position.left + width - size / 2 + overlap;
		} else if (p === 'right') {
			// Arrow to the left of tooltip, pointing left — center pushed inside container left
			arrowTop = position.top + (position.arrowTop ?? 0) - size / 2;
			arrowLeft = position.left - size / 2 + overlap;
		}

		return (
			<View
				style={{
					position: 'absolute',
					top: arrowTop,
					left: arrowLeft,
					width: size,
					height: size,
					...themedStyles.arrowBackground,
					transform: [{ rotate: '45deg' }],
					zIndex: 10,
					elevation: 0,
					opacity: position ? 1 : 0,
				}}
			/>
		);
	};

	return (
		<>
			<Text>
				<Pressable ref={triggerRef} onPress={toggle} style={styles.triggerPressable}>
					{children}
				</Pressable>
			</Text>
			<Modal
				visible={visible}
				transparent
				animationType="fade"
				onRequestClose={hide}
			>
				{/* Overlay that closes tooltip on press */}
				<Pressable
					style={styles.modalOverlay}
					onPress={hide}
				>
					{/* Inner View measures its position to compute the coordinate
					    offset between screen space and Modal space */}
					<View
						ref={overlayRef}
						style={{ flex: 1 }}
						pointerEvents="box-none"
						onLayout={handleOverlayLayout}
					>
						
						{/* Tooltip container positioned absolutely */}
						<View
							style={[
								styles.tooltipWrapper,
								{
									position: 'absolute',
									top: position?.top ?? -9999,
									left: position?.left ?? -9999,
									width,
									opacity: position ? 1 : 0,
								},
							]}
							// Prevent touches inside tooltip from closing it
							onStartShouldSetResponder={() => true}
						>
							<View
								style={[
									styles.tooltipContainer,
									themedStyles.tooltipContainer,
									{ maxHeight },
								]}
								onLayout={handleTooltipLayout}
							>
								<ScrollView
									style={styles.scrollView}
									contentContainerStyle={styles.scrollViewContent}
									showsVerticalScrollIndicator
								>
									<View style={[styles.contentContainer, contentStyle]}>
										{typeof content === 'string' ? (
											<Text style={[styles.contentText, themedStyles.contentText]}>
												{content}
											</Text>
										) : (
											content
										)}
									</View>
								</ScrollView>
							</View>
						</View>
						{/* Arrow rendered AFTER container so it draws on top */}
						{renderArrow()}
					</View>
				</Pressable>
			</Modal>
		</>
	);
};

/**
 * InfoTooltip Component (Native)
 *
 * Convenience wrapper for simple icon-based tooltips.
 * Hover is disabled on native.
 */
export const InfoTooltip: React.FC<InfoTooltipProps> = ({
	tooltip,
	maxWidth = 200,
	placement = 'top',
}) => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);

	if (!tooltip) return null;

	return (
		<Tooltip
			content={tooltip}
			width={maxWidth}
			hoverEnabled={false}
			placement={placement}
		>
			<Text style={[styles.infoIcon, themedStyles.infoIcon]}>&#9432;</Text>
		</Tooltip>
	);
};
