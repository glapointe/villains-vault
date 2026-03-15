/**
 * Kill Chart components barrel export
 * Exports platform-specific implementations via require() so Metro
 * can tree-shake the unused platform branch.
 */
import { Platform } from 'react-native';
import type { BulkKillChartProps } from './BulkKillChart.web'

// Shared types - always available regardless of platform
export type { BulkKillChartProps } from './BulkKillChart.web';

// Platform-specific component exports
export const BulkKillChart: React.FC<BulkKillChartProps> = Platform.OS === 'web'
	? require('./BulkKillChart.web').BulkKillChart
	: null; // No native implementation; export null to avoid bundling web dependencies

export default BulkKillChart;