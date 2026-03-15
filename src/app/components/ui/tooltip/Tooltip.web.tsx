/**
 * Tooltip - Web Implementation
 * 
 * Uses a Portal-based approach with pure DOM positioning for reliable behavior:
 * - Uses getBoundingClientRect() for accurate scroll-aware positioning
 * - No Modal — tooltip is rendered as a fixed-position overlay via Portal
 * - Native click-through: backdrop uses pointer-events CSS so clicks pass through
 * - Hover support with debounce
 * - Arrow pointer with correct placement
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
	View,
	Text,
	Pressable,
	ScrollView
} from 'react-native';
import { createPortal } from 'react-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { styles, getThemedStyles, ARROW_SIZE } from './Tooltip.styles';
import type { TooltipProps, InfoTooltipProps, TooltipPlacement, TooltipPosition } from './Tooltip.types';

export const Tooltip: React.FC<TooltipProps> = ({
	children,
	content,
	width = 200,
	maxHeight = 400,
	placement = 'top',
	showArrow = true,
	hoverEnabled = false,
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
	const triggerRef = useRef<HTMLDivElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);
	const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	/**
	 * Calculate best placement and position using getBoundingClientRect
	 */
	const calculatePosition = useCallback(() => {
		const triggerEl = triggerRef.current;
		const tooltipEl = tooltipRef.current;
		if (!triggerEl || !tooltipEl) return;

		const triggerRect = triggerEl.getBoundingClientRect();
		const tooltipRect = tooltipEl.getBoundingClientRect();
		const margin = 8;
		const arrowGap = showArrow ? ARROW_SIZE : 0;
		const viewportW = window.innerWidth;
		const viewportH = window.innerHeight;

		const tooltipW = tooltipRect.width || width;
		const tooltipH = tooltipRect.height;

		// Build candidate positions
		const candidates: Record<TooltipPlacement, { top: number; left: number }> = {
			top: {
				top: triggerRect.top - tooltipH - arrowGap,
				left: triggerRect.left + triggerRect.width / 2 - tooltipW / 2,
			},
			bottom: {
				top: triggerRect.bottom + arrowGap,
				left: triggerRect.left + triggerRect.width / 2 - tooltipW / 2,
			},
			left: {
				top: triggerRect.top + triggerRect.height / 2 - tooltipH / 2,
				left: triggerRect.left - tooltipW - arrowGap,
			},
			right: {
				top: triggerRect.top + triggerRect.height / 2 - tooltipH / 2,
				left: triggerRect.right + arrowGap,
			},
		};

		// Determine fallback order
		const order: TooltipPlacement[] = [
			placement,
			...(placement === 'top' || placement === 'bottom'
				? (['bottom', 'top', 'right', 'left'] as TooltipPlacement[])
				: (['left', 'right', 'bottom', 'top'] as TooltipPlacement[])
			).filter(p => p !== placement),
		];

		// Helper to check if the tooltip fits
		const fits = (p: TooltipPlacement) => {
			const c = candidates[p];
			return (
				c.top >= margin &&
				c.top + tooltipH <= viewportH - margin &&
				c.left >= margin &&
				c.left + tooltipW <= viewportW - margin
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

		// Clamp to viewport
		left = Math.max(margin, Math.min(left, viewportW - tooltipW - margin));
		top = Math.max(margin, Math.min(top, viewportH - tooltipH - margin));

		// Arrow position relative to tooltip
		let arrowLeft: number | undefined;
		let arrowTop: number | undefined;
		if (chosen === 'top' || chosen === 'bottom') {
			// Arrow horizontal center should align with trigger center
			arrowLeft = triggerRect.left + triggerRect.width / 2 - left;
			// Clamp arrow within tooltip bounds
			arrowLeft = Math.max(ARROW_SIZE + 4, Math.min(arrowLeft, tooltipW - ARROW_SIZE - 4));
		} else {
			// Arrow vertical center should align with trigger center
			arrowTop = triggerRect.top + triggerRect.height / 2 - top;
			arrowTop = Math.max(ARROW_SIZE + 4, Math.min(arrowTop, tooltipH - ARROW_SIZE - 4));
		}

		setPosition({ top, left, placement: chosen, arrowLeft, arrowTop });
	}, [placement, showArrow, width]);

	// Recalculate position when visible
	useEffect(() => {
		if (visible) {
			// Use requestAnimationFrame to wait for the tooltip to render (so we can measure it)
			requestAnimationFrame(() => {
				calculatePosition();
			});
		} else {
			setPosition(null);
		}
	}, [visible, calculatePosition]);

	// Close on scroll or resize
	useEffect(() => {
		if (!visible) return;

		const handleDismiss = () => {
			setInternalVisible(false);
			onVisibilityChange?.(false);
			setPosition(null);
		};

		// Recalculate on scroll, but close if trigger scrolled off screen
		const handleScroll = () => {
			const triggerEl = triggerRef.current;
			if (triggerEl) {
				const rect = triggerEl.getBoundingClientRect();
				const offScreen =
					rect.bottom < 0 ||
					rect.top > window.innerHeight ||
					rect.right < 0 ||
					rect.left > window.innerWidth;
				if (offScreen) {
					handleDismiss();
					return;
				}
			}
			calculatePosition();
		};

		window.addEventListener('scroll', handleScroll, true);
		window.addEventListener('resize', handleDismiss);

		return () => {
			window.removeEventListener('scroll', handleScroll, true);
			window.removeEventListener('resize', handleDismiss);
		};
	}, [visible, calculatePosition, onVisibilityChange]);

	// Close on outside click (with click-through)
	useEffect(() => {
		if (!visible) return;

		const handleClickOutside = (e: MouseEvent) => {
			const tooltipEl = tooltipRef.current;
			const triggerEl = triggerRef.current;

			// If click is inside tooltip or trigger, ignore
			if (tooltipEl && tooltipEl.contains(e.target as Node)) return;
			if (triggerEl && triggerEl.contains(e.target as Node)) return;

			// Close the tooltip — the click naturally propagates to whatever was clicked
			setInternalVisible(false);
			onVisibilityChange?.(false);
			setPosition(null);
		};

		// Use capture phase so we hear the click before any other handler
		// but do NOT stopPropagation so the click passes through
		document.addEventListener('mousedown', handleClickOutside, true);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside, true);
		};
	}, [visible, onVisibilityChange]);

	const show = useCallback(() => {
		if (controlledVisible === undefined) setInternalVisible(true);
		onVisibilityChange?.(true);
	}, [controlledVisible, onVisibilityChange]);

	const hide = useCallback(() => {
		if (controlledVisible === undefined) setInternalVisible(false);
		onVisibilityChange?.(false);
		setPosition(null);
	}, [controlledVisible, onVisibilityChange]);

	const toggle = useCallback(() => {
		if (visible) hide();
		else show();
	}, [visible, show, hide]);

	// Hover handlers
	const handleMouseEnter = useCallback(() => {
		if (!hoverEnabled) return;
		clearTimeout(hoverTimeoutRef.current);
		hoverTimeoutRef.current = setTimeout(show, 200);
	}, [hoverEnabled, show]);

	const handleMouseLeave = useCallback(() => {
		if (!hoverEnabled) return;
		clearTimeout(hoverTimeoutRef.current);
		hoverTimeoutRef.current = setTimeout(hide, 400);
	}, [hoverEnabled, hide]);

	const handleTooltipMouseEnter = useCallback(() => {
		if (!hoverEnabled) return;
		clearTimeout(hoverTimeoutRef.current);
	}, [hoverEnabled]);

	const handleTooltipMouseLeave = useCallback(() => {
		if (!hoverEnabled) return;
		clearTimeout(hoverTimeoutRef.current);
		hoverTimeoutRef.current = setTimeout(hide, 400);
	}, [hoverEnabled, hide]);

	// Cleanup
	useEffect(() => {
		return () => clearTimeout(hoverTimeoutRef.current);
	}, []);

	// Render arrow
	const renderArrow = () => {
		if (!showArrow || !position) return null;

		const p = position.placement;
		const arrowColor = colors.surfaceElevated;

		const arrowBaseStyle: React.CSSProperties = {
			position: 'absolute',
			width: 0,
			height: 0,
			borderStyle: 'solid',
		};

		let arrowSpecificStyle: React.CSSProperties = {};

		if (p === 'top') {
			// Arrow at bottom of tooltip, pointing down toward trigger
			arrowSpecificStyle = {
				bottom: -ARROW_SIZE,
				left: (position.arrowLeft ?? width / 2) - ARROW_SIZE,
				borderTopWidth: ARROW_SIZE,
				borderRightWidth: ARROW_SIZE,
				borderBottomWidth: 0,
				borderLeftWidth: ARROW_SIZE,
				borderTopColor: arrowColor,
				borderRightColor: 'transparent',
				borderBottomColor: 'transparent',
				borderLeftColor: 'transparent',
			};
		} else if (p === 'bottom') {
			// Arrow at top of tooltip, pointing up toward trigger
			arrowSpecificStyle = {
				top: -ARROW_SIZE,
				left: (position.arrowLeft ?? width / 2) - ARROW_SIZE,
				borderTopWidth: 0,
				borderRightWidth: ARROW_SIZE,
				borderBottomWidth: ARROW_SIZE,
				borderLeftWidth: ARROW_SIZE,
				borderTopColor: 'transparent',
				borderRightColor: 'transparent',
				borderBottomColor: arrowColor,
				borderLeftColor: 'transparent',
			};
		} else if (p === 'left') {
			// Arrow at right of tooltip, pointing right toward trigger
			arrowSpecificStyle = {
				right: -ARROW_SIZE,
				top: (position.arrowTop ?? 0) - ARROW_SIZE,
				borderTopWidth: ARROW_SIZE,
				borderRightWidth: 0,
				borderBottomWidth: ARROW_SIZE,
				borderLeftWidth: ARROW_SIZE,
				borderTopColor: 'transparent',
				borderRightColor: 'transparent',
				borderBottomColor: 'transparent',
				borderLeftColor: arrowColor,
			};
		} else if (p === 'right') {
			// Arrow at left of tooltip, pointing left toward trigger
			arrowSpecificStyle = {
				left: -ARROW_SIZE,
				top: (position.arrowTop ?? 0) - ARROW_SIZE,
				borderTopWidth: ARROW_SIZE,
				borderRightWidth: ARROW_SIZE,
				borderBottomWidth: ARROW_SIZE,
				borderLeftWidth: 0,
				borderTopColor: 'transparent',
				borderRightColor: arrowColor,
				borderBottomColor: 'transparent',
				borderLeftColor: 'transparent',
			};
		}

		return <div style={{ ...arrowBaseStyle, ...arrowSpecificStyle }} />;
	};

	// Tooltip content rendered as a portal attached to document.body
	const renderTooltip = () => {
		if (!visible) return null;

		const tooltipStyle: React.CSSProperties = {
			position: 'fixed',
			top: position?.top ?? -9999,
			left: position?.left ?? -9999,
			width,
			maxHeight,
			opacity: position ? 1 : 0,
			zIndex: 99999,
			// Transition for smooth appearance after reposition
			transition: 'opacity 0.15s ease-in-out',
		};

		return createPortal(
			<div
				ref={tooltipRef}
				style={tooltipStyle}
				onMouseEnter={hoverEnabled ? handleTooltipMouseEnter : undefined}
				onMouseLeave={hoverEnabled ? handleTooltipMouseLeave : undefined}
			>
				{renderArrow()}
				<View
					style={[
						styles.tooltipContainer,
						themedStyles.tooltipContainer,
						{ maxHeight },
					]}
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
			</div>,
			document.body,
		);
	};

	return (
		<>
			<div
				ref={triggerRef}
				onMouseEnter={hoverEnabled ? handleMouseEnter : undefined}
				onMouseLeave={hoverEnabled ? handleMouseLeave : undefined}
				style={{ display: 'inline-flex', width: 'fit-content' }}
			>
				<Pressable onPress={toggle} style={styles.triggerPressable}>
					{children}
				</Pressable>
			</div>
			{renderTooltip()}
		</>
	);
};

/**
 * InfoTooltip Component (Web)
 * 
 * Convenience wrapper for simple icon-based tooltips
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
			hoverEnabled={true}
			placement={placement}
		>
			<Text style={[styles.infoIcon, themedStyles.infoIcon]}>&#9432;</Text>
		</Tooltip>
	);
};
