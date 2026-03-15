/**
 * Tooltip - Platform Router
 *
 * Routes to the web (DOM Portal) or native (Modal) implementation
 */

import { Platform } from 'react-native';
import type { TooltipProps, InfoTooltipProps } from './Tooltip.types';

// Shared types — always available regardless of platform
export type { TooltipProps, InfoTooltipProps, TooltipPlacement, TooltipPosition } from './Tooltip.types';

// Platform-specific component exports
export const Tooltip: React.FC<TooltipProps> = Platform.OS === 'web'
	? require('./Tooltip.web').Tooltip
	: require('./Tooltip.native').Tooltip;

export const InfoTooltip: React.FC<InfoTooltipProps> = Platform.OS === 'web'
	? require('./Tooltip.web').InfoTooltip
	: require('./Tooltip.native').InfoTooltip;
