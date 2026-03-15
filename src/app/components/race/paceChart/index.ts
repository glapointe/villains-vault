/**
 * Pace Chart Component Export
 * Exports platform-specific implementations via require() so Metro
 * can tree-shake the unused platform branch.
 */
import { Platform } from 'react-native';
import type { PaceChartProps } from './PaceChart.types';

// Shared types - always available regardless of platform
export type { PaceChartProps } from './PaceChart.types';

// Platform-specific component exports
export const PaceChart: React.FC<PaceChartProps> = Platform.OS === 'web'
	? require('./PaceChart.web').PaceChart
	: require('./PaceChart.native').PaceChart;

export default PaceChart;