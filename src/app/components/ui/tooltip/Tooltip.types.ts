/**
 * Shared types for the Tooltip component
 * Used by both web and native implementations
 */

import type { ViewStyle } from 'react-native';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipPosition {
	top: number;
	left: number;
	placement: TooltipPlacement;
	arrowLeft?: number;
	arrowTop?: number;
}

export interface TooltipProps {
	/** The element that triggers the tooltip */
	children: React.ReactNode;
	/** Tooltip content - can be string or custom React node */
	content: React.ReactNode;
	/** Width of tooltip popover (default: 200) */
	width?: number;
	/** Maximum height of tooltip content (default: 300) */
	maxHeight?: number;
	/** Preferred placement (will auto-adjust if doesn't fit) */
	placement?: TooltipPlacement;
	/** Show arrow pointer (default: true) */
	showArrow?: boolean;
	/** Enable hover to show tooltip (web only, default: false) */
	hoverEnabled?: boolean;
	/** Additional content style */
	contentStyle?: ViewStyle;
	/** Manually control visibility */
	visible?: boolean;
	/** Callback when visibility changes */
	onVisibilityChange?: (visible: boolean) => void;
}

export interface InfoTooltipProps {
	/** Tooltip text content */
	tooltip?: string;
	/** Tooltip content width (default: 200) */
	maxWidth?: number;
	/** Tooltip placement (default: 'top') */
	placement?: TooltipPlacement;
}
